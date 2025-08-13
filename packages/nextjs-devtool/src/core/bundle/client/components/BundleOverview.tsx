/**
 * Bundle Overview Component
 * 
 * Displays the main bundle information including build metadata,
 * total size, and quick statistics.
 */

import React from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';

interface BundleOverviewProps {
  context: PluginComponentContext;
}

export const BundleOverview: React.FC<BundleOverviewProps> = ({ context }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Bundle Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-700">Build Information</h3>
          <p className="text-sm text-gray-600 mt-2">
            Plugin ID: {context.pluginId}
          </p>
          <p className="text-sm text-gray-600">
            Status: {context.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-700">Quick Actions</h3>
          <button 
            onClick={() => context.onNavigate('assets')}
            className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            View Assets
          </button>
        </div>
      </div>
    </div>
  );
};
