import {
  Controller,
  Get,
  Patch,
  Body,
  Headers,
  Post,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get('getUser/:id')
  async getUserHandler(@Param('id') userId) {
    return await this.usersService.getUserById(userId);
  }

  @Get('getProfile')
  async getProfileHandler(@Headers('Authorization') bearerToken) {
    return await this.usersService.getUser(bearerToken);
  }

  @Patch('editProfile')
  async updateProfileHandler(
    @Headers('Authorization') bearerToken,
    @Body('username') username,
    @Body('password') password,
  ) {
    return await this.usersService.updateUser(bearerToken, username, password);
  }

  @Get('getPenaltyStatus')
  async getPenaltyStatusHandler(@Headers('Authorization') bearerToken) {
    return await this.usersService.getPaneltyStatus(bearerToken);
  }

  @Post('addLateCount/:id')
  async addLateCountHandler(@Param('id') userId) {
    await this.usersService.addLateCount(userId);
  }
}
