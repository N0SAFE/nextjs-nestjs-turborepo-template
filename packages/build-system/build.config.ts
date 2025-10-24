// Build configuration for @repo/build-system
// This file defines how the build-system package builds itself

export const buildConfig = {
  name: '@repo/build-system',
  entryPoints: [
    'src/index.ts',
    'src/cli.ts',
    'src/main.ts',
  ],
  outDir: 'dist',
  builder: 'bun',
  builderOptions: {
    format: 'esm',
    target: 'node',
    sourcemap: 'external',
    minify: false,
    splitting: false,
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
} as const;
