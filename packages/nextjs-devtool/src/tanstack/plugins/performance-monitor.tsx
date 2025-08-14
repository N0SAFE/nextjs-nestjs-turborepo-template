/**
 * Performance Monitor Plugin for TanStack DevTools
 * 
 * Provides performance monitoring functionality as a TanStack DevTool plugin
 */

import React from 'react';
import { TanStackDevtoolsReactPlugin } from '@tanstack/react-devtools';
import { createTanStackPlugin } from '../plugin-registry';

/**
 * Performance Monitor Plugin Component
 */
function PerformanceMonitorComponent() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Performance Monitoring
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Monitor application performance metrics and identify bottlenecks
        </p>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">Performance Monitor</h3>
        <p className="text-gray-600">Performance metrics will be implemented here.</p>
      </div>
    </div>
  );
}

/**
 * Create and export the Performance Monitor plugin
 */
export const performanceMonitorPlugin: TanStackDevtoolsReactPlugin = createTanStackPlugin(
  {
    id: 'performance-monitor',
    name: 'Performance Monitor',
    description: 'Monitor application performance metrics',
    category: 'Performance',
    priority: 85,
  },
  () => <PerformanceMonitorComponent />
);