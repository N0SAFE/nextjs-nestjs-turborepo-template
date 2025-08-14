/**
 * Log Viewer Plugin for TanStack DevTools
 * 
 * Provides log viewing functionality as a TanStack DevTool plugin
 */

import React from 'react';
import { TanStackDevtoolsReactPlugin } from '@tanstack/react-devtools';
import { createTanStackPlugin } from '../plugin-registry';

/**
 * Log Viewer Plugin Component
 */
function LogViewerComponent() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Application Logs
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          View and filter application logs in real-time
        </p>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">Log Viewer</h3>
        <p className="text-gray-600">Log streaming will be implemented here.</p>
      </div>
    </div>
  );
}

/**
 * Create and export the Log Viewer plugin
 */
export const logViewerPlugin: TanStackDevtoolsReactPlugin = createTanStackPlugin(
  {
    id: 'log-viewer',
    name: 'Log Viewer',
    description: 'View and filter application logs',
    category: 'Debugging',
    priority: 80,
  },
  () => <LogViewerComponent />
);