import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ItinerariesService } from "./itineraries.service";
import {
  CreateItineraryDto,
  UpdateItineraryDto,
  CreateItineraryItemDto,
  UpdateItineraryItemDto,
  ReorderItemsDto,
} from "./dto/itinerary.dto";
import { PlansService } from "../plans/plans.service";

@Controller("plans/:planId/itineraries")
export class ItinerariesController {
  constructor(
    private readonly itinerariesService: ItinerariesService,
    private readonly plansService: PlansService,
  ) {}

  @Post()
  async create(
    @Param("planId") planId: string,
    @Body() createItineraryDto: CreateItineraryDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.itinerariesService.create(parseInt(planId), createItineraryDto);
  }

  @Get()
  async findAll(@Param("planId") planId: string, @Request() req: any) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (!plan.isPublic && plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权查看此计划");
    }

    return this.itinerariesService.findByPlan(parseInt(planId));
  }

  @Get(":id")
  async findOne(
    @Param("planId") planId: string,
    @Param("id") id: string,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (!plan.isPublic && plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权查看此计划");
    }

    const itinerary = await this.itinerariesService.findOne(parseInt(id));

    if (!itinerary) {
      throw new NotFoundException("行程不存在");
    }

    return itinerary;
  }

  @Put(":id")
  async update(
    @Param("planId") planId: string,
    @Param("id") id: string,
    @Body() updateItineraryDto: UpdateItineraryDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.itinerariesService.update(parseInt(id), updateItineraryDto);
  }

  @Delete(":id")
  async remove(
    @Param("planId") planId: string,
    @Param("id") id: string,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.itinerariesService.remove(parseInt(id));
  }

  @Post(":id/items")
  async createItem(
    @Param("planId") planId: string,
    @Param("id") id: string,
    @Body() createItemDto: CreateItineraryItemDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.itinerariesService.createItem(parseInt(id), createItemDto);
  }

  @Put(":id/items/:itemId")
  async updateItem(
    @Param("planId") planId: string,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() updateItemDto: UpdateItineraryItemDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.itinerariesService.updateItem(parseInt(itemId), updateItemDto);
  }

  @Delete(":id/items/:itemId")
  async removeItem(
    @Param("planId") planId: string,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.itinerariesService.removeItem(parseInt(itemId));
  }

  @Post(":id/items/reorder")
  async reorderItems(
    @Param("planId") planId: string,
    @Param("id") id: string,
    @Body() reorderDto: ReorderItemsDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.itinerariesService.reorderItems(
      parseInt(id),
      reorderDto.itemIds,
    );
  }
}
