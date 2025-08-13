/**
 * Routes Overview Component
 * 
 * Displays the main route dashboard with key metrics, quick actions,
 * and integration with the declarative routing system.
 */

import React, { useState } from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';
import { useRoutes, useRouteAnalysis, useRouteValidation, useRouteRefresh } from '../hooks';

interface RoutesOverviewProps {
  context: PluginComponentContext;
}

export const RoutesOverview: React.FC<RoutesOverviewProps> = ({ context }) => {
  const { routes, loading: routesLoading, refetch: refetchRoutes } = useRoutes('all', true);
  const { analysis, loading: analysisLoading, refetch: refetchAnalysis } = useRouteAnalysis();
  const { validation, loading: validationLoading, refetch: refetchValidation } = useRouteValidation();
  const { refresh, loading: refreshLoading, lastRefresh } = useRouteRefresh();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await refresh(true);
      // Refetch all data after refresh
      await Promise.all([
        refetchRoutes(),
        refetchAnalysis(),
        refetchValidation(),
      ]);
    } catch (error) {
      console.error('Failed to refresh routes:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loading = routesLoading || analysisLoading || validationLoading;

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats from loaded data
  const totalRoutes = analysis?.totalRoutes || routes.length;
  const pageRoutes = analysis?.routesByType?.page || routes.filter(r => r.type === 'page').length;
  const apiRoutes = analysis?.routesByType?.route || routes.filter(r => r.type === 'route').length;
  const dynamicRoutes = analysis?.dynamicRoutes || routes.filter(r => r.dynamic).length;
  const lastScanTime = lastRefresh ? new Date(lastRefresh.lastScan).toLocaleTimeString() : new Date().toLocaleTimeString();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Route Overview</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last scan: {lastScanTime}
          </div>
          <button
            onClick={handleRefreshAll}
            disabled={refreshing || refreshLoading}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {refreshing || refreshLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Validation Status Banner */}
      {validation && !validation.valid && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <div className="font-medium text-red-900">Route Issues Detected</div>
              <div className="text-sm text-red-600">
                {validation.errors.length} errors, {validation.warnings.length} warnings found
              </div>
            </div>
            <button
              onClick={() => context.onNavigate('validation')}
              className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">🗺️</div>
            <div>
              <div className="text-2xl font-bold text-blue-900">{totalRoutes}</div>
              <div className="text-sm text-blue-600">Total Routes</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📄</div>
            <div>
              <div className="text-2xl font-bold text-green-900">{pageRoutes}</div>
              <div className="text-sm text-green-600">Page Routes</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">⚡</div>
            <div>
              <div className="text-2xl font-bold text-purple-900">{apiRoutes}</div>
              <div className="text-sm text-purple-600">API Routes</div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🔄</div>
            <div>
              <div className="text-2xl font-bold text-orange-900">{dynamicRoutes}</div>
              <div className="text-sm text-orange-600">Dynamic Routes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => context.onNavigate('explorer')}
            className="flex items-center p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <div className="text-blue-600 text-xl mr-3">🗺️</div>
            <div>
              <div className="font-medium text-blue-900">Explore Routes</div>
              <div className="text-sm text-blue-600">Browse route tree and details</div>
            </div>
          </button>

          <button
            onClick={() => context.onNavigate('performance')}
            className="flex items-center p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <div className="text-green-600 text-xl mr-3">📊</div>
            <div>
              <div className="font-medium text-green-900">Performance</div>
              <div className="text-sm text-green-600">View route performance metrics</div>
            </div>
          </button>

          <button
            onClick={() => context.onNavigate('analysis')}
            className="flex items-center p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <div className="text-purple-600 text-xl mr-3">🔬</div>
            <div>
              <div className="font-medium text-purple-900">Analysis</div>
              <div className="text-sm text-purple-600">Route optimization suggestions</div>
            </div>
          </button>

          <button
            onClick={() => context.onNavigate('validation')}
            className="flex items-center p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <div className="text-red-600 text-xl mr-3">✅</div>
            <div>
              <div className="font-medium text-red-900">Validation</div>
              <div className="text-sm text-red-600">Check route structure</div>
            </div>
          </button>

          <button
            onClick={() => context.onNavigate('generator')}
            className="flex items-center p-3 text-left bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
          >
            <div className="text-yellow-600 text-xl mr-3">⚙️</div>
            <div>
              <div className="font-medium text-yellow-900">Generator</div>
              <div className="text-sm text-yellow-600">Create new routes</div>
            </div>
          </button>

          <button
            onClick={() => context.onNavigate('settings')}
            className="flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="text-gray-600 text-xl mr-3">⚙️</div>
            <div>
              <div className="font-medium text-gray-900">Settings</div>
              <div className="text-sm text-gray-600">Configure route discovery</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity Summary */}
      {analysis && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Route Analysis Summary</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Static Routes: {analysis.staticRoutes} • Dynamic Routes: {analysis.dynamicRoutes}</div>
            {analysis.unusedRoutes.length > 0 && (
              <div>Unused Routes: {analysis.unusedRoutes.length}</div>
            )}
            {analysis.recommendations.length > 0 && (
              <div>Optimization Opportunities: {analysis.recommendations.length}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
