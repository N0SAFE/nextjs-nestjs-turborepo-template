/**
 * Dependency Tree Component
 * 
 * Displays package dependencies and their versions.
 */

import React from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';

interface DependencyTreeProps {
  context: PluginComponentContext;
}

export const DependencyTree: React.FC<DependencyTreeProps> = ({ context }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Dependencies</h2>
      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">
          Plugin: {context.pluginId}
        </p>
        <p className="text-gray-700">Package dependency tree will be displayed here</p>
      </div>
    </div>
  );
};
