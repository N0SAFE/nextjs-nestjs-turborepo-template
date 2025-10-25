import { createEsbuildBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createEsbuildBuildConfig({
  name: 'test-esbuild-multi',
  entryPoints: ['src/main.ts', 'src/lib.ts'],
  outDir: 'dist',
  builderOptions: {
    bundle: false,
    platform: 'node',
    format: 'cjs',
  },
});
