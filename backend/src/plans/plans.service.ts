import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { CreatePlanDto, UpdatePlanDto, PlanStatus } from "./dto/plan.dto";
import { Plan, PlanStatus as PrismaPlanStatus } from "@prisma/client";

@Injectable()
export class PlansService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(userId: number, createPlanDto: CreatePlanDto) {
    const plan = await this.prisma.plan.create({
      data: {
        ...createPlanDto,
        startDate: new Date(createPlanDto.startDate),
        endDate: new Date(createPlanDto.endDate),
        userId,
      },
      include: {
        itineraries: {
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
        expenses: true,
        packingList: { include: { items: true } },
        user: { select: { id: true, name: true, avatar: true } },
        favorites: true,
      },
    });

    await this.redis.delPattern("plans:public:*");
    await this.redis.delPattern("plans:popular:*");

    return plan;
  }

  async findByUser(userId: number, status?: PlanStatus) {
    const where: any = { userId };

    if (status) {
      where.status = status as PrismaPlanStatus;
    }

    return this.prisma.plan.findMany({
      where,
      include: {
        itineraries: {
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
        expenses: true,
        packingList: { include: { items: true } },
        _count: { select: { favorites: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPublic(search?: string, limit?: number) {
    const cacheKey = `plans:public:${search || "all"}:${limit || "all"}`;
    const cached = await this.redis.get<any[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const where: any = { isPublic: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { destinationCity: { contains: search, mode: "insensitive" } },
      ];
    }

    const plans = await this.prisma.plan.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { favorites: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit || undefined,
    });

    await this.redis.set(cacheKey, plans, 300);

    return plans;
  }

  async getPopularDestinations() {
    const cacheKey = "plans:popular:destinations";
    const cached = await this.redis.get<any[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const destinations = await this.prisma.plan.groupBy({
      by: ["destinationCity"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    });

    const result = destinations.map((d) => ({
      city: d.destinationCity,
      planCount: d._count.id,
    }));

    await this.redis.set(cacheKey, result, 600);

    return result;
  }

  async getUpcoming(userId: number) {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 7);

    return this.prisma.plan.findMany({
      where: {
        userId,
        status: {
          in: [PrismaPlanStatus.PLANNING, PrismaPlanStatus.IN_PROGRESS],
        },
        startDate: { gte: now, lte: threeDaysLater },
      },
      orderBy: { startDate: "asc" },
    });
  }

  async findOne(id: number) {
    return this.prisma.plan.findUnique({
      where: { id },
      include: {
        itineraries: {
          include: { items: { orderBy: { sortOrder: "asc" } } },
          orderBy: { dayNumber: "asc" },
        },
        expenses: true,
        packingList: { include: { items: true } },
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { favorites: true } },
      },
    });
  }

  async update(id: number, updatePlanDto: UpdatePlanDto) {
    const data: any = { ...updatePlanDto };

    if (updatePlanDto.startDate) {
      data.startDate = new Date(updatePlanDto.startDate);
    }
    if (updatePlanDto.endDate) {
      data.endDate = new Date(updatePlanDto.endDate);
    }

    const plan = await this.prisma.plan.update({
      where: { id },
      data,
      include: {
        itineraries: {
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
        expenses: true,
        packingList: { include: { items: true } },
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { favorites: true } },
      },
    });

    await this.redis.delPattern("plans:public:*");
    await this.redis.delPattern("plans:popular:*");

    return plan;
  }

  async remove(id: number) {
    await this.prisma.plan.delete({ where: { id } });

    await this.redis.delPattern("plans:public:*");
    await this.redis.delPattern("plans:popular:*");

    return { success: true };
  }
}
