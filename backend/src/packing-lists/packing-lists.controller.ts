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
import { PackingListsService } from "./packing-lists.service";
import {
  CreatePackingItemDto,
  UpdatePackingItemDto,
} from "./dto/packing-list.dto";
import { PlansService } from "../plans/plans.service";

@Controller("plans/:planId/packing-list")
export class PackingListsController {
  constructor(
    private readonly packingListsService: PackingListsService,
    private readonly plansService: PlansService,
  ) {}

  @Get()
  async findOne(@Param("planId") planId: string, @Request() req: any) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (!plan.isPublic && plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权查看此计划");
    }

    let packingList = await this.packingListsService.findByPlan(
      parseInt(planId),
    );

    if (!packingList) {
      packingList = await this.packingListsService.create(parseInt(planId));
    }

    return packingList;
  }

  @Post("items")
  async addItem(
    @Param("planId") planId: string,
    @Body() createItemDto: CreatePackingItemDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    let packingList = await this.packingListsService.findByPlan(
      parseInt(planId),
    );

    if (!packingList) {
      packingList = await this.packingListsService.create(parseInt(planId));
    }

    return this.packingListsService.addItem(packingList.id, createItemDto);
  }

  @Put("items/:itemId")
  async updateItem(
    @Param("planId") planId: string,
    @Param("itemId") itemId: string,
    @Body() updateItemDto: UpdatePackingItemDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.packingListsService.updateItem(parseInt(itemId), updateItemDto);
  }

  @Delete("items/:itemId")
  async removeItem(
    @Param("planId") planId: string,
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

    return this.packingListsService.removeItem(parseInt(itemId));
  }

  @Post("items/:itemId/toggle")
  async toggleItem(
    @Param("planId") planId: string,
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

    return this.packingListsService.toggleItem(parseInt(itemId));
  }

  @Post("apply-template")
  async applyTemplate(
    @Param("planId") planId: string,
    @Body("template") template: string,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.packingListsService.applyTemplate(parseInt(planId), template);
  }
}
