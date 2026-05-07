import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ExpenseCategory, PlanStatus } from "@prisma/client";

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getCityDistribution(userId: number) {
    const plans = await this.prisma.plan.findMany({
      where: { userId, status: PlanStatus.COMPLETED },
      select: { destinationCity: true },
    });

    const cityMap = new Map<string, number>();
    plans.forEach((p) => {
      cityMap.set(p.destinationCity, (cityMap.get(p.destinationCity) || 0) + 1);
    });

    return Array.from(cityMap.entries()).map(([city, count]) => ({
      city,
      count,
    }));
  }

  async getMonthlyFrequency(userId: number) {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      const count = await this.prisma.plan.count({
        where: {
          userId,
          status: PlanStatus.COMPLETED,
          startDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      months.push({
        month: `${year}-${String(month + 1).padStart(2, "0")}`,
        count,
      });
    }

    return months;
  }

  async getExpenseCategories(userId: number) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        plan: { userId },
      },
      select: { category: true, amount: true },
    });

    const categoryMap = new Map<string, number>();
    expenses.forEach((e) => {
      const category = e.category as string;
      categoryMap.set(category, (categoryMap.get(category) || 0) + e.amount);
    });

    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
  }

  async getBudgetVsActual(userId: number) {
    const plans = await this.prisma.plan.findMany({
      where: {
        userId,
        status: PlanStatus.COMPLETED,
      },
      include: { expenses: true },
      orderBy: { startDate: "asc" },
    });

    return plans.map((plan) => {
      const actual = plan.expenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        title: plan.title,
        budget: plan.budget,
        actual,
        difference: actual - plan.budget,
      };
    });
  }
}
