import { Controller, Get, Put, Body, Request } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getCurrentUser(@Request() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @Put("me")
  async updateCurrentUser(
    @Request() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Get("me/statistics")
  async getUserStatistics(@Request() req: any) {
    return this.usersService.getUserStatistics(req.user.userId);
  }
}
