import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: false,
      transform: true, // auto-transform query params / body to DTO types
    }),
  );

  // CORS – allow frontend on any localhost port during development
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Leads Tracking API')
    .setDescription(
      'REST API for managing sales leads and their notes.\n\n' +
        '**Status values:** `new` | `contacted` | `qualified` | `lost`',
    )
    .setVersion('1.0')
    .addTag('Leads', 'CRUD operations on leads')
    .addTag('Notes', 'Notes attached to a lead')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\n🚀 Server running at http://localhost:${port}`);
  console.log(`📖 Swagger docs at  http://localhost:${port}/api/docs\n`);
}
bootstrap();
