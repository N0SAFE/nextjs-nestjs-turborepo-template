/**
 * Route Performance Component
 * 
 * Performance monitoring and metrics visualization for routes.
 */

import React, { useState } from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';
import { useRoutePerformance } from '../hooks';

interface RoutePerformanceProps {
  context: PluginComponentContext;
  routeId?: string;
}

export const RoutePerformance: React.FC<RoutePerformanceProps> = ({ context, routeId = 'all' }) => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const { performance, loading, error } = useRoutePerformance(routeId, timeRange);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !performance) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-red-600">
          <div className="text-4xl mb-2">📊</div>
          <p className="font-medium">Performance data unavailable</p>
          <p className="text-sm text-gray-600 mt-1">{error || 'No performance data found'}</p>
        </div>
      </div>
    );
  }

  const performanceArray = Array.isArray(performance) ? performance : [performance];
  const avgMetrics = calculateAverageMetrics(performanceArray);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Route Performance</h1>
          <p className="text-gray-600">
            {routeId === 'all' ? 'All routes' : `Route: ${routeId}`} • {timeRange} view
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={() => context.onNavigate('explorer')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Load Time"
          value={`${avgMetrics.loadTime.toFixed(0)}ms`}
          change={avgMetrics.loadTimeChange}
          icon="⚡"
          color="blue"
        />
        
        <MetricCard
          title="Total Requests"
          value={avgMetrics.requests.toLocaleString()}
          change={avgMetrics.requestsChange}
          icon="📊"
          color="green"
        />
        
        <MetricCard
          title="Error Rate"
          value={`${avgMetrics.errorRate.toFixed(1)}%`}
          change={avgMetrics.errorRateChange}
          icon="⚠️"
          color="red"
        />
        
        <MetricCard
          title="Avg Bundle Size"
          value={`${(avgMetrics.bundleSize / 1024).toFixed(1)}KB`}
          change={avgMetrics.bundleSizeChange}
          icon="📦"
          color="purple"
        />
      </div>

      {/* Performance Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Load Time Trends</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📈</div>
            <p>Interactive performance chart would render here</p>
            <p className="text-sm">Showing load time trends for {timeRange}</p>
          </div>
        </div>
      </div>

      {/* Route Performance Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Route Details</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Load Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bundle Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceArray.map((perf) => (
                <tr key={perf.routeId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{perf.routeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getLoadTimeColor(perf.averageLoadTime)}`}>
                      {perf.averageLoadTime.toFixed(0)}ms
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {perf.totalRequests.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${perf.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {perf.errorCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {perf.bundleSize ? `${(perf.bundleSize / 1024).toFixed(1)}KB` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => context.onNavigate('detail')}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Issues */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Insights</h2>
        
        <div className="space-y-4">
          {generatePerformanceInsights(performanceArray).map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                insight.type === 'error' ? 'bg-red-50 border-red-400' :
                'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-start">
                <div className="text-2xl mr-3">
                  {insight.type === 'warning' ? '⚠️' :
                   insight.type === 'error' ? '❌' : 'ℹ️'}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{insight.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                  {insight.suggestion && (
                    <p className="text-sm text-gray-800 mt-2 font-medium">
                      💡 {insight.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'purple';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-xs mt-1 ${change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
            </p>
          )}
        </div>
        <div className="text-3xl opacity-75">{icon}</div>
      </div>
    </div>
  );
};

function calculateAverageMetrics(performance: Array<{
  averageLoadTime: number;
  totalRequests: number;
  errorCount: number;
  bundleSize?: number;
}>) {
  const count = performance.length;
  const totals = performance.reduce((acc, perf) => ({
    loadTime: acc.loadTime + perf.averageLoadTime,
    requests: acc.requests + perf.totalRequests,
    errors: acc.errors + perf.errorCount,
    bundleSize: acc.bundleSize + (perf.bundleSize || 0),
  }), { loadTime: 0, requests: 0, errors: 0, bundleSize: 0 });

  const totalRequests = totals.requests;
  
  return {
    loadTime: totals.loadTime / count,
    loadTimeChange: Math.random() * 20 - 10, // Mock change
    requests: totals.requests,
    requestsChange: Math.random() * 30 - 15, // Mock change
    errorRate: totalRequests > 0 ? (totals.errors / totalRequests) * 100 : 0,
    errorRateChange: Math.random() * 10 - 5, // Mock change
    bundleSize: totals.bundleSize / count,
    bundleSizeChange: Math.random() * 15 - 7, // Mock change
  };
}

function getLoadTimeColor(loadTime: number): string {
  if (loadTime < 200) return 'text-green-600';
  if (loadTime < 500) return 'text-yellow-600';
  return 'text-red-600';
}

function generatePerformanceInsights(performance: Array<{
  routeId: string;
  averageLoadTime: number;
  totalRequests: number;
  errorCount: number;
  bundleSize?: number;
}>): Array<{
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  suggestion?: string;
}> {
  const insights: Array<{
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    suggestion?: string;
  }> = [];

  // Check for slow routes
  const slowRoutes = performance.filter(p => p.averageLoadTime > 1000);
  if (slowRoutes.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Slow Loading Routes Detected',
      message: `${slowRoutes.length} routes have load times over 1 second.`,
      suggestion: 'Consider optimizing these routes with code splitting or server-side rendering.',
    });
  }

  // Check for high error rates
  const errorRoutes = performance.filter(p => p.errorCount > 0);
  if (errorRoutes.length > 0) {
    insights.push({
      type: 'error',
      title: 'Routes with Errors',
      message: `${errorRoutes.length} routes have reported errors.`,
      suggestion: 'Review error logs and implement proper error handling.',
    });
  }

  // Check for large bundles
  const largeBundles = performance.filter(p => (p.bundleSize || 0) > 500000); // 500KB
  if (largeBundles.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Large Bundle Sizes',
      message: `${largeBundles.length} routes have bundles larger than 500KB.`,
      suggestion: 'Consider dynamic imports and tree shaking to reduce bundle sizes.',
    });
  }

  // General performance tip
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Performance Looking Good',
      message: 'No critical performance issues detected.',
      suggestion: 'Continue monitoring and consider implementing performance budgets.',
    });
  }

  return insights;
}
