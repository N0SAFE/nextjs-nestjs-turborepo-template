import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // For STDIO transport, we don't want normal HTTP logging to pollute STDOUT.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  // The MCP server is initialized by the module; for STDIO no need to listen.
  // We keep the application open so the process stays alive to serve STDIO.
}

void bootstrap();
