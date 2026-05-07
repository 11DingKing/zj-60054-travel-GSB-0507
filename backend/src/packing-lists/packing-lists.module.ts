import { Module } from "@nestjs/common";
import { PackingListsController } from "./packing-lists.controller";
import { PackingListsService } from "./packing-lists.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PlansModule } from "../plans/plans.module";

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [PackingListsController],
  providers: [PackingListsService],
  exports: [PackingListsService],
})
export class PackingListsModule {}
