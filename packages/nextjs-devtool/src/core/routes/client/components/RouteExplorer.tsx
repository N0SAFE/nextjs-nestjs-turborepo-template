/**
 * Route Explorer Component
 * 
 * Interactive route tree and navigation with declarative routing integration.
 */

import React, { useState, useEffect } from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';

interface RouteExplorerProps {
  context: PluginComponentContext;
}

interface RouteInfo {
  id: string;
  path: string;
  name: string;
  method: string;
  file: string;
  type: string;
  dynamic: boolean;
  params?: string[];
}

export const RouteExplorer: React.FC<RouteExplorerProps> = ({ context }) => {
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const loadRoutes = async () => {
      setLoading(true);
      
      // Mock route data from declarative routing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockRoutes: RouteInfo[] = [
        {
          id: 'home',
          path: '/',
          name: 'Home',
          method: 'GET',
          file: 'app/page.tsx',
          type: 'page',
          dynamic: false,
        },
        {
          id: 'appshowcase',
          path: '/(app)/showcase',
          name: 'Appshowcase',
          method: 'GET',
          file: 'app/(app)/showcase/page.tsx',
          type: 'page',
          dynamic: false,
        },
        {
          id: 'authlogin',
          path: '/auth/login',
          name: 'Authlogin',
          method: 'GET',
          file: 'app/auth/login/page.tsx',
          type: 'page',
          dynamic: false,
        },
        {
          id: 'apiauthnextauth',
          path: '/api/auth/[...nextauth]',
          name: 'Apiauthnextauth',
          method: 'GET',
          file: 'app/api/auth/[...nextauth]/route.ts',
          type: 'route',
          dynamic: true,
          params: ['nextauth'],
        },
      ];
      
      setRoutes(mockRoutes);
      setLoading(false);
    };

    loadRoutes();
  }, []);

  const filteredRoutes = routes.filter(route => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pages' && route.type === 'page') ||
      (filter === 'api' && route.type === 'route' && route.path.startsWith('/api')) ||
      (filter === 'dynamic' && route.dynamic);
    
    const matchesSearch = searchTerm === '' || 
      route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getRouteTypeColor = (type: string, dynamic: boolean) => {
    if (dynamic) {
      return 'bg-orange-100 text-orange-800';
    }
    if (type === 'page') {
      return 'bg-blue-100 text-blue-800';
    }
    if (type === 'route') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getRouteIcon = (type: string, dynamic: boolean) => {
    if (dynamic) {
      return '🔄';
    }
    if (type === 'page') {
      return '📄';
    }
    if (type === 'route') {
      return '⚡';
    }
    return '📁';
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Route Explorer</h2>
        <button
          onClick={() => context.onNavigate('route-tree')}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
        >
          Tree View
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'pages', 'api', 'dynamic'].map(filterOption => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
        
        <input
          type="text"
          placeholder="Search routes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Route List */}
      <div className="space-y-3">
        {filteredRoutes.map(route => (
          <div
            key={route.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => context.onNavigate('route-detail')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{getRouteIcon(route.type, route.dynamic)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{route.name}</h3>
                    <p className="text-sm text-gray-600 font-mono">{route.path}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{route.method}</span>
                  <span>•</span>
                  <span>{route.file}</span>
                  {route.params && (
                    <>
                      <span>•</span>
                      <span>Params: {route.params.join(', ')}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRouteTypeColor(route.type, route.dynamic)}`}>
                  {route.dynamic ? 'Dynamic' : route.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p>No routes found matching your criteria</p>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          Showing {filteredRoutes.length} of {routes.length} routes
          {searchTerm && ` • Search: "${searchTerm}"`}
          {filter !== 'all' && ` • Filter: ${filter}`}
        </div>
      </div>
    </div>
  );
};
