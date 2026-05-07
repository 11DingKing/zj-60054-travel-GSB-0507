import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Request,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { FavoritesService } from "./favorites.service";
import { PlansService } from "../plans/plans.service";
import { Public } from "../auth/decorators/public.decorator";

@Controller("favorites")
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly plansService: PlansService,
  ) {}

  @Get()
  async findMyFavorites(@Request() req: any) {
    return this.favoritesService.findByUser(req.user.userId);
  }

  @Post("plans/:planId")
  async addFavorite(@Param("planId") planId: string, @Request() req: any) {
    const plan = await this.plansService.findOne(parseInt(planId));

    if (!plan) {
      throw new NotFoundException("计划不存在");
    }

    if (!plan.isPublic && plan.userId !== req.user.userId) {
      throw new ForbiddenException("无权收藏此计划");
    }

    if (plan.userId === req.user.userId) {
      throw new ForbiddenException("不能收藏自己的计划");
    }

    return this.favoritesService.add(req.user.userId, parseInt(planId));
  }

  @Delete("plans/:planId")
  async removeFavorite(@Param("planId") planId: string, @Request() req: any) {
    return this.favoritesService.remove(req.user.userId, parseInt(planId));
  }

  @Get("plans/:planId/check")
  async checkFavorite(@Param("planId") planId: string, @Request() req: any) {
    const isFavorite = await this.favoritesService.isFavorite(
      req.user.userId,
      parseInt(planId),
    );
    return { isFavorite };
  }
}
