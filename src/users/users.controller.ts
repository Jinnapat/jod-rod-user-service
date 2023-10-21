import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfileHandler(@Req() request) {
    const userId = request['user']['sub'];
    return this.usersService.getUserById(userId);
  }

  @Post('update_profile')
  updateProfileHandler(
    @Req() request,
    @Body('username') username,
    @Body('password') password,
  ) {
    const userId = request['user']['sub'];
    return this.usersService.updateUser(userId, username, password);
  }
}
