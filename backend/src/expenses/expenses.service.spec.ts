import { Test, TestingModule } from "@nestjs/testing";
import { ExpensesService } from "./expenses.service";
import { PrismaService } from "../prisma/prisma.service";
import { ExpenseCategory } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

describe("ExpensesService", () => {
  let service: ExpensesService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockExpense = {
    id: 1,
    planId: 1,
    amount: 100,
    category: ExpenseCategory.DINING,
    date: new Date("2025-01-01"),
    notes: null,
  };

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    prisma.expense.create.mockResolvedValue(mockExpense as any);
    prisma.expense.findMany.mockResolvedValue([mockExpense] as any);
    prisma.expense.findUnique.mockResolvedValue(mockExpense as any);
    prisma.expense.update.mockResolvedValue(mockExpense as any);
    prisma.expense.delete.mockResolvedValue(mockExpense as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpensesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create an expense", async () => {
      const dto = {
        amount: 100,
        category: ExpenseCategory.DINING,
        date: "2025-01-01",
      };

      const result = await service.create(1, dto as any);

      expect(prisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ...dto,
            planId: 1,
            date: expect.any(Date),
            category: ExpenseCategory.DINING,
          }),
        }),
      );
      expect(result).toEqual(mockExpense);
    });
  });

  describe("findByPlan", () => {
    it("should return expenses for a plan", async () => {
      const result = await service.findByPlan(1);

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: { planId: 1 },
        orderBy: { date: "desc" },
      });
      expect(result).toEqual([mockExpense]);
    });
  });

  describe("getSummary", () => {
    it("should return summary with total, byCategory, and count", async () => {
      prisma.expense.findMany.mockResolvedValue([
        { amount: 100, category: ExpenseCategory.DINING },
        { amount: 50, category: ExpenseCategory.DINING },
        { amount: 200, category: ExpenseCategory.TRANSPORTATION },
      ] as any);

      const result = await service.getSummary(1);

      expect(result).toEqual({
        totalAmount: 350,
        byCategory: { DINING: 150, TRANSPORTATION: 200 },
        count: 3,
      });
    });

    it("should handle empty expenses", async () => {
      prisma.expense.findMany.mockResolvedValue([] as any);

      const result = await service.getSummary(1);

      expect(result).toEqual({
        totalAmount: 0,
        byCategory: {},
        count: 0,
      });
    });
  });

  describe("findOne", () => {
    it("should return a single expense by id", async () => {
      const result = await service.findOne(1);

      expect(prisma.expense.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockExpense);
    });
  });

  describe("update", () => {
    it("should update an expense", async () => {
      const dto = { amount: 200 };
      const result = await service.update(1, dto as any);

      expect(prisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: dto,
        }),
      );
      expect(result).toEqual(mockExpense);
    });

    it("should convert date string to Date on update", async () => {
      const dto = { date: "2025-02-01" };
      await service.update(1, dto as any);

      expect(prisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date: expect.any(Date) }),
        }),
      );
    });
  });

  describe("remove", () => {
    it("should delete an expense", async () => {
      const result = await service.remove(1);

      expect(prisma.expense.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ success: true });
    });
  });
});
