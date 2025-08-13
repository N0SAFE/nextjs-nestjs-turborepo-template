/**
 * Asset List Component
 * 
 * Displays a list of all bundle assets with their sizes and types.
 */

import React from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';

interface AssetListProps {
  context: PluginComponentContext;
}

export const AssetList: React.FC<AssetListProps> = ({ context }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Bundle Assets</h2>
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <p className="text-sm text-gray-600">
            Plugin: {context.pluginId}
          </p>
          {context.pageId && (
            <p className="text-sm text-gray-600">
              Page: {context.pageId}
            </p>
          )}
        </div>
        <div className="p-4">
          <p className="text-gray-700">Asset list will be implemented here</p>
          <button 
            onClick={() => context.onNavigate('asset-detail')}
            className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            View Asset Details
          </button>
        </div>
      </div>
    </div>
  );
};
