import { Test, TestingModule } from "@nestjs/testing";
import { StatisticsService } from "./statistics.service";
import { PrismaService } from "../prisma/prisma.service";
import { ExpenseCategory, PlanStatus } from "@prisma/client";

describe("StatisticsService", () => {
  let service: StatisticsService;
  let prisma: {
    plan: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
    expense: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      plan: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      expense: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getCityDistribution", () => {
    it("should return empty array when no completed plans", async () => {
      const result = await service.getCityDistribution(1);

      expect(prisma.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, status: PlanStatus.COMPLETED },
        }),
      );
      expect(result).toEqual([]);
    });

    it("should group completed plans by destination city", async () => {
      prisma.plan.findMany.mockResolvedValue([
        { destinationCity: "Tokyo" },
        { destinationCity: "Tokyo" },
        { destinationCity: "Paris" },
      ]);

      const result = await service.getCityDistribution(1);

      expect(result).toEqual([
        { city: "Tokyo", count: 2 },
        { city: "Paris", count: 1 },
      ]);
    });
  });

  describe("getMonthlyFrequency", () => {
    it("should return 12 months of data", async () => {
      const result = await service.getMonthlyFrequency(1);

      expect(result).toHaveLength(12);
      expect(prisma.plan.count).toHaveBeenCalledTimes(12);
    });

    it("should return months in YYYY-MM format", async () => {
      const result = await service.getMonthlyFrequency(1);

      result.forEach((entry) => {
        expect(entry.month).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    it("should include counts from database", async () => {
      prisma.plan.count.mockResolvedValue(3);

      const result = await service.getMonthlyFrequency(1);

      expect(result[0].count).toBe(3);
    });
  });

  describe("getExpenseCategories", () => {
    it("should return empty array when no expenses", async () => {
      const result = await service.getExpenseCategories(1);

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { plan: { userId: 1 } },
        }),
      );
      expect(result).toEqual([]);
    });

    it("should group expenses by category and sum amounts", async () => {
      prisma.expense.findMany.mockResolvedValue([
        { category: ExpenseCategory.DINING, amount: 100 },
        { category: ExpenseCategory.DINING, amount: 50 },
        { category: ExpenseCategory.TRANSPORTATION, amount: 200 },
      ]);

      const result = await service.getExpenseCategories(1);

      expect(result).toEqual([
        { category: "DINING", amount: 150 },
        { category: "TRANSPORTATION", amount: 200 },
      ]);
    });
  });

  describe("getBudgetVsActual", () => {
    it("should return empty array when no completed plans", async () => {
      const result = await service.getBudgetVsActual(1);

      expect(prisma.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, status: PlanStatus.COMPLETED },
          include: { expenses: true },
        }),
      );
      expect(result).toEqual([]);
    });

    it("should calculate budget vs actual for completed plans", async () => {
      prisma.plan.findMany.mockResolvedValue([
        {
          title: "Tokyo Trip",
          budget: 10000,
          expenses: [
            { amount: 3000 },
            { amount: 2000 },
          ],
        },
        {
          title: "Paris Trip",
          budget: 8000,
          expenses: [{ amount: 9000 }],
        },
      ]);

      const result = await service.getBudgetVsActual(1);

      expect(result).toEqual([
        { title: "Tokyo Trip", budget: 10000, actual: 5000, difference: -5000 },
        { title: "Paris Trip", budget: 8000, actual: 9000, difference: 1000 },
      ]);
    });

    it("should handle plans with no expenses", async () => {
      prisma.plan.findMany.mockResolvedValue([
        {
          title: "Free Trip",
          budget: 5000,
          expenses: [],
        },
      ]);

      const result = await service.getBudgetVsActual(1);

      expect(result).toEqual([
        { title: "Free Trip", budget: 5000, actual: 0, difference: -5000 },
      ]);
    });
  });
});
