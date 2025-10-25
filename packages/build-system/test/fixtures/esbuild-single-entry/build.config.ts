import { createEsbuildBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createEsbuildBuildConfig({
  name: 'test-esbuild-single',
  entryPoints: ['src/index.ts'],
  outDir: 'dist',
  builderOptions: {
    bundle: true,
    platform: 'node',
    format: 'esm',
    minify: false,
  },
});
