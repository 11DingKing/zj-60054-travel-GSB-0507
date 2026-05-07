import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateItineraryDto,
  UpdateItineraryDto,
  CreateItineraryItemDto,
  UpdateItineraryItemDto,
} from "./dto/itinerary.dto";
import { ItemType } from "@prisma/client";

@Injectable()
export class ItinerariesService {
  constructor(private prisma: PrismaService) {}

  async create(planId: number, createItineraryDto: CreateItineraryDto) {
    const maxDay = await this.prisma.itinerary.aggregate({
      where: { planId },
      _max: { dayNumber: true },
    });

    const dayNumber = (maxDay._max.dayNumber || 0) + 1;

    return this.prisma.itinerary.create({
      data: {
        planId,
        dayNumber,
        date: new Date(createItineraryDto.date),
      },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  async findByPlan(planId: number) {
    return this.prisma.itinerary.findMany({
      where: { planId },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { dayNumber: "asc" },
    });
  }

  async findOne(id: number) {
    return this.prisma.itinerary.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  async update(id: number, updateItineraryDto: UpdateItineraryDto) {
    const data: any = {};
    if (updateItineraryDto.date) {
      data.date = new Date(updateItineraryDto.date);
    }
    if (updateItineraryDto.dayNumber !== undefined) {
      data.dayNumber = updateItineraryDto.dayNumber;
    }

    return this.prisma.itinerary.update({
      where: { id },
      data,
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  async remove(id: number) {
    await this.prisma.itinerary.delete({ where: { id } });
    return { success: true };
  }

  async createItem(itineraryId: number, createItemDto: CreateItineraryItemDto) {
    const maxOrder = await this.prisma.itineraryItem.aggregate({
      where: { itineraryId },
      _max: { sortOrder: true },
    });

    const sortOrder = (maxOrder._max.sortOrder || -1) + 1;

    return this.prisma.itineraryItem.create({
      data: {
        ...createItemDto,
        itineraryId,
        sortOrder,
        startTime: createItemDto.startTime
          ? new Date(createItemDto.startTime)
          : null,
        endTime: createItemDto.endTime ? new Date(createItemDto.endTime) : null,
        type: createItemDto.type as ItemType,
      },
    });
  }

  async updateItem(id: number, updateItemDto: UpdateItineraryItemDto) {
    const data: any = { ...updateItemDto };

    if (updateItemDto.startTime) {
      data.startTime = new Date(updateItemDto.startTime);
    }
    if (updateItemDto.endTime) {
      data.endTime = new Date(updateItemDto.endTime);
    }
    if (updateItemDto.type) {
      data.type = updateItemDto.type as ItemType;
    }

    return this.prisma.itineraryItem.update({
      where: { id },
      data,
    });
  }

  async removeItem(id: number) {
    await this.prisma.itineraryItem.delete({ where: { id } });
    return { success: true };
  }

  async reorderItems(itineraryId: number, itemIds: number[]) {
    for (let i = 0; i < itemIds.length; i++) {
      await this.prisma.itineraryItem.update({
        where: { id: itemIds[i] },
        data: { sortOrder: i },
      });
    }

    return this.prisma.itineraryItem.findMany({
      where: { itineraryId },
      orderBy: { sortOrder: "asc" },
    });
  }
}
