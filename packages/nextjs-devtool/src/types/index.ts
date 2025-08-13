/**
 * DevTool Types - Zero Any Policy
 * 
 * Central export point for all DevTool type definitions
 * Ensures complete type safety across the entire plugin system
 */

import type { PluginError } from './plugin';

// Re-export all plugin types
export type {
  // Core plugin interfaces
  DevToolPlugin,
  CorePlugin, 
  ModulePlugin,
  
  // Plugin contracts and definitions
  PluginContract,
  ProcedureDefinition,
  PluginMetadata,
  PluginDependency,
  HookProvider,
  HookRegistration,
  PluginExports,
  
  // Runtime plugin management
  RegisteredPlugin,
  PluginResult,
  PluginError,
  TypedError,
  PluginLoadingState,
  
  // Hook and component types
  TypedHookResult,
  ORPCRouter,
  
  // Type utilities
  PluginTypes,
} from './plugin';

// Re-export all state and UI types
export type {
  // Core UI state
  DevToolMode,
  DevToolState,
  DevToolPosition,
  DevToolStateTransition,
  
  // User preferences
  DevToolSettings,
  
  // Plugin selection and navigation
  PluginSelection,
  NavigationState,
  
  // Component contexts
  PluginComponentContext,
  PluginHookContext,
  
  // System context
  DevToolContext,
  
  // Registry state
  PluginRegistryState,
  
  // Error handling
  ErrorBoundaryState,
  
  // Performance monitoring
  PluginMetrics,
  
  // Notifications
  DevToolNotification,
  NotificationAction,
  NotificationType,
  
  // Keyboard shortcuts
  KeyboardShortcut,
  
  // UI component types
  PluginPage,
  PluginGroup,
  ReducedModeMenuItem,
  ReducedModeMenuGroup,
  ReducedModeConfig,
  
  // Type guards
  DevToolTypeGuards,
} from './state';

// Re-export ORPC types for convenience
export type {
  TypedORPCClient,
  ExtractProcedures,
} from '@repo/nextjs-devtool/config/orpc';

/**
 * Type-safe async function result without any
 */
export type AsyncResult<T, E = PluginError> = Promise<
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E }
>;

/**
 * Plugin configuration with strict typing
 */
export type PluginConfig<T extends Record<string, unknown> = Record<string, unknown>> = {
  readonly enabled: boolean;
  readonly settings: T;
  readonly version: string;
};

/**
 * Type-safe environment configuration
 */
export interface DevToolEnvironment {
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly NEXT_PUBLIC_DEVTOOL_ENABLED?: 'true' | 'false';
  readonly DEVTOOL_API_PORT?: string;
  readonly DEVTOOL_DEBUG?: 'true' | 'false';
}

/**
 * Component props with children
 */
export interface PropsWithChildren<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly children?: React.ReactNode;
}

/**
 * Make all properties of T deeply readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
