/**
 * Type-safe configuration helper functions for build.config.ts files
 * These functions provide autocompletion and type checking when creating build configurations
 */

import { PackageBuildConfig } from '../types';
import {
  BunBuildOptions,
  EsbuildBuildOptions,
  TscBuildOptions,
  RollupBuildOptions,
} from './types';

/**
 * Create a type-safe Bun build configuration
 * @example
 * ```ts
 * export const buildConfig = createBunBuildConfig({
 *   name: '@repo/my-package',
 *   entryPoints: ['src/index.ts'],
 *   builderOptions: {
 *     format: 'esm',
 *     minify: true,
 *   },
 * });
 * ```
 */
export function createBunBuildConfig(
  config: Omit<PackageBuildConfig, 'builder'> & {
    builderOptions?: BunBuildOptions;
  },
): PackageBuildConfig {
  return {
    ...config,
    builder: 'bun',
    builderOptions: config.builderOptions as Record<string, unknown>,
  };
}

/**
 * Create a type-safe esbuild build configuration
 * @example
 * ```ts
 * export const buildConfig = createEsbuildBuildConfig({
 *   name: '@repo/my-package',
 *   entryPoints: ['src/index.ts'],
 *   builderOptions: {
 *     bundle: true,
 *     platform: 'node',
 *     format: 'esm',
 *   },
 * });
 * ```
 */
export function createEsbuildBuildConfig(
  config: Omit<PackageBuildConfig, 'builder'> & {
    builderOptions?: EsbuildBuildOptions;
  },
): PackageBuildConfig {
  return {
    ...config,
    builder: 'esbuild',
    builderOptions: config.builderOptions as Record<string, unknown>,
  };
}

/**
 * Create a type-safe TypeScript compiler build configuration
 * @example
 * ```ts
 * export const buildConfig = createTscBuildConfig({
 *   name: '@repo/my-package',
 *   builderOptions: {
 *     declaration: true,
 *     sourceMap: true,
 *   },
 * });
 * ```
 */
export function createTscBuildConfig(
  config: Omit<PackageBuildConfig, 'builder'> & {
    builderOptions?: TscBuildOptions;
  },
): PackageBuildConfig {
  return {
    ...config,
    builder: 'tsc',
    builderOptions: config.builderOptions as Record<string, unknown>,
  };
}

/**
 * Create a type-safe Rollup build configuration
 * @example
 * ```ts
 * export const buildConfig = createRollupBuildConfig({
 *   name: '@repo/my-package',
 *   builderOptions: {
 *     input: 'src/index.ts',
 *     format: 'esm',
 *   },
 * });
 * ```
 */
export function createRollupBuildConfig(
  config: Omit<PackageBuildConfig, 'builder'> & {
    builderOptions?: RollupBuildOptions;
  },
): PackageBuildConfig {
  return {
    ...config,
    builder: 'rollup',
    builderOptions: config.builderOptions as Record<string, unknown>,
  };
}

/**
 * Create a generic build configuration (useful for custom builders)
 */
export function createBuildConfig(
  config: PackageBuildConfig,
): PackageBuildConfig {
  return config;
}
