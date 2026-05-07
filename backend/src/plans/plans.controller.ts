import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  Query,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PlansService } from "./plans.service";
import { CreatePlanDto, UpdatePlanDto, PlanStatus } from "./dto/plan.dto";
import { Public } from "../auth/decorators/public.decorator";

@Controller("plans")
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  async create(@Body() createPlanDto: CreatePlanDto, @Request() req: any) {
    return this.plansService.create(req.user.userId, createPlanDto);
  }

  @Get()
  async findAll(@Request() req: any, @Query("status") status?: PlanStatus) {
    return this.plansService.findByUser(req.user.userId, status);
  }

  @Public()
  @Get("public")
  async findPublic(
    @Query("search") search?: string,
    @Query("limit") limit?: number,
  ) {
    return this.plansService.findPublic(search, limit);
  }

  @Public()
  @Get("popular-destinations")
  async getPopularDestinations() {
    return this.plansService.getPopularDestinations();
  }

  @Get("upcoming")
  async getUpcoming(@Request() req: any) {
    return this.plansService.getUpcoming(req.user.userId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req: any) {
    const plan = await this.plansService.findOne(parseInt(id));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (!plan.isPublic && plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权查看此计划");
    }

    return plan;
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(id));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.plansService.update(parseInt(id), updatePlanDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Request() req: any) {
    const plan = await this.plansService.findOne(parseInt(id));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权删除此计划");
    }

    return this.plansService.remove(parseInt(id));
  }
}
