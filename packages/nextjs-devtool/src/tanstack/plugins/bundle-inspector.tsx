/**
 * Bundle Inspector Plugin for TanStack DevTools
 * 
 * Provides bundle analysis functionality as a TanStack DevTool plugin
 */

import React from 'react';
import { TanStackDevtoolsReactPlugin } from '@tanstack/react-devtools';
import { createTanStackPlugin } from '../plugin-registry';

/**
 * Bundle Inspector Plugin Component
 */
function BundleInspectorComponent() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Bundle Analysis
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Analyze your application's bundle size, dependencies, and performance metrics
        </p>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">Bundle Inspector</h3>
        <p className="text-gray-600">Bundle analysis will be implemented here.</p>
      </div>
    </div>
  );
}

/**
 * Create and export the Bundle Inspector plugin
 */
export const bundleInspectorPlugin: TanStackDevtoolsReactPlugin = createTanStackPlugin(
  {
    id: 'bundle-inspector',
    name: 'Bundle Inspector',
    description: 'Analyze bundle size and dependencies',
    category: 'Performance',
    priority: 90,
  },
  () => <BundleInspectorComponent />
);