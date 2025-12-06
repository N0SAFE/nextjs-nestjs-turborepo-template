import { defineConfig } from 'vitest/config';
import baseConfig from '@repo-configs/vitest/base';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    name: '@repo/arcjet',
  },
});
