/**
 * Plugin Registry Contracts
 * 
 * Defines interfaces for plugin registration and discovery.
 */

import type { IValidator, ITransformer, PluginError } from './plugin.contract';
import type { Result } from './result.contract';

/**
 * Plugin registry interface
 * Manages validators and transformers
 */
export interface IPluginRegistry {
  /** Registered validators (type → validator) */
  readonly validators: ReadonlyMap<string, IValidator>;
  
  /** Registered transformers (name → transformer) */
  readonly transformers: ReadonlyMap<string, ITransformer>;
  
  /**
   * Register a validator plugin
   * 
   * @param validator - Validator to register
   * @returns Success or error
   */
  registerValidator(validator: IValidator): Result<void, PluginError>;
  
  /**
   * Register a transformer plugin
   * 
   * @param transformer - Transformer to register
   * @returns Success or error
   */
  registerTransformer(transformer: ITransformer): Result<void, PluginError>;
  
  /**
   * Auto-discover and register plugins from directory
   * 
   * @param pluginPath - Directory to scan
   * @param pattern - Glob pattern (e.g., "*.validator.ts")
   * @returns Success or collected errors
   */
  discoverAndRegister(
    pluginPath: string,
    pattern: string
  ): Promise<Result<void, PluginError[]>>;
  
  /**
   * Get validator by type
   * 
   * @param type - Validator type (e.g., 'string', 'number')
   * @returns Validator or undefined if not found
   */
  getValidator(type: string): IValidator | undefined;
  
  /**
   * Get transformer by name
   * 
   * @param name - Transformer name (e.g., 'truncate', 'concat')
   * @returns Transformer or undefined if not found
   */
  getTransformer(name: string): ITransformer | undefined;
  
  /**
   * List all registered plugin names
   * 
   * @returns Object with validator types and transformer names
   */
  list(): PluginList;
  
  /**
   * Clear all plugins (for testing)
   */
  clear(): void;
}

/**
 * Plugin list result
 */
export interface PluginList {
  /** Validator types */
  readonly validators: readonly string[];
  
  /** Transformer names */
  readonly transformers: readonly string[];
}

/**
 * Plugin discovery configuration
 */
export interface DiscoveryConfig {
  /** Plugin directories to scan */
  readonly pluginPaths: readonly string[];
  
  /** Validator file pattern */
  readonly validatorPattern: string;
  
  /** Transformer file pattern */
  readonly transformerPattern: string;
  
  /** Discovery timeout (ms) */
  readonly timeout: number;
  
  /** Enable caching */
  readonly enableCache: boolean;
  
  /** Cache TTL (ms) */
  readonly cacheTTL: number;
}

/**
 * Default discovery configuration
 */
export const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig = {
  pluginPaths: ['./plugins/validators', './plugins/transformers'],
  validatorPattern: '*.validator.{ts,js}',
  transformerPattern: '*.transformer.{ts,js}',
  timeout: 5000, // 5 seconds
  enableCache: true,
  cacheTTL: 60000 // 1 minute
};

/**
 * Plugin metadata for discovery
 */
export interface PluginFileMetadata {
  /** File path */
  readonly filePath: string;
  
  /** Plugin type (validator or transformer) */
  readonly pluginType: 'validator' | 'transformer';
  
  /** Export name (default export or named export) */
  readonly exportName?: string;
  
  /** File modification time (for cache invalidation) */
  readonly modifiedTime: Date;
}

/**
 * Discovery result
 */
export interface DiscoveryResult {
  /** Successfully loaded validators */
  readonly validators: readonly IValidator[];
  
  /** Successfully loaded transformers */
  readonly transformers: readonly ITransformer[];
  
  /** Errors encountered during discovery */
  readonly errors: readonly PluginError[];
  
  /** Total files scanned */
  readonly filesScanned: number;
  
  /** Discovery duration (ms) */
  readonly durationMs: number;
}
