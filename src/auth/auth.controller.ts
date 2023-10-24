import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { SetMetadata } from '@nestjs/common';

const Public = () => SetMetadata('isPublic', true);

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @Public()
  loginHandler(@Body('username') username, @Body('password') password) {
    return this.authService.login(username, password);
  }

  @Post('register')
  @Public()
  registerHandler(
    @Body('email') email,
    @Body('username') username,
    @Body('password') password,
  ) {
    return this.usersService.createUser(email, username, password);
  }

  @Post('resetPassword')
  @Public()
  async resetPasswordHandler(@Body('email') email, @Body('password') password) {
    const user = await this.usersService.getUserByEmail(email);
    this.usersService.updateUser(user.id, undefined, password);
  }
}
