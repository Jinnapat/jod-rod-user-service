import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [UsersService, ConfigService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
