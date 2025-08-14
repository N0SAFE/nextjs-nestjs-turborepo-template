/**
 * TanStack Plugin Registry
 * 
 * Utilities for creating and managing TanStack DevTool-compatible plugins
 */

import React, { ReactNode } from 'react';
// Import type only to avoid compilation issues
import type { TanStackDevtoolsReactPlugin } from '@tanstack/react-devtools';

/**
 * Configuration for creating TanStack plugins
 */
export interface TanStackPluginConfig {
  id?: string;
  name: string;
  description?: string;
  icon?: ReactNode;
  priority?: number;
  category?: string;
}

/**
 * Plugin exports that follow TanStack patterns
 */
export interface TanStackPluginExports {
  id: string;
  name: string;
  component: () => ReactNode;
  metadata?: {
    description?: string;
    icon?: ReactNode;
    priority?: number;
    category?: string;
  };
}

/**
 * Registry of all TanStack-compatible plugins
 */
const pluginRegistry = new Map<string, TanStackDevtoolsReactPlugin>();

/**
 * Create a TanStack DevTool-compatible plugin
 */
export function createTanStackPlugin(
  config: TanStackPluginConfig,
  render: () => ReactNode
): TanStackDevtoolsReactPlugin {
  const id = config.id || config.name.toLowerCase().replace(/\s+/g, '-');
  
  return {
    id,
    name: config.name,
    render,
  };
}

/**
 * Register a TanStack plugin in the global registry
 */
export function registerTanStackPlugin(plugin: TanStackDevtoolsReactPlugin): void {
  const id = plugin.id || (typeof plugin.name === 'string' ? plugin.name : 'unknown');
  pluginRegistry.set(id, plugin);
}

/**
 * Get all registered TanStack plugins
 */
export function getAllTanStackPlugins(): TanStackDevtoolsReactPlugin[] {
  return Array.from(pluginRegistry.values());
}

/**
 * Get a specific plugin by ID
 */
export function getTanStackPlugin(id: string): TanStackDevtoolsReactPlugin | undefined {
  return pluginRegistry.get(id);
}

/**
 * Clear all registered plugins (useful for testing)
 */
export function clearTanStackPlugins(): void {
  pluginRegistry.clear();
}