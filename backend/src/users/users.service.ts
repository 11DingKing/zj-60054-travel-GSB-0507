import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    return user;
  }

  async getUserStatistics(userId: number) {
    const completedPlans = await this.prisma.plan.findMany({
      where: { userId, status: "COMPLETED" },
      include: {
        expenses: true,
      },
    });

    const citiesVisited = new Set<string>();
    let totalDays = 0;
    let totalSpent = 0;

    completedPlans.forEach((plan) => {
      citiesVisited.add(plan.destinationCity);
      const days =
        Math.ceil(
          (plan.endDate.getTime() - plan.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;
      totalDays += days;

      plan.expenses.forEach((expense) => {
        totalSpent += expense.amount;
      });
    });

    return {
      citiesCount: citiesVisited.size,
      citiesVisited: Array.from(citiesVisited),
      totalDays,
      totalSpent,
      completedPlansCount: completedPlans.length,
    };
  }
}
