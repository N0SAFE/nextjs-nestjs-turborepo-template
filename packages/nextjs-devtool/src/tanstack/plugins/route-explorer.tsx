/**
 * Route Explorer Plugin for TanStack DevTools
 * 
 * Provides route exploration functionality as a TanStack DevTool plugin
 */

import React, { useState, useMemo } from 'react';
import { TanStackDevtoolsReactPlugin } from '@tanstack/react-devtools';
import { createTanStackPlugin } from '../plugin-registry';
import { RouteExplorer } from '../../core/routes/client/components/RouteExplorer';
import { RoutesOverview } from '../../core/routes/client/components/RoutesOverview';
import { RouteTree } from '../../core/routes/client/components/RouteTree';
import { RouteDetail } from '../../core/routes/client/components/RouteDetail';

/**
 * Route Explorer Plugin Component
 */
function RouteExplorerComponent() {
  const [selectedView, setSelectedView] = useState<'overview' | 'tree' | 'detail'>('overview');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const renderContent = useMemo(() => {
    switch (selectedView) {
      case 'overview':
        return (
          <RoutesOverview 
            onRouteSelect={(route) => {
              setSelectedRoute(route);
              setSelectedView('detail');
            }}
            onTreeView={() => setSelectedView('tree')}
          />
        );
      case 'tree':
        return (
          <RouteTree 
            onRouteSelect={(route) => {
              setSelectedRoute(route);
              setSelectedView('detail');
            }}
            onOverviewView={() => setSelectedView('overview')}
          />
        );
      case 'detail':
        return (
          <RouteDetail 
            route={selectedRoute}
            onBack={() => setSelectedView('overview')}
          />
        );
      default:
        return (
          <RouteExplorer 
            onRouteSelect={(route) => {
              setSelectedRoute(route);
              setSelectedView('detail');
            }}
          />
        );
    }
  }, [selectedView, selectedRoute]);

  return (
    <div className="p-4">
      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => setSelectedView('overview')}
          className={`px-3 py-1 rounded text-sm ${
            selectedView === 'overview' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedView('tree')}
          className={`px-3 py-1 rounded text-sm ${
            selectedView === 'tree' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tree View
        </button>
      </div>
      {renderContent}
    </div>
  );
}

/**
 * Create and export the Route Explorer plugin
 */
export const routeExplorerPlugin: TanStackDevtoolsReactPlugin = createTanStackPlugin(
  {
    id: 'route-explorer',
    name: 'Route Explorer',
    description: 'Explore and analyze your Next.js routes',
    category: 'Navigation',
    priority: 100,
  },
  () => <RouteExplorerComponent />
);