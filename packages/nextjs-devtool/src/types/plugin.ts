/**
 * Core Plugin Type Definitions
 * 
 * Defines the foundational interfaces and types for the DevTool plugin system
 * with complete type safety and zero `any` usage.
 */

import type { z } from 'zod';
import type { TypedORPCClient } from '@repo/nextjs-devtool/config/orpc';

/**
 * Base plugin contract definition with strict typing
 */
export interface PluginContract {
  readonly namespace: string;
  readonly procedures: Record<string, ProcedureDefinition>;
}

/**
 * Individual procedure definition with input/output validation
 */
export interface ProcedureDefinition<
  TInput extends z.ZodSchema = z.ZodSchema,
  TOutput extends z.ZodSchema = z.ZodSchema
> {
  readonly input: TInput;
  readonly output: TOutput;
  readonly method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly path?: string;
  readonly summary?: string;
  readonly description?: string;
}

/**
 * Plugin metadata for documentation and management
 */
export interface PluginMetadata {
  readonly description: string;
  readonly author?: string;
  readonly version?: string;
  readonly homepage?: string;
  readonly repository?: string;
  readonly license?: string;
  readonly keywords?: readonly string[];
  readonly dependencies?: readonly string[];
  readonly peerDependencies?: readonly string[];
  // UI-specific metadata
  readonly displayName?: string;
  readonly icon?: string | React.ReactNode;
  readonly category?: string;
  readonly priority?: number;
  readonly features?: readonly string[];
  readonly settings?: Record<string, unknown>;
  readonly routes?: () => Promise<unknown>;
}

/**
 * Plugin dependency specification
 */
export interface PluginDependency {
  readonly pluginId: string;
  readonly version?: string;
  readonly optional?: boolean;
  readonly hookName?: string;
}

/**
 * Hook provider function type
 */
export type HookProvider = () => unknown;

/**
 * Hook registration for React components
 */
export interface HookRegistration {
  readonly name: string;
  readonly description?: string;
  readonly version?: string;
  readonly tags?: readonly string[];
  readonly factory: HookProvider | (() => Promise<HookProvider>);
  readonly dependencies?: readonly (string | PluginDependency)[];
}

/**
 * Type-safe plugin exports with selective loading
 */
export interface PluginExports<T extends PluginContract> {
  /**
   * Server-side ORPC router implementation
   * Loaded only when API endpoints are needed
   */
  readonly server?: () => Promise<ORPCRouter<T>>;
  
  /**
   * React components with typed ORPC client injection
   * Loaded only when UI components are rendered
   */
  readonly components?: Readonly<{
    [K in string]: () => Promise<React.ComponentType<{
      orpc: TypedORPCClient<T>;
      onClose?: () => void;
      className?: string;
    }>>;
  }>;
  
  /**
   * Custom hooks with typed ORPC client access
   * Loaded only when hooks are actually used
   */
  readonly hooks?: Readonly<{
    [K in string]: () => Promise<(orpc: TypedORPCClient<T>) => TypedHookResult<T, K>>;
  }>;
}

/**
 * Hook result type with proper inference based on plugin contract
 */
export type TypedHookResult<T extends PluginContract, K extends string> = 
  T extends { procedures: Record<K, { output: infer O }> }
    ? O extends z.ZodSchema
      ? {
          data: z.infer<O> | null;
          isLoading: boolean;
          error: Error | null;
          refetch: () => Promise<z.infer<O>>;
        }
      : unknown
    : unknown;

/**
 * Core plugin interface for always-present plugins
 */
export interface CorePlugin<T extends PluginContract = PluginContract> 
  extends DevToolPlugin<T> {
  readonly kind: 'core';
}

/**
 * Module plugin interface for optional plugins
 */
export interface ModulePlugin<T extends PluginContract = PluginContract>
  extends DevToolPlugin<T> {
  readonly kind: 'module';
  readonly enabled?: boolean;
  readonly dependencies?: readonly string[];
}

/**
 * Base DevTool plugin definition with complete type safety
 */
export interface DevToolPlugin<T extends PluginContract = PluginContract> {
  readonly kind: 'core' | 'module';
  readonly name: string;
  readonly version: string;
  readonly contract: T;
  readonly exports: PluginExports<T>;
  readonly meta?: PluginMetadata;
}

/**
 * Registered plugin with runtime state
 */
export interface RegisteredPlugin<T extends PluginContract = PluginContract> {
  readonly plugin: DevToolPlugin<T>;
  readonly router?: ORPCRouter<T>;
  readonly components: Map<string, React.ComponentType<any>>;
  readonly hooks: Map<string, (...args: any[]) => any>;
  readonly status: 'idle' | 'loading' | 'active' | 'error' | 'disabled';
  readonly loadedAt?: Date;
  readonly error?: Error;
}

/**
 * Plugin result type for error handling without any
 */
export type PluginResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: PluginError };

/**
 * Structured error type for plugin operations
 */
export interface PluginError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, string | number | boolean>;
  readonly stack?: string;
}

/**
 * Generic typed error wrapper
 */
export interface TypedError<T extends string = string> {
  readonly type: T;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * ORPC Router type placeholder - will be properly typed with actual ORPC implementation
 */
export interface ORPCRouter<T extends PluginContract = PluginContract> {
  readonly contract: T;
  // Additional router properties will be defined based on actual ORPC implementation
}

/**
 * Plugin loading state for UI components
 */
export type PluginLoadingState<T> = 
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: PluginError };

/**
 * Type utilities for plugin system
 */
export namespace PluginTypes {
  /**
   * Extract the contract type from a plugin
   */
  export type ExtractContract<T> = T extends DevToolPlugin<infer C> ? C : never;
  
  /**
   * Extract namespace from a contract
   */
  export type ExtractNamespace<T> = T extends { namespace: infer N } ? N : never;
  
  /**
   * Create a union type of all procedure names in a contract
   */
  export type ProcedureNames<T extends PluginContract> = keyof T['procedures'];
  
  /**
   * Get input type for a specific procedure
   */
  export type ProcedureInput<
    T extends PluginContract,
    K extends ProcedureNames<T>
  > = T['procedures'][K] extends { input: infer I } 
    ? I extends z.ZodSchema 
      ? z.infer<I> 
      : never 
    : never;
    
  /**
   * Get output type for a specific procedure
   */
  export type ProcedureOutput<
    T extends PluginContract,
    K extends ProcedureNames<T>
  > = T['procedures'][K] extends { output: infer O } 
    ? O extends z.ZodSchema 
      ? z.infer<O> 
      : never 
    : never;
}
