import { Test, TestingModule } from "@nestjs/testing";
import { FavoritesService } from "./favorites.service";
import { PrismaService } from "../prisma/prisma.service";

describe("FavoritesService", () => {
  let service: FavoritesService;
  let prisma: {
    favorite: {
      findMany: jest.Mock;
      upsert: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const mockPlan = {
    id: 1,
    title: "Tokyo Trip",
    user: { id: 1, name: "Test User", avatar: null },
    _count: { favorites: 5 },
  };

  beforeEach(async () => {
    prisma = {
      favorite: {
        findMany: jest.fn().mockResolvedValue([{ id: 1, userId: 1, planId: 1, plan: mockPlan }]),
        upsert: jest.fn().mockResolvedValue({ id: 1, userId: 1, planId: 1 }),
        delete: jest.fn().mockResolvedValue({ id: 1, userId: 1, planId: 1 }),
        findUnique: jest.fn().mockResolvedValue({ id: 1, userId: 1, planId: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FavoritesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByUser", () => {
    it("should return plans favorited by user", async () => {
      const result = await service.findByUser(1);

      expect(prisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
        }),
      );
      expect(result).toEqual([mockPlan]);
    });
  });

  describe("add", () => {
    it("should upsert a favorite", async () => {
      const result = await service.add(1, 2);

      expect(prisma.favorite.upsert).toHaveBeenCalledWith({
        where: { userId_planId: { userId: 1, planId: 2 } },
        update: {},
        create: { userId: 1, planId: 2 },
      });
      expect(result).toEqual({ id: 1, userId: 1, planId: 1 });
    });
  });

  describe("remove", () => {
    it("should delete a favorite", async () => {
      const result = await service.remove(1, 2);

      expect(prisma.favorite.delete).toHaveBeenCalledWith({
        where: { userId_planId: { userId: 1, planId: 2 } },
      });
      expect(result).toEqual({ success: true });
    });

    it("should ignore error when favorite does not exist", async () => {
      prisma.favorite.delete.mockRejectedValue(new Error("Not found"));

      const result = await service.remove(1, 2);

      expect(result).toEqual({ success: true });
    });
  });

  describe("isFavorite", () => {
    it("should return true when favorite exists", async () => {
      const result = await service.isFavorite(1, 2);

      expect(prisma.favorite.findUnique).toHaveBeenCalledWith({
        where: { userId_planId: { userId: 1, planId: 2 } },
      });
      expect(result).toBe(true);
    });

    it("should return false when favorite does not exist", async () => {
      prisma.favorite.findUnique.mockResolvedValue(null);

      const result = await service.isFavorite(1, 2);

      expect(result).toBe(false);
    });
  });
});
