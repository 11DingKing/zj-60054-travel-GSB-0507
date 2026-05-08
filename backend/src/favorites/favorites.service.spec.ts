import { Test, TestingModule } from "@nestjs/testing";
import { FavoritesService } from "./favorites.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

describe("FavoritesService", () => {
  let service: FavoritesService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    prisma = module.get(PrismaService) as DeepMockProxy<PrismaService>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByUser", () => {
    it("should return plans from favorites", async () => {
      const mockFavorites = [
        { id: 1, plan: { id: 1, title: "Plan 1" } },
        { id: 2, plan: { id: 2, title: "Plan 2" } },
      ];

      prisma.favorite.findMany.mockResolvedValue(mockFavorites as any);

      const result = await service.findByUser(1);

      expect(result).toEqual([
        { id: 1, title: "Plan 1" },
        { id: 2, title: "Plan 2" },
      ]);
    });

    it("should return empty array when no favorites", async () => {
      prisma.favorite.findMany.mockResolvedValue([]);

      const result = await service.findByUser(1);

      expect(result).toEqual([]);
    });
  });

  describe("add", () => {
    it("should add a favorite using upsert", async () => {
      const mockFavorite = { id: 1, userId: 1, planId: 1 };
      prisma.favorite.upsert.mockResolvedValue(mockFavorite as any);

      const result = await service.add(1, 1);

      expect(result).toEqual(mockFavorite);
      expect(prisma.favorite.upsert).toHaveBeenCalledWith({
        where: { userId_planId: { userId: 1, planId: 1 } },
        update: {},
        create: { userId: 1, planId: 1 },
      });
    });
  });

  describe("remove", () => {
    it("should remove a favorite and return success", async () => {
      prisma.favorite.delete.mockResolvedValue({ id: 1 } as any);

      const result = await service.remove(1, 1);

      expect(result).toEqual({ success: true });
    });

    it("should return success even if favorite does not exist", async () => {
      prisma.favorite.delete.mockRejectedValue(new Error("Not found"));

      const result = await service.remove(999, 999);

      expect(result).toEqual({ success: true });
    });
  });

  describe("isFavorite", () => {
    it("should return true when favorite exists", async () => {
      prisma.favorite.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        planId: 1,
      } as any);

      const result = await service.isFavorite(1, 1);

      expect(result).toBe(true);
    });

    it("should return false when favorite does not exist", async () => {
      prisma.favorite.findUnique.mockResolvedValue(null);

      const result = await service.isFavorite(1, 999);

      expect(result).toBe(false);
    });
  });
});
