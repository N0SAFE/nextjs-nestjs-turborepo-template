/**
 * Builder adapter interface
 * All builder implementations must conform to this interface
 */

import { BuildResult, PackageBuildConfig, BuildOptions } from '../types';

/**
 * Base interface for all builder adapters
 */
export interface BuilderAdapter {
  /**
   * Adapter name for identification
   */
  readonly name: string;

  /**
   * Check if this adapter is available in the current environment
   */
  isAvailable(): Promise<boolean>;

  /**
   * Execute the build for a package
   * @param packagePath Absolute path to the package
   * @param config Build configuration
   * @param options Build options
   * @returns Build result with status, artifacts, and metadata
   */
  build(
    packagePath: string,
    config: PackageBuildConfig,
    options: BuildOptions,
  ): Promise<BuildResult>;

  /**
   * Discover artifacts produced by the build
   * @param packagePath Absolute path to the package
   * @param config Build configuration
   * @returns List of discovered artifacts with metadata
   */
  discoverArtifacts(
    packagePath: string,
    config: PackageBuildConfig,
  ): Promise<Array<{ path: string; size: number; checksum: string }>>;
}

/**
 * Builder adapter registry for managing available adapters
 */
export interface BuilderAdapterRegistry {
  /**
   * Register a new adapter
   */
  register(adapter: BuilderAdapter): void;

  /**
   * Get adapter by name
   */
  get(name: string): BuilderAdapter | undefined;

  /**
   * Get the best available adapter based on priority
   * Priority: bun > esbuild > tsc > rollup
   */
  getBest(): Promise<BuilderAdapter | undefined>;

  /**
   * List all registered adapters
   */
  list(): BuilderAdapter[];
}
