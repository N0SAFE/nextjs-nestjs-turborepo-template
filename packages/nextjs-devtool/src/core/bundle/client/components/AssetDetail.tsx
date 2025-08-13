/**
 * Asset Detail Component
 * 
 * Displays detailed information about a specific bundle asset.
 */

import React from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';

interface AssetDetailProps {
  context: PluginComponentContext;
}

export const AssetDetail: React.FC<AssetDetailProps> = ({ context }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Asset Details</h2>
      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">
          Plugin: {context.pluginId}
        </p>
        <p className="text-gray-700">Detailed asset information will be displayed here</p>
        <button 
          onClick={() => context.onNavigate('assets')}
          className="mt-4 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
        >
          Back to Assets
        </button>
      </div>
    </div>
  );
};
