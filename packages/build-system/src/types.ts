/**
 * Core type definitions for the build system
 */

import { z } from 'zod';
import { BuilderOptionsSchema } from './builders/types';

/**
 * Builder types supported by the build system
 */
export type BuilderType = 'bun' | 'esbuild' | 'tsc' | 'rollup' | 'custom';

/**
 * Build status enum
 */
export enum BuildStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  IN_PROGRESS = 'in_progress',
  QUEUED = 'queued',
}

/**
 * Build artifact descriptor
 */
export interface BuildArtifact {
  /** Path to the artifact relative to package root */
  path: string;
  /** Size in bytes */
  size: number;
  /** SHA256 checksum */
  checksum: string;
  /** Optional URI for remote storage */
  uri?: string;
}

/**
 * Build result returned by the build system
 */
export interface BuildResult {
  /** Build status */
  status: BuildStatus;
  /** Exit code from the build process */
  exitCode: number;
  /** Build duration in milliseconds */
  durationMs: number;
  /** List of produced artifacts */
  artifacts: BuildArtifact[];
  /** Build logs (stdout/stderr) */
  logs?: string[];
  /** Machine-readable error details if build failed */
  errors?: BuildError[];
  /** Timestamp when build started */
  startTime: Date;
  /** Timestamp when build ended */
  endTime: Date;
}

/**
 * Build error details
 */
export interface BuildError {
  /** Error message */
  message: string;
  /** Error code if available */
  code?: string;
  /** Stack trace if available */
  stack?: string;
  /** File location if error is source-related */
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
}

/**
 * Build job metadata
 */
export interface BuildJob {
  /** Unique build job identifier */
  id: string;
  /** Package name being built */
  packageName: string;
  /** Input hash for cache key */
  inputHash: string;
  /** Build start time */
  startTime: Date;
  /** Build end time */
  endTime?: Date;
  /** Current status */
  status: BuildStatus;
  /** Build artifacts */
  artifacts: BuildArtifact[];
  /** Build logs */
  logs: string[];
}

/**
 * Cache entry metadata
 */
export interface CacheEntry {
  /** Input hash used as cache key */
  inputHash: string;
  /** Timestamp when cache was created */
  createdAt: Date;
  /** Timestamp when cache was last accessed */
  lastAccessedAt: Date;
  /** Cache expiry timestamp */
  expiresAt?: Date;
  /** List of cached artifacts */
  artifacts: BuildArtifact[];
}

/**
 * Package build configuration schema
 */
export const PackageBuildConfigSchema = z.object({
  /** Package name */
  name: z.string(),
  /** Friendly display name */
  friendlyName: z.string().optional(),
  /** Builder to use */
  builder: z.enum(['bun', 'esbuild', 'tsc', 'rollup', 'custom']).default('bun'),
  /** Builder-specific options */
  builderOptions: z.record(z.string(), z.unknown()).optional(),
  /** Build entry points (for SDK-based builds) */
  entryPoints: z.array(z.string()).optional(),
  /** Output directory */
  outDir: z.string().default('dist'),
  /** Artifact globs */
  artifactGlobs: z.array(z.string()).default(['dist/**/*']),
  /** Cache rules */
  cache: z.object({
    /** Include globs for cache key computation */
    include: z.array(z.string()).default(['src/**/*', 'package.json']),
    /** Exclude globs for cache key computation */
    exclude: z.array(z.string()).default(['node_modules/**', 'dist/**']),
    /** Custom cache key strategy */
    strategy: z.enum(['content-hash', 'timestamp']).default('content-hash'),
    /** Cache expiry in milliseconds */
    expiryMs: z.number().optional(),
  }).optional(),
  /** Incremental build flags */
  incremental: z.boolean().default(true),
  /** Pre-build hooks */
  preBuildHook: z.string().optional(),
  /** Post-build hooks */
  postBuildHook: z.string().optional(),
  /** Required environment variables */
  requiredEnv: z.array(z.string()).optional(),
  /** Clean commands */
  cleanCommand: z.string().optional(),
  /** Environment-specific overrides */
  envOverrides: z.record(z.string(), z.unknown()).optional(),
});

export type PackageBuildConfig = z.infer<typeof PackageBuildConfigSchema>;

/**
 * Build options for CLI/API
 */
export interface BuildOptions {
  /** Package path or name */
  package: string;
  /** Force clean build (ignore cache) */
  clean?: boolean;
  /** Target environment */
  target?: 'development' | 'production' | 'test';
  /** Output format (json, text) */
  format?: 'json' | 'text';
  /** Verbose logging */
  verbose?: boolean;
  /** Watch mode */
  watch?: boolean;
}

/**
 * List of buildable packages result
 */
export interface BuildablePackage {
  name: string;
  path: string;
  config?: PackageBuildConfig;
  supported: boolean;
}
