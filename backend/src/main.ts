import 'reflect-metadata';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnvFile('.env');
loadEnvFile('.env.local');

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

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
