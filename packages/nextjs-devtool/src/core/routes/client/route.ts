/**
 * Routes Plugin Route Configuration
 * 
 * Defines the hierarchical structure for the Routes plugin in the expanded DevTool sidebar.
 * This integrates with the declarative routing system for comprehensive route management.
 */

import type { PluginGroup } from '@repo/nextjs-devtool/types';

/**
 * Routes plugin route configuration
 * 
 * Structure:
 * - Overview: Main route dashboard with key metrics
 * - Explorer: Interactive route tree and navigation
 * - Performance: Route performance analytics and monitoring
 * - Analysis: Route optimization suggestions and recommendations
 * - Validation: Route structure validation and error detection
 * - Settings: Route discovery and scanning configuration
 */
export const routesRoutes: PluginGroup[] = [
  {
    id: 'routes-main',
    label: 'Route Management',
    pages: [
      {
        id: 'overview',
        label: 'Overview',
        description: 'Route dashboard with key metrics and quick actions',
        icon: '🏠',
        component: () => import('./components/RoutesOverview').then(m => m.RoutesOverview),
      },
      {
        id: 'explorer',
        label: 'Route Explorer',
        description: 'Interactive route tree and detailed navigation',
        icon: '🗺️',
        component: () => import('./components/RouteExplorer').then(m => m.RouteExplorer),
        children: [
          {
            id: 'route-detail',
            label: 'Route Details',
            description: 'Detailed information about a specific route',
            icon: '🔍',
            component: () => import('./components/RouteDetail').then(m => m.RouteDetail),
          },
          {
            id: 'route-tree',
            label: 'Route Tree',
            description: 'Hierarchical view of all application routes',
            icon: '🌳',
            component: () => import('./components/RouteTree').then(m => m.RouteTree),
          },
        ],
      },
      {
        id: 'performance',
        label: 'Performance',
        description: 'Route performance metrics and monitoring',
        icon: '⚡',
        badge: 'NEW',
        component: () => import('./components/RoutePerformance').then(m => m.RoutePerformance),
        children: [
          // {
          //   id: 'performance-analytics',
          //   label: 'Analytics',
          //   description: 'Detailed performance analytics and trends',
          //   icon: '📊',
          //   component: () => import('./components/PerformanceAnalytics').then(m => m.PerformanceAnalytics),
          // },
          // {
          //   id: 'performance-monitoring',
          //   label: 'Monitoring',
          //   description: 'Real-time performance monitoring',
          //   icon: '📈',
          //   component: () => import('./components/PerformanceMonitoring').then(m => m.PerformanceMonitoring),
          // },
        ],
      },
      {
        id: 'analysis',
        label: 'Analysis',
        description: 'Route analysis and optimization suggestions',
        icon: '🔬',
        component: () => import('./components/RouteAnalysis').then(m => m.RouteAnalysis),
      },
      {
        id: 'validation',
        label: 'Validation',
        description: 'Route structure validation and error detection',
        icon: '✅',
        component: () => import('./components/RouteValidation').then(m => m.RouteValidation),
      },
    ],
  },
  {
    id: 'routes-tools',
    label: 'Route Tools',
    pages: [
      {
        id: 'generator',
        label: 'Route Generator',
        description: 'Generate new routes and components',
        icon: '⚙️',
        component: () => import('./components/RouteGenerator').then(m => m.RouteGenerator),
      },
      // {
      //   id: 'migration',
      //   label: 'Migration Tools',
      //   description: 'Tools for migrating and refactoring routes',
      //   icon: '🔄',
      //   component: () => import('./components/RouteMigration').then(m => m.RouteMigration),
      // },
      // {
      //   id: 'settings',
      //   label: 'Settings',
      //   description: 'Route discovery and scanning configuration',
      //   icon: '⚙️',
      //   component: () => import('./components/RouteSettings').then(m => m.RouteSettings),
      // },
    ],
  },
];

/**
 * Routes plugin metadata for registry
 */
export const routesPluginMetadata = {
  id: 'core.routes',
  name: 'Route Explorer',
  version: '1.0.0',
  description: 'Comprehensive route discovery, analysis, and management with declarative routing integration',
  author: 'DevTool Core',
  icon: '🗺️',
  category: 'navigation',
  features: [
    'Declarative routing integration',
    'Real-time route discovery',
    'Performance monitoring',
    'Route optimization analysis',
    'Structure validation',
    'Migration tools',
  ],
} as const;
