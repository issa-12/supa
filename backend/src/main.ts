import 'reflect-metadata';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnvFile('.env');
loadEnvFile('.env.local');

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // OpenAPI / Swagger UI for the public API. Served at /api/docs (the JSON at
  // /api/docs-json) — reachable through the nginx /api proxy. Documents both the
  // API-key-authenticated public endpoints and the JWT key-management endpoints.
  const openApiConfig = new DocumentBuilder()
    .setTitle('ReadTrack Public API')
    .setDescription(
      'Public REST API for ReadTrack. Authenticate public endpoints with a consumer API key sent in the `X-API-Key` header. Manage keys via the JWT-authenticated /api/keys endpoints.',
    )
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'apiKey')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Baseline security headers directly on the backend (defense-in-depth — nginx
  // also sets these on the public surface, but port 3000 shouldn't be bare).
  app.use((_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-XSS-Protection', '0');
    next();
  });

  app.enableCors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:4200',
    credentials: true,
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);

  console.log(`NestJS backend listening on http://localhost:${port}`);
  console.log(`Supabase service role configured: ${Boolean(process.env['SUPABASE_SERVICE_ROLE_KEY'])}`);
  console.log(`Supabase anon key configured: ${Boolean(process.env['SUPABASE_ANON_KEY'])}`);
}

bootstrap();

function loadEnvFile(filename: string): void {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}
