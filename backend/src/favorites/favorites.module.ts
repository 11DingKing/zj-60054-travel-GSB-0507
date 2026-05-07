import { Module } from "@nestjs/common";
import { FavoritesController } from "./favorites.controller";
import { FavoritesService } from "./favorites.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PlansModule } from "../plans/plans.module";

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
