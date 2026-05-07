import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PlansModule } from "./plans/plans.module";
import { ItinerariesModule } from "./itineraries/itineraries.module";
import { ExpensesModule } from "./expenses/expenses.module";
import { PackingListsModule } from "./packing-lists/packing-lists.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { StatisticsModule } from "./statistics/statistics.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    PlansModule,
    ItinerariesModule,
    ExpensesModule,
    PackingListsModule,
    FavoritesModule,
    StatisticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
