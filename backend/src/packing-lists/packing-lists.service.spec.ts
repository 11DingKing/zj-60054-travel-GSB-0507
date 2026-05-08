import { Test, TestingModule } from "@nestjs/testing";
import { PackingListsService } from "./packing-lists.service";
import { PrismaService } from "../prisma/prisma.service";

describe("PackingListsService", () => {
  let service: PackingListsService;
  let prisma: {
    packingList: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
    packingItem: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const mockPackingList = {
    id: 1,
    planId: 1,
    items: [],
  };

  const mockItem = {
    id: 1,
    packingListId: 1,
    name: "T-shirt",
    quantity: 2,
    isPacked: false,
  };

  beforeEach(async () => {
    prisma = {
      packingList: {
        create: jest.fn().mockResolvedValue(mockPackingList),
        findUnique: jest.fn().mockResolvedValue(mockPackingList),
      },
      packingItem: {
        create: jest.fn().mockResolvedValue(mockItem),
        update: jest.fn().mockResolvedValue(mockItem),
        delete: jest.fn().mockResolvedValue(mockItem),
        findUnique: jest.fn().mockResolvedValue(mockItem),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PackingListsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PackingListsService>(PackingListsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a packing list for a plan", async () => {
      const result = await service.create(1);

      expect(prisma.packingList.create).toHaveBeenCalledWith({
        data: { planId: 1 },
        include: { items: true },
      });
      expect(result).toEqual(mockPackingList);
    });
  });

  describe("findByPlan", () => {
    it("should return packing list for a plan", async () => {
      const result = await service.findByPlan(1);

      expect(prisma.packingList.findUnique).toHaveBeenCalledWith({
        where: { planId: 1 },
        include: { items: true },
      });
      expect(result).toEqual(mockPackingList);
    });
  });

  describe("addItem", () => {
    it("should add a packing item", async () => {
      const dto = { name: "T-shirt", quantity: 2 };
      const result = await service.addItem(1, dto as any);

      expect(prisma.packingItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...dto,
          packingListId: 1,
        }),
      });
      expect(result).toEqual(mockItem);
    });
  });

  describe("updateItem", () => {
    it("should update a packing item", async () => {
      const dto = { name: "Updated Item" };
      const result = await service.updateItem(1, dto as any);

      expect(prisma.packingItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
      expect(result).toEqual(mockItem);
    });
  });

  describe("removeItem", () => {
    it("should delete a packing item", async () => {
      const result = await service.removeItem(1);

      expect(prisma.packingItem.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ success: true });
    });
  });

  describe("toggleItem", () => {
    it("should toggle isPacked from false to true", async () => {
      prisma.packingItem.findUnique.mockResolvedValue({ ...mockItem, isPacked: false });
      prisma.packingItem.update.mockResolvedValue({ ...mockItem, isPacked: true });

      const result = await service.toggleItem(1);

      expect(prisma.packingItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isPacked: true },
      });
      expect(result.isPacked).toBe(true);
    });

    it("should throw error when item does not exist", async () => {
      prisma.packingItem.findUnique.mockResolvedValue(null);

      await expect(service.toggleItem(999)).rejects.toThrow("物品不存在");
    });
  });

  describe("applyTemplate", () => {
    it("should throw error for unknown template", async () => {
      await expect(service.applyTemplate(1, "unknown")).rejects.toThrow("模板不存在");
    });

    it("should create packing list if it does not exist and add template items", async () => {
      prisma.packingList.findUnique.mockResolvedValueOnce(null);
      prisma.packingList.create.mockResolvedValue({ ...mockPackingList, id: 1 });
      prisma.packingList.findUnique.mockResolvedValueOnce({
        ...mockPackingList,
        items: [{ name: "泳衣", quantity: 2, isPacked: false }],
      });

      const result = await service.applyTemplate(1, "beach");

      expect(prisma.packingList.create).toHaveBeenCalled();
      expect(prisma.packingItem.create).toHaveBeenCalled();
    });

    it("should add template items to existing packing list", async () => {
      prisma.packingList.findUnique.mockResolvedValue(mockPackingList);
      prisma.packingList.findUnique.mockResolvedValueOnce({
        ...mockPackingList,
        items: [{ name: "登山鞋", quantity: 1, isPacked: false }],
      });

      const result = await service.applyTemplate(1, "hiking");

      expect(prisma.packingList.create).not.toHaveBeenCalled();
      expect(prisma.packingItem.create).toHaveBeenCalled();
    });
  });
});
