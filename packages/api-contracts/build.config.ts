import { createBunBuildConfig } from '@repo/build-system';

export const buildConfig = createBunBuildConfig({
  name: '@repo/api-contracts',
  friendlyName: 'API Contracts',
  entryPoints: ['index.ts'],
  outDir: 'dist',
  builderOptions: {
    format: 'esm',
    target: 'node',
    sourcemap: 'external',
    minify: false,
    splitting: false,
  },
  artifactGlobs: ['dist/**/*.js', 'dist/**/*.d.ts', 'dist/**/*.map'],
  cache: {
    include: ['**/*.ts', 'package.json'],
    exclude: ['node_modules/**', 'dist/**', '**/*.test.ts'],
    strategy: 'content-hash',
  },
});
