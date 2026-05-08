import { Test, TestingModule } from "@nestjs/testing";
import { StatisticsService } from "./statistics.service";
import { PrismaService } from "../prisma/prisma.service";

describe("StatisticsService", () => {
  let service: StatisticsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: PrismaService,
          useValue: {
            plan: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            expense: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    prisma = module.get(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getCityDistribution", () => {
    it("should return city distribution", async () => {
      const plans = [
        { destinationCity: "北京" },
        { destinationCity: "上海" },
        { destinationCity: "北京" },
      ];

      jest.spyOn(prisma.plan, "findMany").mockResolvedValue(plans as any);

      const result = await service.getCityDistribution(1);

      expect(result).toEqual(
        expect.arrayContaining([
          { city: "北京", count: 2 },
          { city: "上海", count: 1 },
        ]),
      );
    });

    it("should return empty array when no plans", async () => {
      jest.spyOn(prisma.plan, "findMany").mockResolvedValue([]);

      const result = await service.getCityDistribution(1);

      expect(result).toEqual([]);
    });
  });

  describe("getMonthlyFrequency", () => {
    it("should return monthly frequency for 12 months", async () => {
      jest.spyOn(prisma.plan, "count").mockResolvedValue(0);

      const result = await service.getMonthlyFrequency(1);

      expect(result).toHaveLength(12);
      result.forEach((item) => {
        expect(item).toHaveProperty("month");
        expect(item).toHaveProperty("count");
        expect(item.month).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    it("should return correct counts", async () => {
      let callCount = 0;
      jest.spyOn(prisma.plan, "count").mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount % 2 === 0 ? 5 : 3) as any;
      });

      const result = await service.getMonthlyFrequency(1);

      expect(result).toHaveLength(12);
      const counts = result.map((r) => r.count);
      expect(counts.filter((c) => c === 3).length).toBe(6);
      expect(counts.filter((c) => c === 5).length).toBe(6);
    });
  });

  describe("getExpenseCategories", () => {
    it("should aggregate expenses by category", async () => {
      const expenses = [
        { category: "TRANSPORTATION", amount: 500 },
        { category: "ACCOMMODATION", amount: 1000 },
        { category: "TRANSPORTATION", amount: 300 },
        { category: "DINING", amount: 200 },
      ];

      jest.spyOn(prisma.expense, "findMany").mockResolvedValue(expenses as any);

      const result = await service.getExpenseCategories(1);

      expect(result).toEqual(
        expect.arrayContaining([
          { category: "TRANSPORTATION", amount: 800 },
          { category: "ACCOMMODATION", amount: 1000 },
          { category: "DINING", amount: 200 },
        ]),
      );
    });

    it("should return empty array when no expenses", async () => {
      jest.spyOn(prisma.expense, "findMany").mockResolvedValue([]);

      const result = await service.getExpenseCategories(1);

      expect(result).toEqual([]);
    });
  });

  describe("getBudgetVsActual", () => {
    it("should calculate budget vs actual for each plan", async () => {
      const plans = [
        {
          title: "Trip 1",
          budget: 5000,
          expenses: [
            { amount: 1000 },
            { amount: 2000 },
          ],
        },
        {
          title: "Trip 2",
          budget: 3000,
          expenses: [{ amount: 3500 }],
        },
      ];

      jest.spyOn(prisma.plan, "findMany").mockResolvedValue(plans as any);

      const result = await service.getBudgetVsActual(1);

      expect(result).toEqual([
        { title: "Trip 1", budget: 5000, actual: 3000, difference: -2000 },
        { title: "Trip 2", budget: 3000, actual: 3500, difference: 500 },
      ]);
    });

    it("should return empty array when no plans", async () => {
      jest.spyOn(prisma.plan, "findMany").mockResolvedValue([]);

      const result = await service.getBudgetVsActual(1);

      expect(result).toEqual([]);
    });
  });
});
