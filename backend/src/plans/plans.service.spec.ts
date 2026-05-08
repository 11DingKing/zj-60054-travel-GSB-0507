import { Test, TestingModule } from "@nestjs/testing";
import { PlansService } from "./plans.service";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

describe("PlansService", () => {
  let service: PlansService;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        {
          provide: PrismaService,
          useValue: {
            plan: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              groupBy: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delPattern: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a plan and invalidate cache", async () => {
      const createDto = {
        title: "Test Plan",
        destinationCity: "北京",
        startDate: "2024-01-01",
        endDate: "2024-01-05",
        budget: 1000,
      };

      const createdPlan = {
        id: 1,
        ...createDto,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-05"),
        userId: 1,
        status: "PLANNING",
        isPublic: false,
        coverImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        itineraries: [],
        expenses: [],
        packingList: null,
        user: { id: 1, name: "Test User", avatar: null },
        favorites: [],
      };

      jest.spyOn(prisma.plan, "create").mockResolvedValue(createdPlan as any);

      const result = await service.create(1, createDto as any);

      expect(result).toEqual(createdPlan);
      expect(redis.delPattern).toHaveBeenCalledWith("plans:public:*");
      expect(redis.delPattern).toHaveBeenCalledWith("plans:popular:*");
    });
  });

  describe("findByUser", () => {
    it("should find plans by user without status filter", async () => {
      const mockPlans = [{ id: 1, title: "Test Plan" }];
      jest.spyOn(prisma.plan, "findMany").mockResolvedValue(mockPlans as any);

      const result = await service.findByUser(1);

      expect(result).toEqual(mockPlans);
      expect(prisma.plan.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });

    it("should find plans by user with status filter", async () => {
      const mockPlans = [{ id: 1, title: "Test Plan", status: "COMPLETED" }];
      jest.spyOn(prisma.plan, "findMany").mockResolvedValue(mockPlans as any);

      const result = await service.findByUser(1, "COMPLETED");

      expect(result).toEqual(mockPlans);
      expect(prisma.plan.findMany).toHaveBeenCalledWith({
        where: { userId: 1, status: "COMPLETED" },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });
  });

  describe("findPublic", () => {
    it("should return cached data if available", async () => {
      const cachedPlans = [{ id: 1, title: "Cached Plan" }];
      jest.spyOn(redis, "get").mockResolvedValue(cachedPlans);

      const result = await service.findPublic();

      expect(result).toEqual(cachedPlans);
      expect(prisma.plan.findMany).not.toHaveBeenCalled();
    });

    it("should fetch from database and cache when no cache", async () => {
      const plans = [{ id: 1, title: "Public Plan" }];
      jest.spyOn(redis, "get").mockResolvedValue(null);
      jest.spyOn(prisma.plan, "findMany").mockResolvedValue(plans as any);

      const result = await service.findPublic();

      expect(result).toEqual(plans);
      expect(redis.set).toHaveBeenCalledWith("plans:public:all:all", plans, 300);
    });

    it("should search with keyword and limit", async () => {
      const plans = [{ id: 1, title: "Beijing Trip" }];
      jest.spyOn(redis, "get").mockResolvedValue(null);
      jest.spyOn(prisma.plan, "findMany").mockResolvedValue(plans as any);

      const result = await service.findPublic("beijing", 10);

      expect(result).toEqual(plans);
      expect(redis.get).toHaveBeenCalledWith("plans:public:beijing:10");
      expect(prisma.plan.findMany).toHaveBeenCalledWith({
        where: {
          isPublic: true,
          OR: expect.any(Array),
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 10,
      });
    });
  });

  describe("getPopularDestinations", () => {
    it("should return cached data if available", async () => {
      const cachedDestinations = [{ city: "北京", planCount: 10 }];
      jest.spyOn(redis, "get").mockResolvedValue(cachedDestinations);

      const result = await service.getPopularDestinations();

      expect(result).toEqual(cachedDestinations);
      expect(prisma.plan.groupBy).not.toHaveBeenCalled();
    });

    it("should fetch from database and cache when no cache", async () => {
      const destinations = [
        { destinationCity: "北京", _count: { id: 10 } },
        { destinationCity: "上海", _count: { id: 8 } },
      ];
      jest.spyOn(redis, "get").mockResolvedValue(null);
      jest.spyOn(prisma.plan, "groupBy").mockResolvedValue(destinations as any);

      const result = await service.getPopularDestinations();

      expect(result).toEqual([
        { city: "北京", planCount: 10 },
        { city: "上海", planCount: 8 },
      ]);
      expect(redis.set).toHaveBeenCalledWith(
        "plans:popular:destinations",
        expect.any(Array),
        600,
      );
    });
  });

  describe("findOne", () => {
    it("should find a plan by id", async () => {
      const mockPlan = { id: 1, title: "Test Plan" };
      jest.spyOn(prisma.plan, "findUnique").mockResolvedValue(mockPlan as any);

      const result = await service.findOne(1);

      expect(result).toEqual(mockPlan);
    });
  });

  describe("update", () => {
    it("should update a plan and invalidate cache", async () => {
      const updateDto = { title: "Updated Plan" };
      const updatedPlan = { id: 1, title: "Updated Plan" };

      jest.spyOn(prisma.plan, "update").mockResolvedValue(updatedPlan as any);

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(updatedPlan);
      expect(redis.delPattern).toHaveBeenCalledWith("plans:public:*");
      expect(redis.delPattern).toHaveBeenCalledWith("plans:popular:*");
    });
  });

  describe("remove", () => {
    it("should remove a plan and invalidate cache", async () => {
      jest.spyOn(prisma.plan, "delete").mockResolvedValue({ id: 1 } as any);

      const result = await service.remove(1);

      expect(result).toEqual({ success: true });
      expect(redis.delPattern).toHaveBeenCalledWith("plans:public:*");
      expect(redis.delPattern).toHaveBeenCalledWith("plans:popular:*");
    });
  });
});
