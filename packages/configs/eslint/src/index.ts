export { defineConfig } from 'eslint/config';
export { default, ignoresConfig, baseConfig, testConfig, allConfig } from './base';
export * from './library';
export * from './nextjs';
export * from './nestjs';
export * from './react';
export * from './mdx';
export type { Linter } from 'eslint';