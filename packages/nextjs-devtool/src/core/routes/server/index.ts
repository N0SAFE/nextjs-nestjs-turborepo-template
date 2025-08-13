/**
 * Routes Core Plugin Server Implementation
 * 
 * Implements server-side procedures for route discovery and analysis
 * with integration to the declarative routing system.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { 
  RouteInfo, 
  RoutePerformance, 
  RouteTreeNode, 
  RouteAnalysis, 
  RouteValidation 
} from '../shared/contract';

/**
 * Type for ORPC procedure implementation
 */
type Procedure = (...args: any[]) => Promise<any>;

/**
 * Simple ORPC Router interface following specification
 */
interface ORPCRouter {
  procedures: Record<string, Procedure>;
  merge: (prefix: string, router: ORPCRouter) => ORPCRouter;
  procedure: (name: string, impl: Procedure) => ORPCRouter;
}

/**
 * Create a simple router implementation
 */
function createRouter(): ORPCRouter {
  const procedures: Record<string, Procedure> = {};
  
  return {
    procedures,
    procedure(name: string, impl: Procedure) {
      procedures[name] = impl;
      return this;
    },
    merge(prefix: string, router: ORPCRouter) {
      Object.entries(router.procedures).forEach(([key, proc]) => {
        procedures[`${prefix}${key}`] = proc;
      });
      return this;
    },
  };
}

/**
 * Route discovery service that scans the declarative routing system
 */
class RouteDiscoveryService {
  private routes: Map<string, RouteInfo> = new Map();
  private routeTree: RouteTreeNode[] = [];
  private performanceMetrics: Map<string, RoutePerformance> = new Map();
  private lastScan: number = 0;

  /**
   * Mock route discovery - in real implementation this would scan the app directory
   * and parse declarative routing files
   */
  async discoverRoutes(force = false): Promise<void> {
    if (!force && Date.now() - this.lastScan < 60000) {
      return; // Cache for 1 minute
    }

    // Mock discovered routes from declarative routing
    const mockRoutes: RouteInfo[] = [
      {
        id: 'home',
        path: '/',
        name: 'Home',
        method: 'GET',
        file: 'app/page.tsx',
        type: 'page',
        dynamic: false,
        metadata: {
          title: 'Home Page',
          description: 'Welcome to our application',
        },
      },
      {
        id: 'appshowcase',
        path: '/(app)/showcase',
        name: 'Appshowcase',
        method: 'GET',
        file: 'app/(app)/showcase/page.tsx',
        type: 'page',
        dynamic: false,
        metadata: {
          title: 'App Showcase',
          description: 'Showcase of application features',
        },
      },
      {
        id: 'authlogin',
        path: '/auth/login',
        name: 'Authlogin',
        method: 'GET',
        file: 'app/auth/login/page.tsx',
        type: 'page',
        dynamic: false,
        metadata: {
          title: 'Login',
          description: 'User authentication login page',
        },
      },
      {
        id: 'authme',
        path: '/auth/me',
        name: 'Authme',
        method: 'GET',
        file: 'app/auth/me/page.tsx',
        type: 'page',
        dynamic: false,
        metadata: {
          title: 'User Profile',
          description: 'User profile and settings',
        },
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
      {
        id: 'middlewareerrorenv',
        path: '/middleware/error/env',
        name: 'Middlewareerrorenv',
        method: 'GET',
        file: 'app/middleware/error/env/page.tsx',
        type: 'page',
        dynamic: false,
      },
      {
        id: 'middlewareerrorhealthcheck',
        path: '/middleware/error/healthCheck',
        name: 'MiddlewareerrorhealthCheck',
        method: 'GET',
        file: 'app/middleware/error/healthCheck/page.tsx',
        type: 'page',
        dynamic: false,
      },
    ];

    // Update internal cache
    this.routes.clear();
    mockRoutes.forEach(route => {
      this.routes.set(route.id, route);
    });

    // Generate route tree
    this.generateRouteTree();
    
    // Generate mock performance metrics
    this.generatePerformanceMetrics();
    
    this.lastScan = Date.now();
  }

  /**
   * Generate hierarchical route tree structure
   */
  private generateRouteTree(): void {
    const tree: RouteTreeNode[] = [];
    const routeMap = new Map<string, RouteTreeNode>();

    // Convert flat routes to tree structure
    Array.from(this.routes.values()).forEach(route => {
      const pathParts = route.path.split('/').filter(Boolean);
      let currentPath = '';
      let currentParent = tree;

      pathParts.forEach((part, index) => {
        currentPath += '/' + part;
        const isLast = index === pathParts.length - 1;
        
        let existingNode = routeMap.get(currentPath);
        
        if (!existingNode) {
          const node: RouteTreeNode = {
            id: isLast ? route.id : `segment-${currentPath}`,
            path: currentPath,
            name: isLast ? route.name : part,
            type: isLast ? route.type : 'segment',
            file: isLast ? route.file : '',
            children: isLast ? undefined : [],
            metadata: isLast ? route.metadata : undefined,
          };
          
          routeMap.set(currentPath, node);
          currentParent.push(node);
          existingNode = node;
        }
        
        if (!isLast && existingNode.children) {
          currentParent = existingNode.children;
        }
      });
    });

    this.routeTree = tree;
  }

  /**
   * Generate mock performance metrics
   */
  private generatePerformanceMetrics(): void {
    this.performanceMetrics.clear();
    
    Array.from(this.routes.values()).forEach(route => {
      const metrics: RoutePerformance = {
        routeId: route.id,
        averageLoadTime: Math.random() * 1000 + 100, // 100-1100ms
        totalRequests: Math.floor(Math.random() * 10000),
        errorCount: Math.floor(Math.random() * 10),
        lastAccessed: Date.now() - Math.random() * 86400000, // Last 24 hours
        bundleSize: route.type === 'page' ? Math.floor(Math.random() * 500000 + 50000) : undefined,
        dependencies: route.type === 'page' ? ['react', 'next', '@repo/ui'] : undefined,
      };
      
      this.performanceMetrics.set(route.id, metrics);
    });
  }

  /**
   * Get all routes with optional filtering
   */
  async getRoutes(type?: 'all' | 'pages' | 'api' | 'middleware', includeMetadata = false): Promise<RouteInfo[]> {
    await this.discoverRoutes();
    
    let routes = Array.from(this.routes.values());
    
    if (type && type !== 'all') {
      routes = routes.filter(route => {
        switch (type) {
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
    
    if (!includeMetadata) {
      routes = routes.map(route => ({ ...route, metadata: undefined }));
    }
    
    return routes;
  }

  /**
   * Get specific route details
   */
  async getRouteDetail(routeId: string): Promise<RouteInfo | null> {
    await this.discoverRoutes();
    return this.routes.get(routeId) || null;
  }

  /**
   * Get route tree structure
   */
  async getRouteTree(includeMetadata = false): Promise<RouteTreeNode[]> {
    await this.discoverRoutes();
    
    if (!includeMetadata) {
      return this.stripMetadataFromTree(this.routeTree);
    }
    
    return this.routeTree;
  }

  /**
   * Strip metadata from route tree for compact view
   */
  private stripMetadataFromTree(nodes: RouteTreeNode[]): RouteTreeNode[] {
    return nodes.map(node => ({
      ...node,
      metadata: undefined,
      children: node.children ? this.stripMetadataFromTree(node.children) : undefined,
    }));
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(routeId?: string): Promise<RoutePerformance | RoutePerformance[]> {
    await this.discoverRoutes();
    
    if (routeId) {
      const metrics = this.performanceMetrics.get(routeId);
      if (!metrics) {
        throw new Error(`Route not found: ${routeId}`);
      }
      return metrics;
    }
    
    return Array.from(this.performanceMetrics.values());
  }

  /**
   * Analyze routes for optimization opportunities
   */
  async analyzeRoutes(): Promise<RouteAnalysis> {
    await this.discoverRoutes();
    
    const routes = Array.from(this.routes.values());
    const performance = Array.from(this.performanceMetrics.values());
    
    return {
      totalRoutes: routes.length,
      routesByType: routes.reduce((acc, route) => {
        acc[route.type] = (acc[route.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      dynamicRoutes: routes.filter(r => r.dynamic).length,
      staticRoutes: routes.filter(r => !r.dynamic).length,
      unusedRoutes: performance
        .filter(p => p.totalRequests === 0)
        .map(p => p.routeId),
      heaviestRoutes: performance
        .sort((a, b) => b.averageLoadTime - a.averageLoadTime)
        .slice(0, 5)
        .map(p => ({
          routeId: p.routeId,
          size: p.bundleSize || 0,
          loadTime: p.averageLoadTime,
        })),
      recommendations: this.generateRecommendations(routes, performance),
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(routes: RouteInfo[], performance: RoutePerformance[]) {
    const recommendations = [];
    
    // Performance recommendations
    performance.forEach(perf => {
      if (perf.averageLoadTime > 1000) {
        recommendations.push({
          type: 'performance' as const,
          severity: 'high' as const,
          routeId: perf.routeId,
          message: `Route has high load time: ${perf.averageLoadTime.toFixed(0)}ms`,
          suggestion: 'Consider code splitting or lazy loading',
        });
      }
      
      if (perf.errorCount > 10) {
        recommendations.push({
          type: 'performance' as const,
          severity: 'critical' as const,
          routeId: perf.routeId,
          message: `Route has high error count: ${perf.errorCount}`,
          suggestion: 'Review error handling and fix underlying issues',
        });
      }
    });
    
    // SEO recommendations
    routes.forEach(route => {
      if (route.type === 'page' && !route.metadata?.title) {
        recommendations.push({
          type: 'seo' as const,
          severity: 'medium' as const,
          routeId: route.id,
          message: 'Page missing title metadata',
          suggestion: 'Add title to page.info.ts for better SEO',
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Validate route structure
   */
  async validateRoutes(): Promise<RouteValidation> {
    await this.discoverRoutes();
    
    const routes = Array.from(this.routes.values());
    const errors = [];
    const warnings = [];
    
    // Check for duplicate paths
    const pathMap = new Map<string, string[]>();
    routes.forEach(route => {
      const { path } = route;
      if (!pathMap.has(path)) {
        pathMap.set(path, []);
      }
      pathMap.get(path)!.push(route.id);
    });
    
    pathMap.forEach((routeIds, path) => {
      if (routeIds.length > 1) {
        routeIds.forEach(routeId => {
          errors.push({
            routeId,
            type: 'duplicate-path' as const,
            message: `Duplicate path found: ${path}`,
            severity: 'error' as const,
          });
        });
      }
    });
    
    // Check for missing metadata on important pages
    routes.forEach(route => {
      if (route.type === 'page' && !route.metadata?.description) {
        warnings.push({
          routeId: route.id,
          message: 'Page missing description metadata',
          suggestion: 'Add description to page.info.ts for better SEO',
        });
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Global instance
const routeDiscovery = new RouteDiscoveryService();

/**
 * Routes Core Router Implementation following specification pattern
 */
export const routesCoreRouter = createRouter()
  .procedure('list', async (_ctx: any, input: { type?: 'all' | 'pages' | 'api' | 'middleware'; includeMetadata?: boolean }) => {
    return await routeDiscovery.getRoutes(input.type, input.includeMetadata);
  })
  .procedure('getDetail', async (_ctx: any, routeId: string) => {
    const route = await routeDiscovery.getRouteDetail(routeId);
    if (!route) {
      throw new Error(`Route not found: ${routeId}`);
    }
    return route;
  })
  .procedure('getTree', async (_ctx: any, input: { includeMetadata?: boolean }) => {
    return await routeDiscovery.getRouteTree(input.includeMetadata);
  })
  .procedure('getPerformance', async (_ctx: any, input: { routeId?: string; timeRange?: string }) => {
    return await routeDiscovery.getPerformanceMetrics(input.routeId);
  })
  .procedure('analyze', async () => {
    return await routeDiscovery.analyzeRoutes();
  })
  .procedure('validate', async () => {
    return await routeDiscovery.validateRoutes();
  })
  .procedure('refresh', async (_ctx: any, input: { force?: boolean }) => {
    await routeDiscovery.discoverRoutes(input.force);
    return {
      success: true,
      routesFound: Array.from(routeDiscovery.routes.values()).length,
      lastScan: routeDiscovery.lastScan,
    };
  });

export type RoutesCoreRouter = typeof routesCoreRouter;
