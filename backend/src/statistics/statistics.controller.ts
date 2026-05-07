import { Controller, Get, Request } from "@nestjs/common";
import { StatisticsService } from "./statistics.service";

@Controller("statistics")
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get("city-distribution")
  async getCityDistribution(@Request() req: any) {
    return this.statisticsService.getCityDistribution(req.user.userId);
  }

  @Get("monthly-frequency")
  async getMonthlyFrequency(@Request() req: any) {
    return this.statisticsService.getMonthlyFrequency(req.user.userId);
  }

  @Get("expense-categories")
  async getExpenseCategories(@Request() req: any) {
    return this.statisticsService.getExpenseCategories(req.user.userId);
  }

  @Get("budget-vs-actual")
  async getBudgetVsActual(@Request() req: any) {
    return this.statisticsService.getBudgetVsActual(req.user.userId);
  }
}
