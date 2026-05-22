/// <reference types="vitest" />
import { defineProject } from 'vitest/config';
import * as path from 'path';
import { createNodeConfig } from '@repo/config-vitest';

export default defineProject(
  createNodeConfig({
    test: {
      name: 'nestjs-base',
      environment: 'node',
      include: ['src/**/*.spec.ts'],
      exclude: ['node_modules', 'dist'],
      globals: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
    },
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    },
  }),
);
