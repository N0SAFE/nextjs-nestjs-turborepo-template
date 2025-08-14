/**
 * TanStack DevTools Integration
 * 
 * This module provides NextJS DevTool plugins that are compatible with TanStack DevTools.
 * It exports plugins for route exploration, bundle inspection, logging, and performance monitoring
 * in a format that integrates seamlessly with the TanStack DevTools ecosystem.
 */

export { TanStackDevtoolsReactPlugin } from '@tanstack/react-devtools';

// Export all TanStack-compatible plugins
export { routeExplorerPlugin } from './plugins/route-explorer';
export { bundleInspectorPlugin } from './plugins/bundle-inspector';
export { logViewerPlugin } from './plugins/log-viewer';
export { performanceMonitorPlugin } from './plugins/performance-monitor';
export { reactQueryPlugin } from './plugins/react-query';

// Export plugin registry and utilities
export { 
  createTanStackPlugin,
  registerTanStackPlugin,
  getAllTanStackPlugins,
  type TanStackPluginConfig,
  type TanStackPluginExports
} from './plugin-registry';

// Export provider for React integration
export { TanStackDevToolProvider } from './provider';