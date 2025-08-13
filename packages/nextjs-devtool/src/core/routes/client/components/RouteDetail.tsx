/**
 * Route Detail Component
 * 
 * Detailed view of a specific route with metadata, performance, and analysis.
 */

import React from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';
import { useRouteDetail, useRoutePerformance } from '../hooks';

interface RouteDetailProps {
  context: PluginComponentContext;
  routeId?: string;
}

export const RouteDetail: React.FC<RouteDetailProps> = ({ context, routeId = 'home' }) => {
  const { route, loading: routeLoading, error: routeError } = useRouteDetail(routeId);
  const { performance, loading: perfLoading } = useRoutePerformance(routeId);

  if (routeLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (routeError || !route) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-red-600">
          <div className="text-4xl mb-2">❌</div>
          <p className="font-medium">Route not found</p>
          <p className="text-sm text-gray-600 mt-1">{routeError || `Route "${routeId}" could not be loaded`}</p>
          <button
            onClick={() => context.onNavigate('explorer')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Explorer
          </button>
        </div>
      </div>
    );
  }

  const singlePerf = Array.isArray(performance) ? performance[0] : performance;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{route.name}</h1>
          <p className="text-gray-600 font-mono">{route.path}</p>
        </div>
        <button
          onClick={() => context.onNavigate('explorer')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          ← Back
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Route Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                  route.type === 'page' ? 'bg-blue-100 text-blue-800' :
                  route.type === 'route' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {route.type}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Method</label>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{route.method}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Dynamic</label>
                <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                  route.dynamic ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {route.dynamic ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">File</label>
                <code className="block text-sm bg-gray-100 p-2 rounded">{route.file}</code>
              </div>
              
              {route.params && route.params.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parameters</label>
                  <div className="space-y-1">
                    {route.params.map(param => (
                      <span key={param} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-1">
                        {param}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {route.metadata && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Metadata</h2>
          
          <div className="space-y-3">
            {route.metadata.title && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="text-gray-900">{route.metadata.title}</p>
              </div>
            )}
            
            {route.metadata.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900">{route.metadata.description}</p>
              </div>
            )}
            
            {route.metadata.keywords && route.metadata.keywords.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Keywords</label>
                <div className="space-y-1">
                  {route.metadata.keywords.map(keyword => (
                    <span key={keyword} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-1">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {singlePerf && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          
          {perfLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{singlePerf.averageLoadTime.toFixed(0)}ms</div>
                <div className="text-sm text-blue-600">Avg Load Time</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{singlePerf.totalRequests.toLocaleString()}</div>
                <div className="text-sm text-green-600">Total Requests</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-900">{singlePerf.errorCount}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {new Date(singlePerf.lastAccessed).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">Last Accessed</div>
              </div>
            </div>
          )}
          
          {singlePerf.bundleSize && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Bundle Size:</span>
                <span className="font-mono">{(singlePerf.bundleSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          )}
          
          {singlePerf.dependencies && singlePerf.dependencies.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Dependencies</h3>
              <div className="space-y-1">
                {singlePerf.dependencies.map(dep => (
                  <span key={dep} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm mr-1">
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => context.onNavigate('performance')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            View Performance
          </button>
          
          <button
            onClick={() => context.onNavigate('analysis')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Analyze Route
          </button>
          
          <button
            onClick={() => window.open(route.path, '_blank')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Open Route
          </button>
        </div>
      </div>
    </div>
  );
};
