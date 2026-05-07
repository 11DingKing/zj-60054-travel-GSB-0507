import { Module } from "@nestjs/common";
import { ItinerariesController } from "./itineraries.controller";
import { ItinerariesService } from "./itineraries.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PlansModule } from "../plans/plans.module";

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [ItinerariesController],
  providers: [ItinerariesService],
  exports: [ItinerariesService],
})
export class ItinerariesModule {}
