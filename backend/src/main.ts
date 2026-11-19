import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  validateProductionConfiguration();
  const app = await NestFactory.create(AppModule);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? '256kb' }));
  app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT ?? '256kb' }));

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api/v1');

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.warn(`Backend running on http://localhost:${port}/api/v1`);
}

bootstrap();

function validateProductionConfiguration(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const required = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN', 'UPI_ID', 'STORAGE_PROVIDER'];
  const missing = required.filter((name) => !process.env[name]);
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) missing.push('JWT_SECRET(32+ chars)');
  if (process.env.STORAGE_PROVIDER !== 's3') missing.push('STORAGE_PROVIDER=s3');
  if (process.env.STORAGE_PROVIDER === 's3') {
    for (const name of ['STORAGE_ACCESS_KEY', 'STORAGE_SECRET_KEY', 'STORAGE_BUCKET', 'STORAGE_REGION']) {
      if (!process.env[name]) missing.push(name);
    }
  }
  if (missing.length) throw new Error(`Missing production configuration: ${missing.join(', ')}`);
}
