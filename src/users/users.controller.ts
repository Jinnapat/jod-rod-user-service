import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('getProfile')
  async getProfileHandler(@Req() request) {
    const userId = request['user']['sub'];
    return await this.usersService.getUserById(userId);
  }

  @Patch('editProfile')
  async updateProfileHandler(
    @Req() request,
    @Body('username') username,
    @Body('password') password,
  ) {
    const userId = request['user']['sub'];
    return await this.usersService.updateUser(userId, username, password);
  }

  @Get('getPenaltyStatus')
  async getPenaltyStatusHandler(@Req() request) {
    const userId = request['user']['sub'];
    const user = await this.usersService.getUserById(userId);
    return user.is_penalized;
  }
}
