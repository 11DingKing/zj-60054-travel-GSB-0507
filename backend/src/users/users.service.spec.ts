import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("UsersService", () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            plan: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findById", () => {
    it("should return user when found", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser as any);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException when user not found", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update user", async () => {
      const updateDto = { name: "Updated User" };
      const updatedUser = {
        id: 1,
        email: "test@example.com",
        name: "Updated User",
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, "update").mockResolvedValue(updatedUser as any);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
        select: expect.any(Object),
      });
    });

    it("should throw NotFoundException when user not found", async () => {
      jest.spyOn(prisma.user, "update").mockRejectedValue(new Error("Not found") as any);

      await expect(service.update(999, {})).rejects.toThrow();
    });
  });

  describe("getUserStatistics", () => {
    it("should calculate statistics correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-05");
      const mockPlans = [
        {
          destinationCity: "北京",
          startDate,
          endDate,
          expenses: [
            { amount: 100 },
            { amount: 200 },
          ],
        },
        {
          destinationCity: "上海",
          startDate,
          endDate,
          expenses: [
            { amount: 150 },
          ],
        },
        {
          destinationCity: "北京",
          startDate,
          endDate,
          expenses: [],
        },
      ];

      jest.spyOn(prisma.plan, "findMany").mockResolvedValue(mockPlans as any);

      const result = await service.getUserStatistics(1);

      expect(result.citiesCount).toBe(2);
      expect(result.citiesVisited).toEqual(expect.arrayContaining(["北京", "上海"]));
      expect(result.totalDays).toBe(15);
      expect(result.totalSpent).toBe(450);
      expect(result.completedPlansCount).toBe(3);
    });

    it("should return zero statistics when no plans", async () => {
      jest.spyOn(prisma.plan, "findMany").mockResolvedValue([]);

      const result = await service.getUserStatistics(1);

      expect(result).toEqual({
        citiesCount: 0,
        citiesVisited: [],
        totalDays: 0,
        totalSpent: 0,
        completedPlansCount: 0,
      });
    });
  });
});
