/**
 * Route Explorer Plugin ORPC Contract
 * 
 * Provides type-safe procedures for exploring Next.js routes,
 * analyzing route performance, and inspecting page components.
 */

import { o } from '@orpc/contract';
import { z } from 'zod';

/**
 * Route information schema
 */
export const RouteInfoSchema = z.object({
  id: z.string(),
  path: z.string(),
  type: z.enum(['page', 'api', 'middleware', 'layout', 'loading', 'error', 'not-found']),
  filePath: z.string(),
  isStatic: z.boolean(),
  isDynamic: z.boolean(),
  hasParams: z.boolean(),
  hasSearchParams: z.boolean(),
  segments: z.array(z.object({
    name: z.string(),
    type: z.enum(['static', 'dynamic', 'catch-all', 'optional-catch-all']),
    value: z.string().optional(),
  })),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    generateStaticParams: z.boolean().optional(),
    revalidate: z.number().optional(),
    fetchCache: z.enum(['auto', 'default-cache', 'only-cache', 'force-cache', 'force-no-store', 'default-no-store', 'only-no-store']).optional(),
    runtime: z.enum(['nodejs', 'edge']).optional(),
    preferredRegion: z.union([z.string(), z.array(z.string())]).optional(),
  }),
  parentLayout: z.string().optional(),
  nestedRoutes: z.array(z.string()),
  dependencies: z.array(z.string()),
  bundle: z.object({
    size: z.number(),
    gzipSize: z.number(),
    chunks: z.array(z.string()),
  }).optional(),
});

/**
 * Route performance metrics schema
 */
export const RoutePerformanceSchema = z.object({
  routeId: z.string(),
  metrics: z.object({
    firstContentfulPaint: z.number().optional(),
    largestContentfulPaint: z.number().optional(),
    firstInputDelay: z.number().optional(),
    cumulativeLayoutShift: z.number().optional(),
    timeToFirstByte: z.number().optional(),
    domContentLoaded: z.number().optional(),
    loadComplete: z.number().optional(),
  }),
  resourceTiming: z.array(z.object({
    name: z.string(),
    duration: z.number(),
    size: z.number(),
    type: z.enum(['script', 'stylesheet', 'image', 'font', 'fetch', 'other']),
  })),
  lighthouse: z.object({
    performance: z.number(),
    accessibility: z.number(),
    bestPractices: z.number(),
    seo: z.number(),
    pwa: z.number(),
  }).optional(),
  timestamp: z.number(),
});

/**
 * Route filter options schema
 */
export const RouteFilterSchema = z.object({
  types: z.array(z.enum(['page', 'api', 'middleware', 'layout', 'loading', 'error', 'not-found'])).optional(),
  searchQuery: z.string().optional(),
  isStatic: z.boolean().optional(),
  isDynamic: z.boolean().optional(),
  hasParams: z.boolean().optional(),
  minBundleSize: z.number().optional(),
  maxBundleSize: z.number().optional(),
  sortBy: z.enum(['path', 'type', 'size', 'performance']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Route dependency graph schema
 */
export const RouteDependencyGraphSchema = z.object({
  routes: z.record(z.string(), RouteInfoSchema),
  dependencies: z.record(z.string(), z.array(z.string())),
  sharedComponents: z.array(z.object({
    name: z.string(),
    path: z.string(),
    usedBy: z.array(z.string()),
    size: z.number(),
  })),
  circularDependencies: z.array(z.array(z.string())),
});

/**
 * Route build analysis schema
 */
export const RouteBuildAnalysisSchema = z.object({
  totalRoutes: z.number(),
  staticRoutes: z.number(),
  dynamicRoutes: z.number(),
  apiRoutes: z.number(),
  totalBundleSize: z.number(),
  averageRouteSize: z.number(),
  largestRoutes: z.array(RouteInfoSchema),
  buildTime: z.number(),
  optimizationSuggestions: z.array(z.object({
    type: z.enum(['static-generation', 'code-splitting', 'preloading', 'lazy-loading']),
    description: z.string(),
    impact: z.object({
      performanceGain: z.number(),
      sizeReduction: z.number(),
    }),
    affectedRoutes: z.array(z.string()),
  })),
  timestamp: z.number(),
});

/**
 * Route Explorer ORPC Contract
 */
export const routeExplorerContract = o.contract({
  /**
   * Get all routes in the application
   */
  getRoutes: o.route({
    method: 'POST',
    path: '/routes',
    body: RouteFilterSchema.optional(),
    responses: {
      200: z.object({
        routes: z.array(RouteInfoSchema),
        totalCount: z.number(),
        filteredCount: z.number(),
      }),
      400: z.object({
        error: z.literal('INVALID_FILTER'),
        message: z.string(),
      }),
    },
  }),

  /**
   * Get detailed information about a specific route
   */
  getRouteDetail: o.route({
    method: 'GET',
    path: '/routes/:routeId',
    responses: {
      200: z.object({
        route: RouteInfoSchema,
        performance: RoutePerformanceSchema.optional(),
        dependencies: z.array(z.string()),
        dependents: z.array(z.string()),
        sourceCode: z.object({
          content: z.string(),
          language: z.string(),
          highlights: z.array(z.object({
            line: z.number(),
            type: z.enum(['export', 'import', 'component', 'hook', 'metadata']),
            description: z.string(),
          })),
        }).optional(),
      }),
      404: z.object({
        error: z.literal('ROUTE_NOT_FOUND'),
        message: z.string(),
      }),
    },
  }),

  /**
   * Get route performance metrics
   */
  getRoutePerformance: o.route({
    method: 'GET',
    path: '/routes/:routeId/performance',
    responses: {
      200: RoutePerformanceSchema,
      404: z.object({
        error: z.literal('ROUTE_NOT_FOUND'),
        message: z.string(),
      }),
      503: z.object({
        error: z.literal('PERFORMANCE_DATA_UNAVAILABLE'),
        message: z.string(),
      }),
    },
  }),

  /**
   * Get route dependency graph
   */
  getDependencyGraph: o.route({
    method: 'GET',
    path: '/routes/dependency-graph',
    responses: {
      200: RouteDependencyGraphSchema,
      500: z.object({
        error: z.literal('GRAPH_GENERATION_FAILED'),
        message: z.string(),
      }),
    },
  }),

  /**
   * Get route build analysis
   */
  getBuildAnalysis: o.route({
    method: 'GET',
    path: '/routes/build-analysis',
    responses: {
      200: RouteBuildAnalysisSchema,
      500: z.object({
        error: z.literal('BUILD_ANALYSIS_FAILED'),
        message: z.string(),
      }),
    },
  }),

  /**
   * Generate static params for a dynamic route
   */
  generateStaticParams: o.route({
    method: 'POST',
    path: '/routes/:routeId/static-params',
    body: z.object({
      force: z.boolean().optional(),
    }),
    responses: {
      200: z.object({
        params: z.array(z.record(z.string(), z.string())),
        generated: z.number(),
        cached: z.number(),
      }),
      400: z.object({
        error: z.literal('NOT_DYNAMIC_ROUTE'),
        message: z.string(),
      }),
      404: z.object({
        error: z.literal('ROUTE_NOT_FOUND'),
        message: z.string(),
      }),
      500: z.object({
        error: z.literal('GENERATION_FAILED'),
        message: z.string(),
      }),
    },
  }),

  /**
   * Analyze route for optimization opportunities
   */
  analyzeRouteOptimization: o.route({
    method: 'GET',
    path: '/routes/:routeId/optimization',
    responses: {
      200: z.object({
        route: RouteInfoSchema,
        analysis: z.object({
          staticGeneration: z.object({
            possible: z.boolean(),
            reason: z.string(),
            estimatedImprovement: z.number(),
          }),
          codeSplitting: z.object({
            opportunities: z.array(z.object({
              component: z.string(),
              size: z.number(),
              lazyLoadable: z.boolean(),
            })),
            potentialSavings: z.number(),
          }),
          preloading: z.object({
            criticalResources: z.array(z.string()),
            recommendations: z.array(z.string()),
          }),
          caching: z.object({
            strategy: z.enum(['static', 'revalidate', 'no-store']),
            recommended: z.boolean(),
            reason: z.string(),
          }),
        }),
        score: z.number(),
        priority: z.enum(['high', 'medium', 'low']),
      }),
      404: z.object({
        error: z.literal('ROUTE_NOT_FOUND'),
        message: z.string(),
      }),
    },
  }),

  /**
   * Refresh route discovery and analysis
   */
  refreshRoutes: o.route({
    method: 'POST',
    path: '/routes/refresh',
    body: z.object({
      force: z.boolean().optional(),
      includePerformance: z.boolean().optional(),
    }),
    responses: {
      200: z.object({
        status: z.literal('SUCCESS'),
        discoveredRoutes: z.number(),
        updatedRoutes: z.number(),
        timestamp: z.number(),
      }),
      202: z.object({
        status: z.literal('IN_PROGRESS'),
        estimatedTime: z.number(),
      }),
      409: z.object({
        error: z.literal('REFRESH_IN_PROGRESS'),
        message: z.string(),
      }),
    },
  }),
});

/**
 * Export types for use in components and hooks
 */
export type RouteInfo = z.infer<typeof RouteInfoSchema>;
export type RoutePerformance = z.infer<typeof RoutePerformanceSchema>;
export type RouteFilter = z.infer<typeof RouteFilterSchema>;
export type RouteDependencyGraph = z.infer<typeof RouteDependencyGraphSchema>;
export type RouteBuildAnalysis = z.infer<typeof RouteBuildAnalysisSchema>;
