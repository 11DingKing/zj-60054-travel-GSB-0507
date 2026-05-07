import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: number) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        plan: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            _count: { select: { favorites: true } },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return favorites.map((f) => f.plan);
  }

  async add(userId: number, planId: number) {
    return this.prisma.favorite.upsert({
      where: {
        userId_planId: { userId, planId },
      },
      update: {},
      create: {
        userId,
        planId,
      },
    });
  }

  async remove(userId: number, planId: number) {
    try {
      await this.prisma.favorite.delete({
        where: {
          userId_planId: { userId, planId },
        },
      });
    } catch (e) {
      // 如果已不存在，忽略错误
    }
    return { success: true };
  }

  async isFavorite(userId: number, planId: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_planId: { userId, planId },
      },
    });

    return !!favorite;
  }
}
