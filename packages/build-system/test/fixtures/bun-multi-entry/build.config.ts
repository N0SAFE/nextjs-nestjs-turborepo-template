import { createBunBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createBunBuildConfig({
  name: 'test-bun-multi',
  entryPoints: ['src/index.ts', 'src/utils.ts'],
  outDir: 'dist',
  builderOptions: {
    format: 'esm',
    target: 'node',
    splitting: true,
  },
});
