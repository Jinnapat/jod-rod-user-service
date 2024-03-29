import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  loginHandler(@Body('username') username, @Body('password') password) {
    return this.authService.login(username, password);
  }

  @Post('register')
  registerHandler(
    @Body('email') email,
    @Body('username') username,
    @Body('password') password,
  ) {
    return this.usersService.createUser(email, username, password);
  }

  @Post('resetPassword')
  async resetPasswordHandler(@Body('email') email, @Body('password') password) {
    const userId = await this.usersService.getUserIdByEmail(email);
    this.usersService.resetPassword(userId, password);
  }
}
