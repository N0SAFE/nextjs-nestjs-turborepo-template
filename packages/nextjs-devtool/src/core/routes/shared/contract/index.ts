/**
 * Routes Core Plugin Contract
 * 
 * Defines the ORPC contract for route discovery and analysis functionality
 * including declarative routing integration, performance metrics, and route optimization.
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

/**
 * Route information schema based on declarative routing
 */
const RouteInfoSchema = z.object({
  id: z.string().describe('Unique route identifier'),
  path: z.string().describe('Route path pattern'),
  name: z.string().describe('Route name from declarative routing'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).describe('HTTP method'),
  file: z.string().describe('File path relative to app directory'),
  type: z.enum(['page', 'layout', 'loading', 'error', 'not-found', 'route', 'middleware']).describe('Route type'),
  dynamic: z.boolean().describe('Whether route has dynamic segments'),
  params: z.array(z.string()).optional().describe('Dynamic parameter names'),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    searchParams: z.record(z.string(), z.any()).optional(),
  }).optional().describe('Route metadata from page.info.ts'),
});

/**
 * Route performance metrics schema
 */
const RoutePerformanceSchema = z.object({
  routeId: z.string().describe('Route identifier'),
  averageLoadTime: z.number().describe('Average load time in milliseconds'),
  totalRequests: z.number().describe('Total number of requests'),
  errorCount: z.number().describe('Number of errors'),
  lastAccessed: z.number().describe('Last access timestamp'),
  bundleSize: z.number().optional().describe('Route bundle size in bytes'),
  dependencies: z.array(z.string()).optional().describe('Route dependencies'),
});

/**
 * Route tree node interface for type safety
 */
interface RouteTreeNodeType {
  id: string;
  path: string;
  name: string;
  type: string;
  file: string;
  children?: RouteTreeNodeType[] | undefined;
  metadata?: Record<string, any> | undefined;
}

/**
 * Route tree node schema for hierarchical display
 */
const RouteTreeNodeSchema: z.ZodType<RouteTreeNodeType> = z.object({
  id: z.string(),
  path: z.string(),
  name: z.string(),
  type: z.string(),
  file: z.string(),
  children: z.array(z.lazy(() => RouteTreeNodeSchema)).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Route analysis result schema
 */
const RouteAnalysisSchema = z.object({
  totalRoutes: z.number().describe('Total number of routes'),
  routesByType: z.record(z.string(), z.number()).describe('Routes grouped by type'),
  dynamicRoutes: z.number().describe('Number of dynamic routes'),
  staticRoutes: z.number().describe('Number of static routes'),
  unusedRoutes: z.array(z.string()).describe('Routes that appear unused'),
  heaviestRoutes: z.array(z.object({
    routeId: z.string(),
    size: z.number(),
    loadTime: z.number(),
  })).describe('Routes with highest load times/sizes'),
  recommendations: z.array(z.object({
    type: z.enum(['performance', 'seo', 'structure', 'security']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    routeId: z.string(),
    message: z.string(),
    suggestion: z.string(),
  })).describe('Optimization recommendations'),
});

/**
 * Route validation result schema
 */
const RouteValidationSchema = z.object({
  valid: z.boolean().describe('Whether all routes are valid'),
  errors: z.array(z.object({
    routeId: z.string(),
    type: z.enum(['missing-file', 'invalid-params', 'duplicate-path', 'circular-dependency']),
    message: z.string(),
    severity: z.enum(['warning', 'error']),
  })).describe('Validation errors and warnings'),
  warnings: z.array(z.object({
    routeId: z.string(),
    message: z.string(),
    suggestion: z.string().optional(),
  })).describe('Non-critical warnings'),
});

/**
 * Individual procedure contracts
 */
export const listRoutesContract = oc
  .route({
    method: "GET",
    path: "/list",
    summary: "List all routes",
    description: "Get all discovered routes from declarative routing",
  })
  .input(z.object({
    type: z.enum(['all', 'pages', 'api', 'middleware']).optional().describe('Filter routes by type'),
    includeMetadata: z.boolean().optional().default(false).describe('Include route metadata'),
  }))
  .output(z.array(RouteInfoSchema));

export const getRouteDetailContract = oc
  .route({
    method: "GET",
    path: "/detail/:routeId",
    summary: "Get route details",
    description: "Get detailed information about a specific route",
  })
  .input(z.object({
    routeId: z.string().describe('Route identifier'),
  }))
  .output(RouteInfoSchema);

export const getRouteTreeContract = oc
  .route({
    method: "GET",
    path: "/tree",
    summary: "Get route tree",
    description: "Get hierarchical route structure",
  })
  .input(z.object({
    includeMetadata: z.boolean().optional().default(false),
  }))
  .output(z.array(RouteTreeNodeSchema));

export const getRoutePerformanceContract = oc
  .route({
    method: "GET",
    path: "/performance",
    summary: "Get route performance",
    description: "Get performance metrics for all routes",
  })
  .input(z.object({
    routeId: z.string().optional().describe('Specific route ID, or all routes if not provided'),
    timeRange: z.enum(['1h', '24h', '7d', '30d']).optional().default('24h'),
  }))
  .output(z.union([
    RoutePerformanceSchema,
    z.array(RoutePerformanceSchema)
  ]));

export const analyzeRoutesContract = oc
  .route({
    method: "GET",
    path: "/analyze",
    summary: "Analyze routes",
    description: "Perform comprehensive route analysis and optimization suggestions",
  })
  .input(z.object({}))
  .output(RouteAnalysisSchema);

export const validateRoutesContract = oc
  .route({
    method: "GET",
    path: "/validate",
    summary: "Validate routes",
    description: "Validate route structure and identify issues",
  })
  .input(z.object({}))
  .output(RouteValidationSchema);

export const refreshRoutesContract = oc
  .route({
    method: "POST",
    path: "/refresh",
    summary: "Refresh route discovery",
    description: "Re-scan and update route information",
  })
  .input(z.object({
    force: z.boolean().optional().default(false).describe('Force full rescan'),
  }))
  .output(z.object({
    success: z.boolean(),
    routesFound: z.number(),
    lastScan: z.number(),
  }));

/**
 * Routes Core Plugin Contract
 * 
 * Namespace: core.routes.*
 */
export const routesContract = oc.tag("Routes").prefix("/routes").router({
  list: listRoutesContract,
  getDetail: getRouteDetailContract,
  getTree: getRouteTreeContract,
  getPerformance: getRoutePerformanceContract,
  analyze: analyzeRoutesContract,
  validate: validateRoutesContract,
  refresh: refreshRoutesContract,
});

/**
 * Type exports for use in components and hooks
 */
export type RouteInfo = z.infer<typeof RouteInfoSchema>;
export type RoutePerformance = z.infer<typeof RoutePerformanceSchema>;
export type RouteTreeNode = RouteTreeNodeType;
export type RouteAnalysis = z.infer<typeof RouteAnalysisSchema>;
export type RouteValidation = z.infer<typeof RouteValidationSchema>;
export type RoutesContract = typeof routesContract;
