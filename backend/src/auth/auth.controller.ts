import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { LoginDto, RegisterDto } from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(AuthGuard("local"))
  @Post("login")
  async login(@Request() req: any, @Body() _loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return this.authService.login(
      user as { id: number; email: string; name: string },
    );
  }

  @Get("profile")
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}
