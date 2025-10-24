import { createBunBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createBunBuildConfig({
  name: 'test-bun-single',
  entryPoints: ['src/index.ts'],
  outDir: 'dist',
  builderOptions: {
    format: 'esm',
    target: 'node',
    minify: false,
  },
});
