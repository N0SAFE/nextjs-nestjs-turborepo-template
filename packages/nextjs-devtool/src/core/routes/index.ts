/**
 * Routes Core Plugin Definition
 * 
 * Plugin definition for the route discovery and analysis system
 * with declarative routing integration.
 */

import type { CorePlugin } from '@repo/nextjs-devtool/types';
import { routesContract } from './shared/contract';

/**
 * Routes Core Plugin
 * 
 * Provides comprehensive route discovery, analysis, and management
 * with deep integration into the Next.js declarative routing system.
 */
export const routesPlugin: CorePlugin = {
  kind: 'core',
  name: 'routes',
  version: '1.0.0',
  
  // ORPC Contract for type-safe API communication
  contract: routesContract,
  
  // Selective loading exports following specification
  exports: {
    // Server-side route discovery and analysis
    server: async () => {
      const { routesCoreRouter } = await import('./server');
      return routesCoreRouter;
    },
    
    // Client-side components (loaded on demand)
    components: {
      // Main route explorer component
      RouteExplorer: async (...args: Parameters<Awaited<typeof import('./client/components/RouteExplorer')>['RouteExplorer']>) => {
        const { RouteExplorer } = await import('./client/components/RouteExplorer');
        return RouteExplorer(...args);
      },
      
      // Additional route management components
      RoutesOverview: async (...args: Parameters<Awaited<typeof import('./client/components/RoutesOverview')>['RoutesOverview']>) => {
        const { RoutesOverview } = await import('./client/components/RoutesOverview');
        return RoutesOverview(...args);
      },
      
      RouteTree: async (...args: Parameters<Awaited<typeof import('./client/components/RouteTree')>['RouteTree']>) => {
        const { RouteTree } = await import('./client/components/RouteTree');
        return RouteTree(...args);
      },
      
      RouteDetail: async (...args: Parameters<Awaited<typeof import('./client/components/RouteDetail')>['RouteDetail']>) => {
        const { RouteDetail } = await import('./client/components/RouteDetail');
        return RouteDetail(...args);
      },
      
      RoutePerformance: async (...args: Parameters<Awaited<typeof import('./client/components/RoutePerformance')>['RoutePerformance']>) => {
        const { RoutePerformance } = await import('./client/components/RoutePerformance');
        return RoutePerformance(...args);
      },
      
      RouteAnalysis: async (...args: Parameters<Awaited<typeof import('./client/components/RouteAnalysis')>['RouteAnalysis']>) => {
        const { RouteAnalysis } = await import('./client/components/RouteAnalysis');
        return RouteAnalysis(...args);
      },
      
      RouteValidation: async (...args: Parameters<Awaited<typeof import('./client/components/RouteValidation')>['RouteValidation']>) => {
        const { RouteValidation } = await import('./client/components/RouteValidation');
        return RouteValidation(...args);
      },
      
      RouteGenerator: async (...args: Parameters<Awaited<typeof import('./client/components/RouteGenerator')>['RouteGenerator']>) => {
        const { RouteGenerator } = await import('./client/components/RouteGenerator');
        return RouteGenerator(...args);
      },
      
      // RouteMigration: async () => {
      //   const { RouteMigration } = await import('./client/components/RouteMigration');
      //   return RouteMigration;
      // },
      
      // RouteSettings: async () => {
      //   const { RouteSettings } = await import('./client/components/RouteSettings');
      //   return RouteSettings;
      // },
      
      // PerformanceAnalytics: async () => {
      //   const { PerformanceAnalytics } = await import('./client/components/PerformanceAnalytics');
      //   return PerformanceAnalytics;
      // },
      
      // PerformanceMonitoring: async () => {
      //   const { PerformanceMonitoring } = await import('./client/components/PerformanceMonitoring');
      //   return PerformanceMonitoring;
      // },
    },
    
    // React hooks for route data access
    hooks: {
      // Core route data hooks
      useRoutes: async (...args: Parameters<Awaited<typeof import('./client/hooks')>['useRoutes']>) => {
        const { useRoutes } = await import('./client/hooks');
        return useRoutes(...args);
      },
      
      useRouteDetail: async (...args: Parameters<Awaited<typeof import('./client/hooks')>['useRouteDetail']>) => {
        const { useRouteDetail } = await import('./client/hooks');
        return useRouteDetail(...args);
      },

      useRouteTree: async (...args: Parameters<Awaited<typeof import('./client/hooks')>['useRouteTree']>) => {
        const { useRouteTree } = await import('./client/hooks');
        return useRouteTree(...args);
      },
      
      useRoutePerformance: async (...args: Parameters<Awaited<typeof import('./client/hooks')>['useRoutePerformance']>) => {
        const { useRoutePerformance } = await import('./client/hooks');
        return useRoutePerformance(...args);
      },
      
      useRouteAnalysis: async (...args: Parameters<Awaited<typeof import('./client/hooks')>['useRouteAnalysis']>) => {
        const { useRouteAnalysis } = await import('./client/hooks');
        return useRouteAnalysis(...args);
      },
      
      useRouteValidation: async (...args: Parameters<Awaited<typeof import('./client/hooks')>['useRouteValidation']>) => {
        const { useRouteValidation } = await import('./client/hooks');
        return useRouteValidation(...args);
      },

      useRouteRefresh: async (...args: Parameters<Awaited<typeof import('./client/hooks')>['useRouteRefresh']>) => {
        const { useRouteRefresh } = await import('./client/hooks');
        return useRouteRefresh(...args);
      },
    },
  },
  
  // Plugin metadata
  meta: {
    category: 'navigation',
    description: 'Comprehensive route discovery, analysis, and management with declarative routing integration',
    icon: '🗺️',
    priority: 2, // High priority core plugin
    
    // Feature capabilities
    features: [
      'Declarative routing integration',
      'Real-time route discovery and scanning', 
      'Route performance monitoring and analytics',
      'Structure validation and error detection',
      'Optimization recommendations',
      'Route migration and generation tools',
      'Hierarchical route tree visualization',
      'SEO and metadata analysis',
    ],
    
    // Dependencies on other core systems
    dependencies: [],
    
    // Configuration options
    settings: {
      autoRefresh: {
        type: 'boolean',
        default: true,
        description: 'Automatically refresh routes when files change',
      },
      refreshInterval: {
        type: 'number',
        default: 60000, // 1 minute
        description: 'Auto-refresh interval in milliseconds',
      },
      includeMetadata: {
        type: 'boolean', 
        default: true,
        description: 'Include route metadata in discovery',
      },
      performanceTracking: {
        type: 'boolean',
        default: true,
        description: 'Enable route performance tracking',
      },
      validationLevel: {
        type: 'enum',
        options: ['basic', 'standard', 'strict'],
        default: 'standard',
        description: 'Route validation strictness level',
      },
    },
    
    // Plugin routes configuration from route.ts
    routes: async () => {
      const { routesRoutes } = await import('./client/route');
      return routesRoutes;
    },
  },
  
  // Plugin lifecycle hooks
  async onActivate() {
    // Initialize route discovery when plugin activates
    if (typeof window === 'undefined') {
      // Server-side initialization
      const { routesCoreRouter } = await import('./server');
      // Trigger initial route scan
      await routesCoreRouter.procedures.refresh({}, { force: false });
    }
  },
  
  async onDeactivate() {
    // Cleanup when plugin deactivates
    // Clear any running intervals or watchers
  },
  
  // Health check for plugin status
  async healthCheck() {
    try {
      if (typeof window === 'undefined') {
        const { routesCoreRouter } = await import('./server');
        const result = await routesCoreRouter.procedures.list({}, { type: 'all' });
        return {
          healthy: true,
          message: `Route discovery operational - ${Array.isArray(result) ? result.length : 0} routes found`,
        };
      }
      return {
        healthy: true,
        message: 'Client-side route plugin operational',
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Route plugin error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

export default routesPlugin;
