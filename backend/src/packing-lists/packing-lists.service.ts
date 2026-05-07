import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreatePackingItemDto,
  UpdatePackingItemDto,
} from "./dto/packing-list.dto";

const templates: Record<string, { name: string; quantity: number }[]> = {
  beach: [
    { name: "泳衣", quantity: 2 },
    { name: "沙滩裤", quantity: 1 },
    { name: "遮阳帽", quantity: 1 },
    { name: "太阳镜", quantity: 1 },
    { name: "防晒霜", quantity: 1 },
    { name: "拖鞋", quantity: 1 },
    { name: "浴巾", quantity: 1 },
  ],
  hiking: [
    { name: "登山鞋", quantity: 1 },
    { name: "登山杖", quantity: 2 },
    { name: "冲锋衣", quantity: 1 },
    { name: "速干衣", quantity: 2 },
    { name: "头灯", quantity: 1 },
    { name: "帐篷", quantity: 1 },
    { name: "睡袋", quantity: 1 },
  ],
  business: [
    { name: "西装", quantity: 2 },
    { name: "衬衫", quantity: 3 },
    { name: "领带", quantity: 3 },
    { name: "笔记本电脑", quantity: 1 },
    { name: "文件袋", quantity: 1 },
    { name: "名片夹", quantity: 1 },
  ],
};

@Injectable()
export class PackingListsService {
  constructor(private prisma: PrismaService) {}

  async create(planId: number) {
    return this.prisma.packingList.create({
      data: { planId },
      include: { items: true },
    });
  }

  async findByPlan(planId: number) {
    return this.prisma.packingList.findUnique({
      where: { planId },
      include: { items: true },
    });
  }

  async addItem(packingListId: number, createItemDto: CreatePackingItemDto) {
    return this.prisma.packingItem.create({
      data: {
        ...createItemDto,
        packingListId,
      },
    });
  }

  async updateItem(id: number, updateItemDto: UpdatePackingItemDto) {
    return this.prisma.packingItem.update({
      where: { id },
      data: updateItemDto,
    });
  }

  async removeItem(id: number) {
    await this.prisma.packingItem.delete({ where: { id } });
    return { success: true };
  }

  async toggleItem(id: number) {
    const item = await this.prisma.packingItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new Error("物品不存在");
    }

    return this.prisma.packingItem.update({
      where: { id },
      data: { isPacked: !item.isPacked },
    });
  }

  async applyTemplate(planId: number, template: string) {
    const templateItems = templates[template];
    if (!templateItems) {
      throw new Error("模板不存在");
    }

    let packingList = await this.prisma.packingList.findUnique({
      where: { planId },
      include: { items: true },
    });

    if (!packingList) {
      packingList = await this.prisma.packingList.create({
        data: { planId },
        include: { items: true },
      });
    }

    for (const item of templateItems) {
      await this.prisma.packingItem.create({
        data: {
          packingListId: packingList.id,
          name: item.name,
          quantity: item.quantity,
          isPacked: false,
        },
      });
    }

    return this.prisma.packingList.findUnique({
      where: { planId },
      include: { items: true },
    });
  }
}
