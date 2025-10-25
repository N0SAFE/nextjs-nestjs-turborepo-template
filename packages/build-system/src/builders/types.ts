/**
 * Builder-specific type definitions
 * Provides type-safe configuration for each adapter
 */

import { z } from 'zod';

/**
 * Bun build options
 * @see https://bun.sh/docs/bundler
 */
export interface BunBuildOptions {
  entrypoints?: string[];
  outdir?: string;
  target?: 'browser' | 'bun' | 'node';
  format?: 'esm' | 'cjs' | 'iife';
  sourcemap?: 'none' | 'inline' | 'external';
  minify?: boolean;
  splitting?: boolean;
  external?: string[];
  define?: Record<string, string>;
  naming?: string | {
    entry?: string;
    chunk?: string;
    asset?: string;
  };
  publicPath?: string;
  buildCommand?: string;
}

export const BunBuildOptionsSchema = z.object({
  entrypoints: z.array(z.string()).optional(),
  outdir: z.string().optional(),
  target: z.enum(['browser', 'bun', 'node']).optional(),
  format: z.enum(['esm', 'cjs', 'iife']).optional(),
  sourcemap: z.enum(['none', 'inline', 'external']).optional(),
  minify: z.boolean().optional(),
  splitting: z.boolean().optional(),
  external: z.array(z.string()).optional(),
  define: z.record(z.string(), z.string()).optional(),
  naming: z.union([
    z.string(),
    z.object({
      entry: z.string().optional(),
      chunk: z.string().optional(),
      asset: z.string().optional(),
    }),
  ]).optional(),
  publicPath: z.string().optional(),
  buildCommand: z.string().optional(),
});

/**
 * esbuild build options
 * @see https://esbuild.github.io/api/
 */
export interface EsbuildBuildOptions {
  entryPoints?: string[];
  outdir?: string;
  bundle?: boolean;
  platform?: 'browser' | 'node' | 'neutral';
  format?: 'iife' | 'cjs' | 'esm';
  sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both';
  minify?: boolean;
  target?: string | string[];
  external?: string[];
  define?: Record<string, string>;
  loader?: Record<string, 'js' | 'jsx' | 'ts' | 'tsx' | 'json' | 'text' | 'base64' | 'file' | 'dataurl' | 'binary' | 'css' | 'default'>;
  treeShaking?: boolean;
  entryNames?: string;
  chunkNames?: string;
  assetNames?: string;
  publicPath?: string;
}

export const EsbuildBuildOptionsSchema = z.object({
  entryPoints: z.array(z.string()).optional(),
  outdir: z.string().optional(),
  bundle: z.boolean().optional(),
  platform: z.enum(['browser', 'node', 'neutral']).optional(),
  format: z.enum(['iife', 'cjs', 'esm']).optional(),
  sourcemap: z.union([
    z.boolean(),
    z.enum(['linked', 'inline', 'external', 'both']),
  ]).optional(),
  minify: z.boolean().optional(),
  target: z.union([z.string(), z.array(z.string())]).optional(),
  external: z.array(z.string()).optional(),
  define: z.record(z.string(), z.string()).optional(),
  loader: z.record(z.string(), z.enum(['js', 'jsx', 'ts', 'tsx', 'json', 'text', 'base64', 'file', 'dataurl', 'binary', 'css', 'default'])).optional(),
  treeShaking: z.boolean().optional(),
  entryNames: z.string().optional(),
  chunkNames: z.string().optional(),
  assetNames: z.string().optional(),
  publicPath: z.string().optional(),
});

/**
 * TypeScript compiler options
 */
export interface TscBuildOptions {
  project?: string;
  declaration?: boolean;
  declarationMap?: boolean;
  sourceMap?: boolean;
  outDir?: string;
  rootDir?: string;
  incremental?: boolean;
  composite?: boolean;
}

export const TscBuildOptionsSchema = z.object({
  project: z.string().optional(),
  declaration: z.boolean().optional(),
  declarationMap: z.boolean().optional(),
  sourceMap: z.boolean().optional(),
  outDir: z.string().optional(),
  rootDir: z.string().optional(),
  incremental: z.boolean().optional(),
  composite: z.boolean().optional(),
});

/**
 * Rollup build options
 */
export interface RollupBuildOptions {
  input?: string | string[] | Record<string, string>;
  dir?: string;
  format?: 'es' | 'cjs' | 'amd' | 'umd' | 'iife' | 'system';
  sourcemap?: boolean | 'inline' | 'hidden';
  external?: string[];
  entryFileNames?: string;
  chunkFileNames?: string;
  assetFileNames?: string;
}

export const RollupBuildOptionsSchema = z.object({
  input: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(), z.string()),
  ]).optional(),
  dir: z.string().optional(),
  format: z.enum(['es', 'cjs', 'amd', 'umd', 'iife', 'system']).optional(),
  sourcemap: z.union([z.boolean(), z.enum(['inline', 'hidden'])]).optional(),
  external: z.array(z.string()).optional(),
  entryFileNames: z.string().optional(),
  chunkFileNames: z.string().optional(),
  assetFileNames: z.string().optional(),
});

export type BuilderOptions = 
  | BunBuildOptions 
  | EsbuildBuildOptions 
  | TscBuildOptions 
  | RollupBuildOptions
  | Record<string, unknown>;

export const BuilderOptionsSchema = z.union([
  BunBuildOptionsSchema,
  EsbuildBuildOptionsSchema,
  TscBuildOptionsSchema,
  RollupBuildOptionsSchema,
  z.record(z.string(), z.unknown()),
]);
