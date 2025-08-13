/**
 * Bundle Plugin Route Configuration
 * 
 * Defines the hierarchical structure for the Bundle plugin in the expanded DevTool sidebar.
 * This follows the specification pattern for client route definitions.
 */

import type { PluginGroup, PluginPage } from '@repo/nextjs-devtool/types';

/**
 * Bundle plugin route configuration
 * 
 * Structure:
 * - Overview: Main bundle information and quick stats
 * - Assets: Detailed asset analysis and breakdown
 * - Dependencies: Package dependency tree and versions
 * - Analysis: Advanced bundle analysis and optimization suggestions
 */
export const bundleRoutes: PluginGroup[] = [
  {
    id: 'bundle-main',
    label: 'Bundle Analysis',
    pages: [
      {
        id: 'overview',
        label: 'Overview',
        description: 'Bundle overview and build information',
        icon: '📊',
        component: () => import('./components/BundleOverview').then(m => m.BundleOverview),
      },
      {
        id: 'assets',
        label: 'Assets',
        description: 'Detailed asset breakdown and analysis',
        icon: '📦',
        component: () => import('./components/AssetList').then(m => m.AssetList),
        children: [
          {
            id: 'asset-detail',
            label: 'Asset Details',
            description: 'Detailed information about a specific asset',
            icon: '🔍',
            component: () => import('./components/AssetDetail').then(m => m.AssetDetail),
          },
        ],
      },
      {
        id: 'dependencies',
        label: 'Dependencies',
        description: 'Package dependencies and versions',
        icon: '🔗',
        component: () => import('./components/DependencyTree').then(m => m.DependencyTree),
      },
      {
        id: 'analysis',
        label: 'Analysis',
        description: 'Advanced bundle analysis and optimization',
        icon: '⚡',
        component: () => import('./components/BundleAnalysis').then(m => m.BundleAnalysis),
      },
    ],
  },
];

/**
 * Bundle plugin metadata for registry
 */
export const bundlePluginMetadata = {
  id: 'core.bundle',
  name: 'Bundle Inspector',
  version: '1.0.0',
  description: 'Analyze webpack bundles, assets, and dependencies',
  author: 'DevTool Core',
  icon: '📦',
  category: 'analysis',
} as const;
