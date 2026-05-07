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
import { ExpensesService } from "./expenses.service";
import { CreateExpenseDto, UpdateExpenseDto } from "./dto/expense.dto";
import { PlansService } from "../plans/plans.service";

@Controller("plans/:planId/expenses")
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly plansService: PlansService,
  ) {}

  @Post()
  async create(
    @Param("planId") planId: string,
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.expensesService.create(parseInt(planId), createExpenseDto);
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

    return this.expensesService.findByPlan(parseInt(planId));
  }

  @Get("summary")
  async getSummary(@Param("planId") planId: string, @Request() req: any) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (!plan.isPublic && plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权查看此计划");
    }

    return this.expensesService.getSummary(parseInt(planId));
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

    const expense = await this.expensesService.findOne(parseInt(id));

    if (!expense) {
      throw new NotFoundException("费用记录不存在");
    }

    return expense;
  }

  @Put(":id")
  async update(
    @Param("planId") planId: string,
    @Param("id") id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权修改此计划");
    }

    return this.expensesService.update(parseInt(id), updateExpenseDto);
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

    return this.expensesService.remove(parseInt(id));
  }
}
