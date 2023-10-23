import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { SetMetadata } from '@nestjs/common';

const Public = () => SetMetadata('isPublic', true);

@Controller('auth')
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

  @Post('reset_password')
  @Public()
  resetPasswordHandler(@Req() request, @Body('password') password) {
    const userId = request['user']['sub'];
    this.usersService.updateUser(userId, undefined, password);
  }
}
