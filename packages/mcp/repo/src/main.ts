#!/usr/bin/env node
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  // The McpModule with McpTransportType.STDIO will handle the connection automatically
  // via the StdioService that gets initialized on application bootstrap
  
  process.on('SIGINT', () => {
    void (async () => {
      await app.close();
      process.exit(0);
    })();
  });

  // Keep the process alive
  await new Promise(() => {});
}

void bootstrap();
