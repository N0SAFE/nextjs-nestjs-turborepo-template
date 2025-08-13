/**
 * Core Router - Plugin Definitions Export
 * 
 * This file exports all available plugins for the DevTool system.
 * As specified in the architecture, this file should only contain
 * plugin definitions and exports, not implementation logic.
 */

import routesPlugin from './routes';

/**
 * Core plugins - Always available
 */
export const corePlugins = {
  routes: routesPlugin,
} as const;

/**
 * Module plugins - Optionally loaded
 */
export const modulePlugins = {
  // Additional module plugins will be added here
} as const;

/**
 * All available plugins
 */
export const allPlugins = {
  ...corePlugins,
  ...modulePlugins,
} as const;

/**
 * Plugin registry for type inference
 */
export type PluginRegistry = typeof allPlugins;

/**
 * Available plugin IDs
 */
export type PluginId = keyof PluginRegistry;
