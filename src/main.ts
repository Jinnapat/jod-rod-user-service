import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerWithEureka } from './helper/eureka-helper'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  registerWithEureka('USER-SERVICE', 7005)
  await app.listen(3000);
}
bootstrap();
