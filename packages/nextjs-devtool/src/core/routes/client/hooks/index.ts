/**
 * Routes Plugin Client Hooks
 * 
 * React hooks for accessing route data and functionality through ORPC
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  RouteInfo, 
  RoutePerformance, 
  RouteTreeNode, 
  RouteAnalysis, 
  RouteValidation,
  RoutesContract
} from '../../shared/contract';

/**
 * Mock ORPC client interface for type safety
 * In the real implementation, this would come from the useDevTool hook
 */
interface MockORPCClient {
  routes: {
    list: (input: { type?: 'all' | 'pages' | 'api' | 'middleware'; includeMetadata?: boolean }) => Promise<RouteInfo[]>;
    getDetail: (input: { routeId: string }) => Promise<RouteInfo>;
    getTree: (input: { includeMetadata?: boolean }) => Promise<RouteTreeNode[]>;
    getPerformance: (input: { routeId?: string; timeRange?: string }) => Promise<RoutePerformance | RoutePerformance[]>;
    analyze: () => Promise<RouteAnalysis>;
    validate: () => Promise<RouteValidation>;
    refresh: (input: { force?: boolean }) => Promise<{ success: boolean; routesFound: number; lastScan: number }>;
  };
}

/**
 * Create mock ORPC client for development
 * TODO: Replace with actual useDevTool<RoutesContract>() when available
 */
const createMockClient = (): MockORPCClient => ({
  routes: {
    async list(input) {
      // Mock implementation - in real app this would be ORPC call
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
          metadata: input.includeMetadata ? {
            title: 'Home Page',
            description: 'Welcome to our application',
          } : undefined,
        },
        {
          id: 'appshowcase',
          path: '/(app)/showcase',
          name: 'Appshowcase',
          method: 'GET',
          file: 'app/(app)/showcase/page.tsx',
          type: 'page',
          dynamic: false,
          metadata: input.includeMetadata ? {
            title: 'App Showcase',
            description: 'Showcase of application features',
          } : undefined,
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

      if (input.type && input.type !== 'all') {
        return mockRoutes.filter(route => {
          switch (input.type) {
            case 'pages':
              return route.type === 'page';
            case 'api':
              return route.type === 'route' && route.path.startsWith('/api');
            case 'middleware':
              return route.path.includes('middleware');
            default:
              return true;
          }
        });
      }

      return mockRoutes;
    },

    async getDetail(input) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const mockRoute: RouteInfo = {
        id: input.routeId,
        path: `/${input.routeId}`,
        name: input.routeId.charAt(0).toUpperCase() + input.routeId.slice(1),
        method: 'GET',
        file: `app/${input.routeId}/page.tsx`,
        type: 'page',
        dynamic: false,
        metadata: {
          title: `${input.routeId} Page`,
          description: `Details for ${input.routeId}`,
        },
      };
      
      return mockRoute;
    },

    async getTree(input) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const mockTree: RouteTreeNode[] = [
        {
          id: 'root',
          path: '/',
          name: 'Root',
          type: 'page',
          file: 'app/page.tsx',
          metadata: input.includeMetadata ? { title: 'Home' } : undefined,
          children: [
            {
              id: 'auth',
              path: '/auth',
              name: 'Auth',
              type: 'segment',
              file: '',
              children: [
                {
                  id: 'login',
                  path: '/auth/login',
                  name: 'Login',
                  type: 'page',
                  file: 'app/auth/login/page.tsx',
                  metadata: input.includeMetadata ? { title: 'Login' } : undefined,
                },
              ],
            },
          ],
        },
      ];
      
      return mockTree;
    },

    async getPerformance(input) {
      await new Promise(resolve => setTimeout(resolve, 350));
      
      if (input.routeId) {
        return {
          routeId: input.routeId,
          averageLoadTime: Math.random() * 1000 + 100,
          totalRequests: Math.floor(Math.random() * 10000),
          errorCount: Math.floor(Math.random() * 10),
          lastAccessed: Date.now() - Math.random() * 86400000,
          bundleSize: 156000,
          dependencies: ['react', 'next', '@repo/ui'],
        };
      }

      return [
        {
          routeId: 'home',
          averageLoadTime: 245,
          totalRequests: 5420,
          errorCount: 2,
          lastAccessed: Date.now() - 3600000,
          bundleSize: 156000,
          dependencies: ['react', 'next'],
        },
        {
          routeId: 'login',
          averageLoadTime: 189,
          totalRequests: 1250,
          errorCount: 0,
          lastAccessed: Date.now() - 7200000,
          bundleSize: 89000,
          dependencies: ['react', 'next', '@repo/ui'],
        },
      ];
    },

    async analyze() {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return {
        totalRoutes: 12,
        routesByType: {
          page: 8,
          route: 3,
          layout: 1,
        },
        dynamicRoutes: 3,
        staticRoutes: 9,
        unusedRoutes: ['old-page', 'temp-route'],
        heaviestRoutes: [
          { routeId: 'home', size: 156000, loadTime: 245 },
          { routeId: 'dashboard', size: 234000, loadTime: 389 },
        ],
        recommendations: [
          {
            type: 'performance' as const,
            severity: 'medium' as const,
            routeId: 'dashboard',
            message: 'Route has high bundle size',
            suggestion: 'Consider code splitting for dashboard components',
          },
          {
            type: 'seo' as const,
            severity: 'low' as const,
            routeId: 'home',
            message: 'Missing meta description',
            suggestion: 'Add description to improve SEO',
          },
        ],
        // Additional mock properties for the analysis component
        score: 78,
        performanceScore: 85,
        securityScore: 92,
        seoScore: 65,
      };
    },

    async validate() {
      await new Promise(resolve => setTimeout(resolve, 450));
      
      return {
        valid: false,
        errors: [
          {
            routeId: 'duplicate-page',
            type: 'duplicate-path',
            message: 'Duplicate path found: /contact',
            severity: 'error',
          },
        ],
        warnings: [
          {
            routeId: 'home',
            message: 'Page missing description metadata',
            suggestion: 'Add description to page.info.ts for better SEO',
          },
        ],
      };
    },

    async refresh(input) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        routesFound: 15,
        lastScan: Date.now(),
      };
    },
  },
});

/**
 * Hook for fetching routes list with filtering
 */
export function useRoutes(type: 'all' | 'pages' | 'api' | 'middleware' = 'all', includeMetadata = false) {
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = createMockClient();

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.routes.list({ type, includeMetadata });
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, [type, includeMetadata]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return {
    routes,
    loading,
    error,
    refetch: fetchRoutes,
  };
}

/**
 * Hook for fetching specific route details
 */
export function useRouteDetail(routeId: string | null) {
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = createMockClient();

  const fetchRoute = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.routes.getDetail({ routeId: id });
      setRoute(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch route details');
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (routeId) {
      fetchRoute(routeId);
    } else {
      setRoute(null);
      setLoading(false);
      setError(null);
    }
  }, [routeId, fetchRoute]);

  return {
    route,
    loading,
    error,
    refetch: routeId ? () => fetchRoute(routeId) : undefined,
  };
}

/**
 * Hook for fetching route tree structure
 */
export function useRouteTree(includeMetadata = false) {
  const [tree, setTree] = useState<RouteTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = createMockClient();

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.routes.getTree({ includeMetadata });
      setTree(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch route tree');
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [includeMetadata]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return {
    tree,
    loading,
    error,
    refetch: fetchTree,
  };
}

/**
 * Hook for fetching route performance metrics
 */
export function useRoutePerformance(routeId?: string, timeRange: string = '24h') {
  const [performance, setPerformance] = useState<RoutePerformance | RoutePerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = createMockClient();

  const fetchPerformance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.routes.getPerformance({ 
        ...(routeId && { routeId }), 
        timeRange 
      });
      setPerformance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  }, [routeId, timeRange]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    performance,
    loading,
    error,
    refetch: fetchPerformance,
  };
}

/**
 * Hook for route analysis
 */
export function useRouteAnalysis() {
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = createMockClient();

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.routes.analyze();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch route analysis');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return {
    analysis,
    loading,
    error,
    refetch: fetchAnalysis,
  };
}

/**
 * Hook for route validation
 */
export function useRouteValidation(routeId?: string) {
  const [validation, setValidation] = useState<RouteValidation | Array<{
    routeId: string;
    status: 'valid' | 'warning' | 'error';
    issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      line?: number;
      column?: number;
    }>;
    metadata?: {
      totalChecks: number;
      passedChecks: number;
    };
  }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = createMockClient();

  const fetchValidation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (routeId && routeId !== 'all') {
        // Mock individual route validation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockRouteValidation = [{
          routeId,
          status: (Math.random() > 0.7 ? 'error' : Math.random() > 0.5 ? 'warning' : 'valid') as 'valid' | 'warning' | 'error',
          issues: [
            {
              type: 'syntax-missing-metadata',
              severity: 'warning' as const,
              message: 'Route is missing meta description',
              line: 5,
            },
            ...(Math.random() > 0.5 ? [{
              type: 'performance-large-bundle',
              severity: 'warning' as const,
              message: 'Bundle size exceeds 200KB threshold',
            }] : []),
          ],
          metadata: {
            totalChecks: 12,
            passedChecks: Math.floor(Math.random() * 4) + 8,
          },
        }];
        
        setValidation(mockRouteValidation);
      } else {
        // Return global validation for all routes
        await new Promise(resolve => setTimeout(resolve, 450));
        
        const mockAllRoutesValidation = [
          {
            routeId: 'home',
            status: 'valid' as const,
            issues: [],
            metadata: { totalChecks: 15, passedChecks: 15 },
          },
          {
            routeId: 'login',
            status: 'warning' as const,
            issues: [
              {
                type: 'syntax-missing-metadata',
                severity: 'warning' as const,
                message: 'Route is missing meta description',
                line: 8,
              },
            ],
            metadata: { totalChecks: 12, passedChecks: 11 },
          },
          {
            routeId: 'dashboard',
            status: 'error' as const,
            issues: [
              {
                type: 'structure-duplicate-path',
                severity: 'error' as const,
                message: 'Duplicate route path detected',
                line: 3,
              },
              {
                type: 'performance-slow-load',
                severity: 'warning' as const,
                message: 'Route has slow loading performance',
              },
            ],
            metadata: { totalChecks: 18, passedChecks: 14 },
          },
        ];
        
        setValidation(mockAllRoutesValidation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch route validation');
      setValidation(null);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    fetchValidation();
  }, [fetchValidation]);

  return {
    validation,
    loading,
    error,
    refetch: fetchValidation,
  };
}

/**
 * Hook for refreshing route discovery
 */
export function useRouteRefresh() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<{ success: boolean; routesFound: number; lastScan: number } | null>(null);

  const client = createMockClient();

  const refresh = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.routes.refresh({ force });
      setLastRefresh(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh routes';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    refresh,
    loading,
    error,
    lastRefresh,
  };
}
