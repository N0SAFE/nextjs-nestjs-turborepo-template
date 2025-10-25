import { createTscBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createTscBuildConfig({
  name: 'test-tsc-single',
  outDir: 'dist',
  builderOptions: {
    declaration: true,
    sourceMap: true,
  },
});
