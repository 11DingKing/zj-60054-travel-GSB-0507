import { Test, TestingModule } from "@nestjs/testing";
import { ExpensesService } from "./expenses.service";
import { PrismaService } from "../prisma/prisma.service";

describe("ExpensesService", () => {
  let service: ExpensesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: PrismaService,
          useValue: {
            expense: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    prisma = module.get(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create an expense", async () => {
      const createDto = {
        amount: 500,
        category: "TRANSPORTATION",
        date: "2024-01-01",
        notes: "Flight ticket",
      };

      const createdExpense = {
        id: 1,
        ...createDto,
        date: new Date("2024-01-01"),
        planId: 1,
      };

      jest.spyOn(prisma.expense, "create").mockResolvedValue(createdExpense as any);

      const result = await service.create(1, createDto as any);

      expect(result).toEqual(createdExpense);
    });
  });

  describe("findByPlan", () => {
    it("should find expenses by plan", async () => {
      const mockExpenses = [
        { id: 1, amount: 500 },
        { id: 2, amount: 300 },
      ];
      jest.spyOn(prisma.expense, "findMany").mockResolvedValue(mockExpenses as any);

      const result = await service.findByPlan(1);

      expect(result).toEqual(mockExpenses);
    });
  });

  describe("getSummary", () => {
    it("should calculate summary correctly", async () => {
      const expenses = [
        { category: "TRANSPORTATION", amount: 500 },
        { category: "ACCOMMODATION", amount: 1000 },
        { category: "TRANSPORTATION", amount: 300 },
        { category: "DINING", amount: 200 },
      ];

      jest.spyOn(prisma.expense, "findMany").mockResolvedValue(expenses as any);

      const result = await service.getSummary(1);

      expect(result.totalAmount).toBe(2000);
      expect(result.count).toBe(4);
      expect(result.byCategory).toEqual({
        TRANSPORTATION: 800,
        ACCOMMODATION: 1000,
        DINING: 200,
      });
    });

    it("should return zero summary when no expenses", async () => {
      jest.spyOn(prisma.expense, "findMany").mockResolvedValue([]);

      const result = await service.getSummary(1);

      expect(result).toEqual({
        totalAmount: 0,
        byCategory: {},
        count: 0,
      });
    });
  });

  describe("findOne", () => {
    it("should find an expense by id", async () => {
      const mockExpense = { id: 1, amount: 500 };
      jest.spyOn(prisma.expense, "findUnique").mockResolvedValue(mockExpense as any);

      const result = await service.findOne(1);

      expect(result).toEqual(mockExpense);
    });
  });

  describe("update", () => {
    it("should update an expense", async () => {
      const updateDto = { amount: 600 };
      const updatedExpense = { id: 1, amount: 600 };

      jest.spyOn(prisma.expense, "update").mockResolvedValue(updatedExpense as any);

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(updatedExpense);
    });

    it("should convert date and category fields", async () => {
      const updateDto = {
        date: "2024-01-02",
        category: "DINING",
      };

      jest.spyOn(prisma.expense, "update").mockResolvedValue({ id: 1 } as any);

      await service.update(1, updateDto as any);

      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          date: expect.any(Date),
          category: "DINING",
        },
      });
    });
  });

  describe("remove", () => {
    it("should remove an expense", async () => {
      jest.spyOn(prisma.expense, "delete").mockResolvedValue({ id: 1 } as any);

      const result = await service.remove(1);

      expect(result).toEqual({ success: true });
    });
  });
});
