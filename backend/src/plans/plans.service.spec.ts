import { Test, TestingModule } from "@nestjs/testing";
import { PlansService } from "./plans.service";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { PlanStatus } from "@prisma/client";

describe("PlansService", () => {
  let service: PlansService;
  let prisma: {
    plan: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      groupBy: jest.Mock;
    };
  };
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    delPattern: jest.Mock;
  };

  const mockPlan = {
    id: 1,
    title: "Tokyo Trip",
    destinationCity: "Tokyo",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-01-07"),
    budget: 10000,
    coverImage: null,
    status: PlanStatus.PLANNING,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 1,
    itineraries: [],
    expenses: [],
    packingList: null,
    user: { id: 1, name: "Test User", avatar: null },
    favorites: [],
  };

  beforeEach(async () => {
    prisma = {
      plan: {
        create: jest.fn().mockResolvedValue(mockPlan),
        findMany: jest.fn().mockResolvedValue([mockPlan]),
        findUnique: jest.fn().mockResolvedValue(mockPlan),
        update: jest.fn().mockResolvedValue(mockPlan),
        delete: jest.fn().mockResolvedValue(mockPlan),
        groupBy: jest.fn().mockResolvedValue([
          { destinationCity: "Tokyo", _count: { id: 3 } },
        ]),
      },
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      delPattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a plan and invalidate cache", async () => {
      const dto = {
        title: "Tokyo Trip",
        destinationCity: "Tokyo",
        startDate: "2025-01-01",
        endDate: "2025-01-07",
        budget: 10000,
      };

      const result = await service.create(1, dto as any);

      expect(prisma.plan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ...dto,
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            userId: 1,
          }),
        }),
      );
      expect(redis.delPattern).toHaveBeenCalledWith("plans:public:*");
      expect(redis.delPattern).toHaveBeenCalledWith("plans:popular:*");
      expect(result).toEqual(mockPlan);
    });
  });

  describe("findByUser", () => {
    it("should return plans for a user", async () => {
      const result = await service.findByUser(1);

      expect(prisma.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
        }),
      );
      expect(result).toEqual([mockPlan]);
    });

    it("should filter by status when provided", async () => {
      const result = await service.findByUser(1, PlanStatus.COMPLETED);

      expect(prisma.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, status: PlanStatus.COMPLETED },
        }),
      );
      expect(result).toEqual([mockPlan]);
    });
  });

  describe("findPublic", () => {
    it("should return cached plans when available", async () => {
      redis.get.mockResolvedValue([mockPlan]);

      const result = await service.findPublic();

      expect(redis.get).toHaveBeenCalledWith("plans:public:all:all");
      expect(prisma.plan.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([mockPlan]);
    });

    it("should query database and cache result when no cache", async () => {
      const result = await service.findPublic();

      expect(redis.get).toHaveBeenCalledWith("plans:public:all:all");
      expect(prisma.plan.findMany).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith(
        "plans:public:all:all",
        [mockPlan],
        300,
      );
      expect(result).toEqual([mockPlan]);
    });

    it("should filter by search term", async () => {
      const result = await service.findPublic("Tokyo");

      expect(prisma.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublic: true,
            OR: expect.arrayContaining([
              { title: { contains: "Tokyo", mode: "insensitive" } },
              { destinationCity: { contains: "Tokyo", mode: "insensitive" } },
            ]),
          }),
        }),
      );
      expect(result).toEqual([mockPlan]);
    });

    it("should limit results when limit is provided", async () => {
      await service.findPublic(undefined, 5);

      expect(prisma.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe("getPopularDestinations", () => {
    it("should return cached destinations when available", async () => {
      const cached = [{ city: "Tokyo", planCount: 3 }];
      redis.get.mockResolvedValue(cached);

      const result = await service.getPopularDestinations();

      expect(redis.get).toHaveBeenCalledWith("plans:popular:destinations");
      expect(prisma.plan.groupBy).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it("should query database and cache result when no cache", async () => {
      const result = await service.getPopularDestinations();

      expect(prisma.plan.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ["destinationCity"],
          take: 6,
        }),
      );
      expect(redis.set).toHaveBeenCalledWith(
        "plans:popular:destinations",
        [{ city: "Tokyo", planCount: 3 }],
        600,
      );
      expect(result).toEqual([{ city: "Tokyo", planCount: 3 }]);
    });
  });

  describe("getUpcoming", () => {
    it("should return upcoming plans within 7 days", async () => {
      const result = await service.getUpcoming(1);

      expect(prisma.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            status: { in: [PlanStatus.PLANNING, PlanStatus.IN_PROGRESS] },
          }),
        }),
      );
      expect(result).toEqual([mockPlan]);
    });
  });

  describe("findOne", () => {
    it("should return a single plan by id", async () => {
      const result = await service.findOne(1);

      expect(prisma.plan.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
      expect(result).toEqual(mockPlan);
    });
  });

  describe("update", () => {
    it("should update a plan and invalidate cache", async () => {
      const dto = { title: "Updated Trip" };
      const result = await service.update(1, dto as any);

      expect(prisma.plan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: dto,
        }),
      );
      expect(redis.delPattern).toHaveBeenCalledWith("plans:public:*");
      expect(redis.delPattern).toHaveBeenCalledWith("plans:popular:*");
      expect(result).toEqual(mockPlan);
    });

    it("should convert startDate string to Date", async () => {
      const dto = { startDate: "2025-02-01" };
      await service.update(1, dto as any);

      expect(prisma.plan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startDate: expect.any(Date),
          }),
        }),
      );
    });

    it("should convert endDate string to Date", async () => {
      const dto = { endDate: "2025-02-07" };
      await service.update(1, dto as any);

      expect(prisma.plan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            endDate: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe("remove", () => {
    it("should delete a plan and invalidate cache", async () => {
      const result = await service.remove(1);

      expect(prisma.plan.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(redis.delPattern).toHaveBeenCalledWith("plans:public:*");
      expect(redis.delPattern).toHaveBeenCalledWith("plans:popular:*");
      expect(result).toEqual({ success: true });
    });
  });
});
