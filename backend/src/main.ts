import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe — strips unknown properties, transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API versioning prefix
  app.setGlobalPrefix('api/v1');

  // CORS — restrict origins via environment variable in production
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'];
  app.enableCors({ origin: corsOrigins, credentials: true });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.warn(`Backend running on http://localhost:${port}/api/v1`);
}

bootstrap();
