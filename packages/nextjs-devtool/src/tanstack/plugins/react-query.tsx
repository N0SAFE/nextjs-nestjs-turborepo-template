/**
 * React Query Plugin for TanStack DevTools
 * 
 * Integrates React Query DevTools as a TanStack DevTool plugin
 */

import React from 'react';
import { TanStackDevtoolsReactPlugin } from '@tanstack/react-devtools';
import { createTanStackPlugin } from '../plugin-registry';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * React Query Plugin Component
 * 
 * This component wraps the existing React Query DevTools in a container
 * that can be embedded within the TanStack DevTools interface
 */
function ReactQueryComponent() {
  return (
    <div className="p-4 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          React Query DevTools
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Inspect queries, mutations, and cache state
        </p>
      </div>
      
      {/* Embed React Query DevTools in inline mode */}
      <div className="border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <ReactQueryDevtools
          initialIsOpen={true}
          buttonPosition="top-right"
          position="relative"
        />
      </div>
    </div>
  );
}

/**
 * Create and export the React Query plugin
 */
export const reactQueryPlugin: TanStackDevtoolsReactPlugin = createTanStackPlugin(
  {
    id: 'react-query',
    name: 'React Query',
    description: 'React Query DevTools integration',
    category: 'Data',
    priority: 95,
  },
  () => <ReactQueryComponent />
);