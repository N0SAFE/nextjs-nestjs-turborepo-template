/**
 * TanStack DevTool Provider
 * 
 * React provider component that initializes TanStack DevTools with all registered plugins
 */

import React, { ReactNode } from 'react';
import { TanStackDevtools, TanStackDevtoolsReactPlugin } from '@tanstack/react-devtools';
import { getAllTanStackPlugins, registerTanStackPlugin } from './plugin-registry';

// Import and register all plugins
import { routeExplorerPlugin } from './plugins/route-explorer';
import { bundleInspectorPlugin } from './plugins/bundle-inspector';
import { logViewerPlugin } from './plugins/log-viewer';
import { performanceMonitorPlugin } from './plugins/performance-monitor';
import { reactQueryPlugin } from './plugins/react-query';

// Register all plugins when module is imported
registerTanStackPlugin(routeExplorerPlugin);
registerTanStackPlugin(bundleInspectorPlugin);
registerTanStackPlugin(logViewerPlugin);
registerTanStackPlugin(performanceMonitorPlugin);
registerTanStackPlugin(reactQueryPlugin);

export interface TanStackDevToolProviderProps {
  children: ReactNode;
  /**
   * Additional plugins to include beyond the default set
   */
  plugins?: TanStackDevtoolsReactPlugin[];
  /**
   * Whether to enable the devtools in production
   * @default false
   */
  enableInProduction?: boolean;
  /**
   * Initial configuration for the devtools
   */
  config?: {
    initialIsOpen?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    theme?: 'light' | 'dark' | 'auto';
  };
}

/**
 * Provider component that wraps the application with TanStack DevTools
 */
export function TanStackDevToolProvider({
  children,
  plugins = [],
  enableInProduction = false,
  config = {},
}: TanStackDevToolProviderProps) {
  // Only show devtools in development or when explicitly enabled in production
  const shouldShowDevtools = process.env.NODE_ENV === 'development' || enableInProduction;

  if (!shouldShowDevtools) {
    return <>{children}</>;
  }

  // Combine default plugins with any additional plugins
  const allPlugins = [...getAllTanStackPlugins(), ...plugins];

  const defaultConfig = {
    initialIsOpen: false,
    position: 'bottom-right' as const,
    theme: 'auto' as const,
    ...config,
  };

  return (
    <>
      {children}
      <TanStackDevtools
        plugins={allPlugins}
        config={defaultConfig}
      />
    </>
  );
}