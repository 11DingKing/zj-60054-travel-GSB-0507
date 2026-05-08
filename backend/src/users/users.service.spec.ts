import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("UsersService", () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    plan: {
      findMany: jest.Mock;
    };
  };

  const mockUser = {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      plan: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findById", () => {
    it("should return user by id", async () => {
      const result = await service.findById(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          select: expect.objectContaining({
            id: true,
            email: true,
            name: true,
          }),
        }),
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update user", async () => {
      const dto = { name: "Updated Name" };
      const result = await service.update(1, dto as any);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: dto,
        }),
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe("getUserStatistics", () => {
    it("should return statistics with zeros when no completed plans", async () => {
      const result = await service.getUserStatistics(1);

      expect(result).toEqual({
        citiesCount: 0,
        citiesVisited: [],
        totalDays: 0,
        totalSpent: 0,
        completedPlansCount: 0,
      });
    });

    it("should calculate statistics from completed plans", async () => {
      prisma.plan.findMany.mockResolvedValue([
        {
          destinationCity: "Tokyo",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-01-07"),
          expenses: [{ amount: 1000 }, { amount: 500 }],
        },
        {
          destinationCity: "Paris",
          startDate: new Date("2025-03-01"),
          endDate: new Date("2025-03-05"),
          expenses: [{ amount: 2000 }],
        },
      ]);

      const result = await service.getUserStatistics(1);

      expect(result.citiesCount).toBe(2);
      expect(result.citiesVisited).toEqual(["Tokyo", "Paris"]);
      expect(result.totalDays).toBe(12);
      expect(result.totalSpent).toBe(3500);
      expect(result.completedPlansCount).toBe(2);
    });

    it("should deduplicate cities visited", async () => {
      prisma.plan.findMany.mockResolvedValue([
        {
          destinationCity: "Tokyo",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-01-03"),
          expenses: [],
        },
        {
          destinationCity: "Tokyo",
          startDate: new Date("2025-02-01"),
          endDate: new Date("2025-02-03"),
          expenses: [],
        },
      ]);

      const result = await service.getUserStatistics(1);

      expect(result.citiesCount).toBe(1);
      expect(result.citiesVisited).toEqual(["Tokyo"]);
    });
  });
});
