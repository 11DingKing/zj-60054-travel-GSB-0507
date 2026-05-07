import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateExpenseDto, UpdateExpenseDto } from "./dto/expense.dto";
import { ExpenseCategory } from "@prisma/client";

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(planId: number, createExpenseDto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        ...createExpenseDto,
        planId,
        date: new Date(createExpenseDto.date),
        category: createExpenseDto.category as ExpenseCategory,
      },
    });
  }

  async findByPlan(planId: number) {
    return this.prisma.expense.findMany({
      where: { planId },
      orderBy: { date: "desc" },
    });
  }

  async getSummary(planId: number) {
    const expenses = await this.prisma.expense.findMany({
      where: { planId },
    });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    const byCategory = expenses.reduce(
      (acc, e) => {
        const category = e.category as string;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += e.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalAmount,
      byCategory,
      count: expenses.length,
    };
  }

  async findOne(id: number) {
    return this.prisma.expense.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto) {
    const data: any = { ...updateExpenseDto };

    if (updateExpenseDto.date) {
      data.date = new Date(updateExpenseDto.date);
    }
    if (updateExpenseDto.category) {
      data.category = updateExpenseDto.category as ExpenseCategory;
    }

    return this.prisma.expense.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.prisma.expense.delete({ where: { id } });
    return { success: true };
  }
}
