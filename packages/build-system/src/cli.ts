#!/usr/bin/env node

/**
 * CLI entry point for build-system
 */

import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

async function bootstrap() {
  await CommandFactory.run(AppModule, {
    logger: ['error', 'warn'],
  });
}

bootstrap();
