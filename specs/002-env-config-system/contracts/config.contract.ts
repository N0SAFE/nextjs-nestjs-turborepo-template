/**
 * Configuration Contracts
 * 
 * Defines runtime configuration for the CLI tool.
 */

import type { ValidationOptions } from './validation.contract';

/**
 * Execution mode
 */
export enum ExecutionMode {
  /** Interactive mode - prompt user for values */
  INTERACTIVE = 'interactive',
  
  /** Argument mode - use CLI arguments */
  ARGUMENT = 'argument',
  
  /** CI mode - strict validation, no prompts */
  CI = 'ci'
}

/**
 * Complete runtime configuration
 */
export interface Configuration {
  /** Execution mode */
  readonly mode: ExecutionMode;
  
  /** Template file path */
  readonly templatePath: string;
  
  /** Output .env file path */
  readonly outputPath: string;
  
  /** CLI arguments (for argument mode) */
  readonly args?: ReadonlyMap<string, string>;
  
  /** Plugin directories (for auto-discovery) */
  readonly pluginPaths?: readonly string[];
  
  /** Validation options */
  readonly validation: ValidationOptions;
  
  /** Performance options */
  readonly performance: PerformanceOptions;
}

/**
 * Performance optimization options
 */
export interface PerformanceOptions {
  /** Enable caching */
  readonly enableCache: boolean;
  
  /** Cache size limit (number of items) */
  readonly cacheSize: number;
  
  /** Enable parallel validation */
  readonly enableParallel: boolean;
  
  /** Batch size for parallel processing */
  readonly batchSize: number;
  
  /** Enable string interning (memory optimization) */
  readonly enableInterning?: boolean;
  
  /** Enable object pooling (memory optimization) */
  readonly enablePooling?: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Configuration = {
  mode: ExecutionMode.INTERACTIVE,
  templatePath: './.env.template.yml',
  outputPath: './.env',
  validation: {
    strict: false,
    maxNestingDepth: 5,
    maxSegmentLength: 50,
    allowCircular: false
  },
  performance: {
    enableCache: true,
    cacheSize: 50,
    enableParallel: true,
    batchSize: 50,
    enableInterning: true,
    enablePooling: true
  }
};

/**
 * CI mode configuration overrides
 */
export const CI_CONFIG_OVERRIDES: Partial<Configuration> = {
  mode: ExecutionMode.CI,
  validation: {
    strict: true,
    maxNestingDepth: 5,
    maxSegmentLength: 50,
    allowCircular: false
  }
};

/**
 * Configuration builder
 * Provides fluent API for constructing configuration
 */
export class ConfigurationBuilder {
  private config: Configuration = { ...DEFAULT_CONFIG };
  
  setMode(mode: ExecutionMode): this {
    this.config = { ...this.config, mode };
    return this;
  }
  
  setTemplatePath(path: string): this {
    this.config = { ...this.config, templatePath: path };
    return this;
  }
  
  setOutputPath(path: string): this {
    this.config = { ...this.config, outputPath: path };
    return this;
  }
  
  setArgs(args: Map<string, string>): this {
    this.config = { ...this.config, args };
    return this;
  }
  
  setPluginPaths(paths: string[]): this {
    this.config = { ...this.config, pluginPaths: paths };
    return this;
  }
  
  setValidation(validation: ValidationOptions): this {
    this.config = { ...this.config, validation };
    return this;
  }
  
  setPerformance(performance: PerformanceOptions): this {
    this.config = { ...this.config, performance };
    return this;
  }
  
  build(): Configuration {
    return this.config;
  }
  
  /**
   * Create CI mode configuration
   */
  static forCI(): ConfigurationBuilder {
    const builder = new ConfigurationBuilder();
    builder.config = { ...DEFAULT_CONFIG, ...CI_CONFIG_OVERRIDES };
    return builder;
  }
}
