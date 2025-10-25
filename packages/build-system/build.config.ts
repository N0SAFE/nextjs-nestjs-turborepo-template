// Build configuration for @repo/build-system
// This file defines how the build-system package builds itself
import { createBunBuildConfig } from './src/builders/config-helpers.js';

export const buildConfig = createBunBuildConfig({
  name: '@repo/build-system',
  friendlyName: 'Build System',
  entryPoints: [
    'src/index.ts',
    'src/cli.ts',
    'src/main.ts',
  ],
  outDir: 'dist',
  builderOptions: {
    format: 'esm',
    target: 'node',
    sourcemap: 'external',
    minify: false,
    splitting: true, // Enable code splitting for shared chunks between entry points
    // External dependencies that shouldn't be bundled
    external: [
      '@nestjs/common',
      '@nestjs/core',
      'chokidar',
      'commander',
      'execa',
      'nest-commander',
      'reflect-metadata',
      'rxjs',
      'zod',
      'esbuild',
      'glob',
      'rollup',
      '@rollup/plugin-typescript',
      'typescript',
    ],
  },
});
