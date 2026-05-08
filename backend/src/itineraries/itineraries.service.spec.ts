import { Test, TestingModule } from "@nestjs/testing";
import { ItinerariesService } from "./itineraries.service";
import { PrismaService } from "../prisma/prisma.service";

describe("ItinerariesService", () => {
  let service: ItinerariesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItinerariesService,
        {
          provide: PrismaService,
          useValue: {
            itinerary: {
              aggregate: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            itineraryItem: {
              aggregate: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ItinerariesService>(ItinerariesService);
    prisma = module.get(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create itinerary with next day number", async () => {
      jest.spyOn(prisma.itinerary, "aggregate").mockResolvedValue({
        _max: { dayNumber: 3 },
      } as any);
      jest.spyOn(prisma.itinerary, "create").mockResolvedValue({
        id: 1,
        dayNumber: 4,
      } as any);

      const result = await service.create(1, { date: "2024-01-01" } as any);

      expect(result).toEqual({ id: 1, dayNumber: 4 });
      expect(prisma.itinerary.create).toHaveBeenCalledWith({
        data: {
          planId: 1,
          dayNumber: 4,
          date: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it("should start with day 1 when no existing itineraries", async () => {
      jest.spyOn(prisma.itinerary, "aggregate").mockResolvedValue({
        _max: { dayNumber: null },
      } as any);
      jest.spyOn(prisma.itinerary, "create").mockResolvedValue({
        id: 1,
        dayNumber: 1,
      } as any);

      await service.create(1, { date: "2024-01-01" } as any);

      expect(prisma.itinerary.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ dayNumber: 1 }),
        }),
      );
    });
  });

  describe("findByPlan", () => {
    it("should find itineraries by plan", async () => {
      const mockItineraries = [
        { id: 1, dayNumber: 1 },
        { id: 2, dayNumber: 2 },
      ];
      jest.spyOn(prisma.itinerary, "findMany").mockResolvedValue(mockItineraries as any);

      const result = await service.findByPlan(1);

      expect(result).toEqual(mockItineraries);
    });
  });

  describe("findOne", () => {
    it("should find itinerary by id", async () => {
      const mockItinerary = { id: 1, dayNumber: 1 };
      jest.spyOn(prisma.itinerary, "findUnique").mockResolvedValue(mockItinerary as any);

      const result = await service.findOne(1);

      expect(result).toEqual(mockItinerary);
    });
  });

  describe("update", () => {
    it("should update itinerary with date conversion", async () => {
      const updateDto = {
        date: "2024-02-01",
        dayNumber: 5,
      };

      jest.spyOn(prisma.itinerary, "update").mockResolvedValue({ id: 1 } as any);

      await service.update(1, updateDto as any);

      expect(prisma.itinerary.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          date: expect.any(Date),
          dayNumber: 5,
        },
        include: expect.any(Object),
      });
    });
  });

  describe("remove", () => {
    it("should remove itinerary", async () => {
      jest.spyOn(prisma.itinerary, "delete").mockResolvedValue({ id: 1 } as any);

      const result = await service.remove(1);

      expect(result).toEqual({ success: true });
    });
  });

  describe("createItem", () => {
    it("should create item with next sort order", async () => {
      jest.spyOn(prisma.itineraryItem, "aggregate").mockResolvedValue({
        _max: { sortOrder: 2 },
      } as any);
      jest.spyOn(prisma.itineraryItem, "create").mockResolvedValue({
        id: 1,
        sortOrder: 3,
      } as any);

      const result = await service.createItem(1, {
        name: "Test Item",
        type: "ATTRACTION",
      } as any);

      expect(result).toEqual({ id: 1, sortOrder: 3 });
      expect(prisma.itineraryItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sortOrder: 3 }),
        }),
      );
    });
  });

  describe("updateItem", () => {
    it("should update item with type and date conversions", async () => {
      const updateDto = {
        name: "Updated",
        startTime: "2024-01-01T10:00:00",
        endTime: "2024-01-01T12:00:00",
        type: "RESTAURANT",
      };

      jest.spyOn(prisma.itineraryItem, "update").mockResolvedValue({ id: 1 } as any);

      await service.updateItem(1, updateDto as any);

      expect(prisma.itineraryItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          name: "Updated",
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          type: "RESTAURANT",
        }),
      });
    });
  });

  describe("removeItem", () => {
    it("should remove item", async () => {
      jest.spyOn(prisma.itineraryItem, "delete").mockResolvedValue({ id: 1 } as any);

      const result = await service.removeItem(1);

      expect(result).toEqual({ success: true });
    });
  });

  describe("reorderItems", () => {
    it("should reorder items and return them", async () => {
      const itemIds = [3, 1, 2];
      const reorderedItems = [
        { id: 3, sortOrder: 0 },
        { id: 1, sortOrder: 1 },
        { id: 2, sortOrder: 2 },
      ];

      jest.spyOn(prisma.itineraryItem, "update").mockResolvedValue({} as any);
      jest.spyOn(prisma.itineraryItem, "findMany").mockResolvedValue(reorderedItems as any);

      const result = await service.reorderItems(1, itemIds);

      expect(prisma.itineraryItem.update).toHaveBeenCalledTimes(3);
      expect(prisma.itineraryItem.update).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { id: 3 },
          data: { sortOrder: 0 },
        }),
      );
      expect(result).toEqual(reorderedItems);
    });
  });
});
