import { Test, TestingModule } from "@nestjs/testing";
import { ItinerariesService } from "./itineraries.service";
import { PrismaService } from "../prisma/prisma.service";
import { ItemType } from "@prisma/client";

describe("ItinerariesService", () => {
  let service: ItinerariesService;
  let prisma: {
    itinerary: {
      aggregate: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    itineraryItem: {
      aggregate: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const mockItinerary = {
    id: 1,
    planId: 1,
    dayNumber: 1,
    date: new Date("2025-01-01"),
    items: [],
  };

  const mockItem = {
    id: 1,
    itineraryId: 1,
    name: "Visit Temple",
    address: "123 Temple St",
    startTime: null,
    endTime: null,
    estimatedCost: 100,
    notes: null,
    type: ItemType.ATTRACTION,
    icon: null,
    sortOrder: 0,
  };

  beforeEach(async () => {
    prisma = {
      itinerary: {
        aggregate: jest.fn().mockResolvedValue({ _max: { dayNumber: null } }),
        create: jest.fn().mockResolvedValue(mockItinerary),
        findMany: jest.fn().mockResolvedValue([mockItinerary]),
        findUnique: jest.fn().mockResolvedValue(mockItinerary),
        update: jest.fn().mockResolvedValue(mockItinerary),
        delete: jest.fn().mockResolvedValue(mockItinerary),
      },
      itineraryItem: {
        aggregate: jest
          .fn()
          .mockResolvedValue({ _max: { sortOrder: null } }),
        create: jest.fn().mockResolvedValue(mockItem),
        update: jest.fn().mockResolvedValue(mockItem),
        delete: jest.fn().mockResolvedValue(mockItem),
        findMany: jest.fn().mockResolvedValue([mockItem]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ItinerariesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ItinerariesService>(ItinerariesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create an itinerary with dayNumber = 1 when no existing itineraries", async () => {
      const dto = { date: "2025-01-01" };
      const result = await service.create(1, dto as any);

      expect(prisma.itinerary.aggregate).toHaveBeenCalledWith({
        where: { planId: 1 },
        _max: { dayNumber: true },
      });
      expect(prisma.itinerary.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            planId: 1,
            dayNumber: 1,
            date: expect.any(Date),
          }),
        }),
      );
      expect(result).toEqual(mockItinerary);
    });

    it("should increment dayNumber based on existing itineraries", async () => {
      prisma.itinerary.aggregate.mockResolvedValue({
        _max: { dayNumber: 3 },
      });

      const dto = { date: "2025-01-01" };
      await service.create(1, dto as any);

      expect(prisma.itinerary.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ dayNumber: 4 }),
        }),
      );
    });
  });

  describe("findByPlan", () => {
    it("should return itineraries for a plan", async () => {
      const result = await service.findByPlan(1);

      expect(prisma.itinerary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { planId: 1 },
          orderBy: { dayNumber: "asc" },
        }),
      );
      expect(result).toEqual([mockItinerary]);
    });
  });

  describe("findOne", () => {
    it("should return a single itinerary by id", async () => {
      const result = await service.findOne(1);

      expect(prisma.itinerary.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(result).toEqual(mockItinerary);
    });
  });

  describe("update", () => {
    it("should update an itinerary", async () => {
      const dto = { dayNumber: 2 };
      const result = await service.update(1, dto as any);

      expect(prisma.itinerary.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { dayNumber: 2 },
        }),
      );
      expect(result).toEqual(mockItinerary);
    });

    it("should convert date string to Date on update", async () => {
      const dto = { date: "2025-01-02" };
      await service.update(1, dto as any);

      expect(prisma.itinerary.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date: expect.any(Date) }),
        }),
      );
    });
  });

  describe("remove", () => {
    it("should delete an itinerary", async () => {
      const result = await service.remove(1);

      expect(prisma.itinerary.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ success: true });
    });
  });

  describe("createItem", () => {
    it("should create an itinerary item with sortOrder = 0 when no existing items", async () => {
      const dto = {
        name: "Visit Temple",
        type: ItemType.ATTRACTION,
      };

      const result = await service.createItem(1, dto as any);

      expect(prisma.itineraryItem.aggregate).toHaveBeenCalledWith({
        where: { itineraryId: 1 },
        _max: { sortOrder: true },
      });
      expect(prisma.itineraryItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            itineraryId: 1,
            sortOrder: 0,
            type: ItemType.ATTRACTION,
          }),
        }),
      );
      expect(result).toEqual(mockItem);
    });

    it("should increment sortOrder based on existing items", async () => {
      prisma.itineraryItem.aggregate.mockResolvedValue({
        _max: { sortOrder: 2 },
      });

      const dto = {
        name: "Visit Temple",
        type: ItemType.ATTRACTION,
      };

      await service.createItem(1, dto as any);

      expect(prisma.itineraryItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sortOrder: 3 }),
        }),
      );
    });

    it("should convert startTime and endTime to Date", async () => {
      const dto = {
        name: "Visit Temple",
        type: ItemType.ATTRACTION,
        startTime: "2025-01-01T09:00:00Z",
        endTime: "2025-01-01T12:00:00Z",
      };

      await service.createItem(1, dto as any);

      expect(prisma.itineraryItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startTime: expect.any(Date),
            endTime: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe("updateItem", () => {
    it("should update an itinerary item", async () => {
      const dto = { name: "Updated Name" };
      const result = await service.updateItem(1, dto as any);

      expect(prisma.itineraryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: dto,
        }),
      );
      expect(result).toEqual(mockItem);
    });
  });

  describe("removeItem", () => {
    it("should delete an itinerary item", async () => {
      const result = await service.removeItem(1);

      expect(prisma.itineraryItem.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ success: true });
    });
  });

  describe("reorderItems", () => {
    it("should reorder items by updating sortOrder for each", async () => {
      const itemIds = [3, 1, 2];

      const result = await service.reorderItems(1, itemIds);

      expect(prisma.itineraryItem.update).toHaveBeenCalledTimes(3);
      expect(prisma.itineraryItem.update).toHaveBeenNthCalledWith(1, {
        where: { id: 3 },
        data: { sortOrder: 0 },
      });
      expect(prisma.itineraryItem.update).toHaveBeenNthCalledWith(2, {
        where: { id: 1 },
        data: { sortOrder: 1 },
      });
      expect(prisma.itineraryItem.update).toHaveBeenNthCalledWith(3, {
        where: { id: 2 },
        data: { sortOrder: 2 },
      });
      expect(prisma.itineraryItem.findMany).toHaveBeenCalledWith({
        where: { itineraryId: 1 },
        orderBy: { sortOrder: "asc" },
      });
      expect(result).toEqual([mockItem]);
    });
  });
});
