/**
 * Routes Plugin Components Exports
 * 
 * Central export point for all routes plugin UI components
 */

import React from 'react';

export { RoutesOverview } from './RoutesOverview';
export { RouteExplorer } from './RouteExplorer';
export { RouteTree } from './RouteTree';
export { RouteDetail } from './RouteDetail';
export { RoutePerformance } from './RoutePerformance';
export { RouteAnalysis } from './RouteAnalysis';
export { RouteValidation } from './RouteValidation';
export { RouteGenerator } from './RouteGenerator';

// Additional placeholder components - can be implemented later
export const RouteMigration = () => (
  <div className="p-4 text-center">
    <h2 className="text-xl font-semibold mb-2">Route Migration</h2>
    <p className="text-gray-600">Migration tools coming soon...</p>
  </div>
);

export const RouteSettings = () => (
  <div className="p-4 text-center">
    <h2 className="text-xl font-semibold mb-2">Route Settings</h2>
    <p className="text-gray-600">Configuration options coming soon...</p>
  </div>
);

export const PerformanceAnalytics = () => (
  <div className="p-4 text-center">
    <h2 className="text-xl font-semibold mb-2">Performance Analytics</h2>
    <p className="text-gray-600">Advanced analytics coming soon...</p>
  </div>
);

export const PerformanceMonitoring = () => (
  <div className="p-4 text-center">
    <h2 className="text-xl font-semibold mb-2">Performance Monitoring</h2>
    <p className="text-gray-600">Real-time monitoring coming soon...</p>
  </div>
);
