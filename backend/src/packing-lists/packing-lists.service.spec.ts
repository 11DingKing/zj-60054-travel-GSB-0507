import { Test, TestingModule } from "@nestjs/testing";
import { PackingListsService } from "./packing-lists.service";
import { PrismaService } from "../prisma/prisma.service";

describe("PackingListsService", () => {
  let service: PackingListsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackingListsService,
        {
          provide: PrismaService,
          useValue: {
            packingList: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
            packingItem: {
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PackingListsService>(PackingListsService);
    prisma = module.get(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a packing list", async () => {
      const mockPackingList = { id: 1, planId: 1, items: [] };
      jest.spyOn(prisma.packingList, "create").mockResolvedValue(mockPackingList as any);

      const result = await service.create(1);

      expect(result).toEqual(mockPackingList);
    });
  });

  describe("findByPlan", () => {
    it("should find packing list by plan", async () => {
      const mockPackingList = { id: 1, planId: 1, items: [] };
      jest.spyOn(prisma.packingList, "findUnique").mockResolvedValue(mockPackingList as any);

      const result = await service.findByPlan(1);

      expect(result).toEqual(mockPackingList);
    });

    it("should return null when not found", async () => {
      jest.spyOn(prisma.packingList, "findUnique").mockResolvedValue(null);

      const result = await service.findByPlan(999);

      expect(result).toBeNull();
    });
  });

  describe("addItem", () => {
    it("should add an item to packing list", async () => {
      const createDto = { name: "衣服", quantity: 2 };
      const createdItem = { id: 1, ...createDto, packingListId: 1 };

      jest.spyOn(prisma.packingItem, "create").mockResolvedValue(createdItem as any);

      const result = await service.addItem(1, createDto);

      expect(result).toEqual(createdItem);
    });
  });

  describe("updateItem", () => {
    it("should update an item", async () => {
      const updateDto = { name: "Updated", quantity: 3 };
      const updatedItem = { id: 1, ...updateDto };

      jest.spyOn(prisma.packingItem, "update").mockResolvedValue(updatedItem as any);

      const result = await service.updateItem(1, updateDto);

      expect(result).toEqual(updatedItem);
    });
  });

  describe("removeItem", () => {
    it("should remove an item", async () => {
      jest.spyOn(prisma.packingItem, "delete").mockResolvedValue({ id: 1 } as any);

      const result = await service.removeItem(1);

      expect(result).toEqual({ success: true });
    });
  });

  describe("toggleItem", () => {
    it("should toggle isPacked from false to true", async () => {
      const item = { id: 1, isPacked: false };
      jest.spyOn(prisma.packingItem, "findUnique").mockResolvedValue(item as any);
      jest.spyOn(prisma.packingItem, "update").mockResolvedValue({
        ...item,
        isPacked: true,
      } as any);

      const result = await service.toggleItem(1);

      expect(result).toEqual({ id: 1, isPacked: true });
      expect(prisma.packingItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isPacked: true },
      });
    });

    it("should toggle isPacked from true to false", async () => {
      const item = { id: 1, isPacked: true };
      jest.spyOn(prisma.packingItem, "findUnique").mockResolvedValue(item as any);
      jest.spyOn(prisma.packingItem, "update").mockResolvedValue({
        ...item,
        isPacked: false,
      } as any);

      const result = await service.toggleItem(1);

      expect(result).toEqual({ id: 1, isPacked: false });
      expect(prisma.packingItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isPacked: false },
      });
    });

    it("should throw error when item not found", async () => {
      jest.spyOn(prisma.packingItem, "findUnique").mockResolvedValue(null);

      await expect(service.toggleItem(999)).rejects.toThrow("物品不存在");
    });
  });

  describe("applyTemplate", () => {
    it("should apply beach template to existing packing list", async () => {
      const existingList = { id: 1, planId: 1, items: [] };
      jest.spyOn(prisma.packingList, "findUnique")
        .mockResolvedValueOnce(existingList as any)
        .mockResolvedValueOnce({
          id: 1,
          planId: 1,
          items: [{ name: "泳衣", quantity: 2 }],
        } as any);
      jest.spyOn(prisma.packingItem, "create").mockResolvedValue({} as any);

      const result = await service.applyTemplate(1, "beach");

      expect(result).toEqual({
        id: 1,
        planId: 1,
        items: [{ name: "泳衣", quantity: 2 }],
      });
      expect(prisma.packingItem.create).toHaveBeenCalledTimes(7);
    });

    it("should create packing list if not exists and apply template", async () => {
      jest.spyOn(prisma.packingList, "findUnique")
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          planId: 1,
          items: [{ name: "登山鞋", quantity: 1 }],
        } as any);
      jest.spyOn(prisma.packingList, "create").mockResolvedValue({ id: 1, planId: 1 } as any);
      jest.spyOn(prisma.packingItem, "create").mockResolvedValue({} as any);

      const result = await service.applyTemplate(1, "hiking");

      expect(prisma.packingList.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        planId: 1,
        items: [{ name: "登山鞋", quantity: 1 }],
      });
      expect(prisma.packingItem.create).toHaveBeenCalledTimes(7);
    });

    it("should throw error for invalid template", async () => {
      await expect(service.applyTemplate(1, "invalid_template")).rejects.toThrow(
        "模板不存在",
      );
    });

    it("should apply business template", async () => {
      const existingList = { id: 1, planId: 1, items: [] };
      jest.spyOn(prisma.packingList, "findUnique")
        .mockResolvedValueOnce(existingList as any)
        .mockResolvedValueOnce({ id: 1, planId: 1, items: [] } as any);
      jest.spyOn(prisma.packingItem, "create").mockResolvedValue({} as any);

      await service.applyTemplate(1, "business");

      expect(prisma.packingItem.create).toHaveBeenCalledTimes(6);
    });
  });
});
