import { createRollupBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createRollupBuildConfig({
  name: 'test-rollup-multi',
  outDir: 'dist',
  builderOptions: {
    input: {
      alpha: 'src/alpha.ts',
      beta: 'src/beta.ts',
    },
    format: 'cjs',
  },
});
