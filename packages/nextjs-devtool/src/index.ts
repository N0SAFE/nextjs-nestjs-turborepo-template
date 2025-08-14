/**
 * NextJS DevTool - Main Export File
 * 
 * This is the main entry point for the @repo/nextjs-devtool package.
 * Exports all public APIs, components, and types for use in Next.js applications.
 * 
 * Zero-Any Policy: This file maintains complete type safety without any 'any' types.
 */

// Core Types - Foundation for all devtool functionality
export type {
  // Plugin System Types
  DevToolPlugin,
  CorePlugin,
  ModulePlugin,
  PluginContract,
  PluginError,
  PluginDependency,
  
  // Hook System Types  
  HookRegistration,
  HookProvider,
  
  // State Management Types
  DevToolState,
  DevToolMode,
  DevToolPosition,
  DevToolNotification,
  DevToolSettings,
  
  // ORPC Integration Types
  TypedORPCClient,
  
  // Component Context Types
  PluginComponentContext,
} from './types'

// State Management Stores
export {
  usePluginRegistry,
  usePluginRegistryActions,
  usePluginRegistryState,
  usePlugin,
} from './runtime/pluginRegistry'

// Core Plugin Registry
export {
  corePlugins,
} from './core/router'

// React Components - Main UI Components
export {
  DevToolProvider,
  DevToolContainer,
  DevToolTrigger,
  DevToolReducedBar,
  DevToolExpandedPanel,
  DevToolDemo,
  DevToolInstructions,
} from './components'

// Legacy Components - Deprecated (use DevToolContainer instead)
export {
  DevToolPanel,
  DevToolFloatingButton,
} from './components'

// Plugin Components - Available for selective loading
export {
  BundleInspector,
  RouteExplorer,
  RoutesOverview,
  RouteTree,
  RouteDetail,
  LogViewer,
  PerformanceMonitor,
} from './components/plugins'

// ORPC Contracts - For backend integration
export {
  routesContract,
  bundleContract,
  logsContract,
  performanceContract,
} from './config/contracts'

// Utility Functions
export {
  createPluginContract,
  registerPlugin,
  createORPCClient,
} from './utils'

/**
 * Default export - commented out to maintain zero-any policy
 * Users should import components directly: import { DevToolProvider, DevToolPanel } from '@repo/nextjs-devtool'
 */
// export default {
//   Provider: DevToolProvider,
//   Panel: DevToolPanel, 
//   plugins: corePlugins,
// } as const

// Re-export everything from types for convenience
export * from './types'

// TanStack DevTools Integration - NEW
export * from './tanstack'
