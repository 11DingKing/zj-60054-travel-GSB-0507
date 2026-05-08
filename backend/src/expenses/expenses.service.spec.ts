import { Test, TestingModule } from "@nestjs/testing";
import { ExpensesService } from "./expenses.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

describe("ExpensesService", () => {
  let service: ExpensesService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    prisma = module.get(PrismaService) as DeepMockProxy<PrismaService>;
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

      prisma.expense.create.mockResolvedValue(createdExpense as any);

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
      prisma.expense.findMany.mockResolvedValue(mockExpenses as any);

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

      prisma.expense.findMany.mockResolvedValue(expenses as any);

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
      prisma.expense.findMany.mockResolvedValue([]);

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
      prisma.expense.findUnique.mockResolvedValue(mockExpense as any);

      const result = await service.findOne(1);

      expect(result).toEqual(mockExpense);
    });
  });

  describe("update", () => {
    it("should update an expense", async () => {
      const updateDto = { amount: 600 };
      const updatedExpense = { id: 1, amount: 600 };

      prisma.expense.update.mockResolvedValue(updatedExpense as any);

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(updatedExpense);
    });

    it("should convert date and category fields", async () => {
      const updateDto = {
        date: "2024-01-02",
        category: "DINING",
      };

      prisma.expense.update.mockResolvedValue({ id: 1 } as any);

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
      prisma.expense.delete.mockResolvedValue({ id: 1 } as any);

      const result = await service.remove(1);

      expect(result).toEqual({ success: true });
    });
  });
});
