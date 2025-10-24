/**
 * Tests for config helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  createBunBuildConfig,
  createEsbuildBuildConfig,
  createTscBuildConfig,
  createRollupBuildConfig,
} from '../config-helpers';

describe('Config Helpers', () => {
  describe('createBunBuildConfig', () => {
    it('should create a Bun build config with correct builder', () => {
      const config = createBunBuildConfig({
        name: '@repo/test',
        entryPoints: ['src/index.ts'],
      });

      expect(config.builder).toBe('bun');
      expect(config.name).toBe('@repo/test');
      expect(config.entryPoints).toEqual(['src/index.ts']);
    });

    it('should accept Bun-specific builder options', () => {
      const config = createBunBuildConfig({
        name: '@repo/test',
        builderOptions: {
          format: 'esm',
          minify: true,
          target: 'node',
        },
      });

      expect(config.builderOptions).toEqual({
        format: 'esm',
        minify: true,
        target: 'node',
      });
    });
  });

  describe('createEsbuildBuildConfig', () => {
    it('should create an esbuild build config with correct builder', () => {
      const config = createEsbuildBuildConfig({
        name: '@repo/test',
        entryPoints: ['src/index.ts'],
      });

      expect(config.builder).toBe('esbuild');
      expect(config.name).toBe('@repo/test');
    });

    it('should accept esbuild-specific builder options', () => {
      const config = createEsbuildBuildConfig({
        name: '@repo/test',
        builderOptions: {
          bundle: true,
          platform: 'node',
          format: 'esm',
        },
      });

      expect(config.builderOptions).toEqual({
        bundle: true,
        platform: 'node',
        format: 'esm',
      });
    });
  });

  describe('createTscBuildConfig', () => {
    it('should create a tsc build config with correct builder', () => {
      const config = createTscBuildConfig({
        name: '@repo/test',
      });

      expect(config.builder).toBe('tsc');
      expect(config.name).toBe('@repo/test');
    });

    it('should accept TypeScript compiler options', () => {
      const config = createTscBuildConfig({
        name: '@repo/test',
        builderOptions: {
          declaration: true,
          sourceMap: true,
        },
      });

      expect(config.builderOptions).toEqual({
        declaration: true,
        sourceMap: true,
      });
    });
  });

  describe('createRollupBuildConfig', () => {
    it('should create a Rollup build config with correct builder', () => {
      const config = createRollupBuildConfig({
        name: '@repo/test',
      });

      expect(config.builder).toBe('rollup');
      expect(config.name).toBe('@repo/test');
    });

    it('should accept Rollup-specific options', () => {
      const config = createRollupBuildConfig({
        name: '@repo/test',
        builderOptions: {
          input: 'src/index.ts',
          format: 'es',
        },
      });

      expect(config.builderOptions).toEqual({
        input: 'src/index.ts',
        format: 'es',
      });
    });
  });
});
