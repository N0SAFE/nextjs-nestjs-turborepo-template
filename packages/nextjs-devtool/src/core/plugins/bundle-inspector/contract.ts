/**
 * Bundle Inspector ORPC Contract
 * 
 * Provides type-safe procedures for analyzing webpack bundles,
 * chunk dependencies, and bundle size optimizations.
 */

import { z } from 'zod';

/**
 * Bundle chunk information schema
 */
export const BundleChunkSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  gzipSize: z.number(),
  modules: z.array(z.string()),
  dependencies: z.array(z.string()),
  type: z.enum(['entry', 'async', 'vendor', 'runtime']),
  loadTime: z.number().optional(),
  cacheHit: z.boolean().optional(),
});

/**
 * Bundle module information schema
 */
export const BundleModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  size: z.number(),
  chunks: z.array(z.string()),
  dependencies: z.array(z.string()),
  dependents: z.array(z.string()),
  type: z.enum(['user', 'node_modules', 'webpack']),
  isAsync: z.boolean(),
  concatenated: z.boolean().optional(),
});

/**
 * Bundle analysis result schema
 */
export const BundleAnalysisSchema = z.object({
  totalSize: z.number(),
  totalGzipSize: z.number(),
  chunkCount: z.number(),
  moduleCount: z.number(),
  duplicateModules: z.array(z.string()),
  largestChunks: z.array(BundleChunkSchema),
  largestModules: z.array(BundleModuleSchema),
  optimizationSuggestions: z.array(z.object({
    type: z.enum(['split-chunk', 'remove-duplicate', 'lazy-load', 'tree-shake']),
    description: z.string(),
    impact: z.object({
      sizeReduction: z.number(),
      performanceGain: z.number(),
    }),
    modules: z.array(z.string()).optional(),
  })),
  analysisTime: z.number(),
  timestamp: z.number(),
});

/**
 * Bundle filter options schema
 */
export const BundleFilterSchema = z.object({
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
  chunkTypes: z.array(z.enum(['entry', 'async', 'vendor', 'runtime'])).optional(),
  moduleTypes: z.array(z.enum(['user', 'node_modules', 'webpack'])).optional(),
  searchQuery: z.string().optional(),
  sortBy: z.enum(['size', 'name', 'type', 'loadTime']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Bundle comparison schema
 */
export const BundleComparisonSchema = z.object({
  baseline: BundleAnalysisSchema,
  current: BundleAnalysisSchema,
  differences: z.object({
    sizeChange: z.number(),
    gzipSizeChange: z.number(),
    chunkCountChange: z.number(),
    moduleCountChange: z.number(),
    newModules: z.array(z.string()),
    removedModules: z.array(z.string()),
    modifiedModules: z.array(z.string()),
  }),
});

/**
 * Bundle Inspector Plugin Contract Interface
 * Simplified structure compatible with our plugin system
 */
export const bundleInspectorContract = {
  namespace: 'bundle-inspector',
  procedures: {
    getBundleAnalysis: {
      input: z.object({}),
      output: BundleAnalysisSchema,
      method: 'GET' as const,
      path: '/bundle/analysis',
    },
    getChunks: {
      input: BundleFilterSchema.optional(),
      output: z.object({
        chunks: z.array(BundleChunkSchema),
        totalCount: z.number(),
        filteredCount: z.number(),
      }),
      method: 'POST' as const,
      path: '/bundle/chunks',
    },
    getModules: {
      input: BundleFilterSchema.optional(),
      output: z.object({
        modules: z.array(BundleModuleSchema),
        totalCount: z.number(),
        filteredCount: z.number(),
      }),
      method: 'POST' as const,
      path: '/bundle/modules',
    },
    getModuleDependencies: {
      input: z.object({ moduleId: z.string() }),
      output: z.object({
        module: BundleModuleSchema,
        dependencies: z.array(BundleModuleSchema),
        dependents: z.array(BundleModuleSchema),
        dependencyGraph: z.record(z.string(), z.array(z.string())),
      }),
      method: 'GET' as const,
      path: '/bundle/modules/:moduleId/dependencies',
    },
    refreshAnalysis: {
      input: z.object({
        force: z.boolean().optional(),
      }),
      output: z.object({
        status: z.literal('SUCCESS'),
        analysisId: z.string(),
        timestamp: z.number(),
      }),
      method: 'POST' as const,
      path: '/bundle/refresh',
    },
  },
} as const;

/**
 * Export types for use in components and hooks
 */
export type BundleChunk = z.infer<typeof BundleChunkSchema>;
export type BundleModule = z.infer<typeof BundleModuleSchema>;
export type BundleAnalysis = z.infer<typeof BundleAnalysisSchema>;
export type BundleFilter = z.infer<typeof BundleFilterSchema>;
export type BundleComparison = z.infer<typeof BundleComparisonSchema>;
