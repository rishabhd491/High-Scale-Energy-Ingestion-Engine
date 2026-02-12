import * as crypto from 'crypto';

// Polyfill for crypto.randomUUID() if not available globally (needed for some Node 18 environments)
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
