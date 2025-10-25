import { createRollupBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createRollupBuildConfig({
  name: 'test-rollup-single',
  outDir: 'dist',
  builderOptions: {
    input: 'src/index.ts',
    format: 'es',
    sourcemap: true,
  },
});
