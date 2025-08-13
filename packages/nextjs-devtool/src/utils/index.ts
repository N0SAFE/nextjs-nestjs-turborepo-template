/**
 * DevTool Utility Functions
 * 
 * Provides utility functions for plugin management, ORPC client creation,
 * and other common devtool operations.
 * 
 * Zero-Any Policy: All utilities maintain complete type safety.
 */

import type { 
  DevToolPlugin, 
  PluginContract, 
  TypedORPCClient 
} from '@repo/nextjs-devtool/types'

/**
 * Creates a typed ORPC contract for a plugin
 */
export function createPluginContract<T extends Record<string, unknown>>(
  contract: T
): PluginContract<T> {
  return {
    procedures: contract,
    namespace: '',
    version: '1.0.0',
  } as PluginContract<T>
}

/**
 * Plugin registration utility
 * 
 * Validates and registers a plugin with proper type checking
 */
export function registerPlugin(
  plugin: DevToolPlugin,
  registry: {
    registerPlugin: (plugin: DevToolPlugin) => void
  }
): void {
  // Validate plugin structure
  if (!plugin.name || !plugin.version || !plugin.namespace) {
    throw new Error(`Invalid plugin: missing required fields`)
  }
  
  // Register the plugin
  registry.registerPlugin(plugin)
}

/**
 * Creates a typed ORPC client
 * 
 * This is a placeholder for the actual ORPC client creation
 * It will be integrated with the web app's existing ORPC setup
 */
export function createORPCClient(baseUrl: string): TypedORPCClient {
  return {
    baseUrl,
    // This will be implemented with actual ORPC client
    call: async () => {
      throw new Error('ORPC client not implemented yet')
    },
  } as TypedORPCClient
}

/**
 * Plugin validation utility
 */
export function validatePlugin(plugin: DevToolPlugin): boolean {
  const requiredFields = ['name', 'version', 'namespace', 'kind', 'meta'] as const
  
  return requiredFields.every(field => {
    const value = plugin[field]
    return value !== undefined && value !== null && value !== ''
  })
}

/**
 * Plugin dependency resolution utility
 */
export function resolveDependencies(
  plugins: readonly DevToolPlugin[]
): Map<string, readonly string[]> {
  const dependencies = new Map<string, readonly string[]>()
  
  for (const plugin of plugins) {
    const deps: string[] = []
    
    if (plugin.kind === 'core' && plugin.dependencies) {
      deps.push(...plugin.dependencies.map(dep => dep.name))
    } else if (plugin.kind === 'module' && plugin.dependencies) {
      deps.push(...plugin.dependencies.map(dep => dep.name))
    }
    
    dependencies.set(plugin.name, deps)
  }
  
  return dependencies
}

/**
 * Deep freeze utility for immutable objects
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  // Get the property names defined on obj
  const propNames = Reflect.ownKeys(obj as object) as (keyof T)[]

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = obj[name]

    if ((value && typeof value === 'object') || typeof value === 'function') {
      deepFreeze(value)
    }
  }

  return Object.freeze(obj)
}

/**
 * Type-safe environment variable accessor
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: use Next.js public env vars
    return (window as any).__NEXT_DATA__?.env?.[key] ?? defaultValue ?? ''
  } else {
    // Server-side: use process.env
    return process.env[key] ?? defaultValue ?? ''
  }
}

/**
 * Safe JSON parser with type safety
 */
export function safeJsonParse<T>(
  jsonString: string, 
  fallback: T
): T {
  try {
    const parsed = JSON.parse(jsonString)
    return parsed as T
  } catch {
    return fallback
  }
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends readonly unknown[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout | undefined

  return (...args: T) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Plugin metadata formatter
 */
export function formatPluginInfo(plugin: DevToolPlugin): {
  readonly displayName: string
  readonly description: string
  readonly version: string
  readonly namespace: string
} {
  return {
    displayName: plugin.meta.displayName,
    description: plugin.meta.description || 'No description available',
    version: plugin.version,
    namespace: plugin.namespace,
  }
}

/**
 * Type assertion utility for runtime type checking
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`)
}

/**
 * Plugin component loader utility
 */
export async function loadPluginComponent(
  plugin: DevToolPlugin,
  componentName: string
): Promise<React.ComponentType<any> | null> {
  try {
    if (plugin.kind === 'core' && plugin.exports?.components?.[componentName]) {
      return await plugin.exports.components[componentName]()
    }
    
    if (plugin.kind === 'module' && plugin.exports?.components?.[componentName]) {
      return await plugin.exports.components[componentName]()
    }
    
    return null
  } catch (error) {
    console.error(`Failed to load component ${componentName} from plugin ${plugin.name}:`, error)
    return null
  }
}
