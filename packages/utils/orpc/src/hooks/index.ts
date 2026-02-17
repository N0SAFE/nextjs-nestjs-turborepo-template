/**
 * @fileoverview React hooks for ORPC procedures
 * 
 * This module provides automatic hook generation from ORPC routers,
 * composite hooks for common patterns, and cache invalidation utilities.
 * 
 * @example
 * ```ts
 * import { createRouterHooks, createCompositeHooks } from '@repo/orpc-utils/hooks';
 * 
 * // Create hooks from router
 * const hooks = createRouterHooks(userRouter);
 * 
 * // Use in components
 * const { data } = hooks.useList({ limit: 10 });
 * const mutation = hooks.useCreate();
 * ```
 */

// Core hook generation
export {
  createRouterHooks,
  createQueryHook,
  createMutationHook,
  createStreamedQueryHook,
  createLiveQueryHook,
  detectOperationType,
  inferInvalidations,
  defineInvalidations,
  isEventIteratorOutput,
  type RouterHooks,
  type RouterHooksOptions,
  type InvalidationConfig,
  type OperationType,
  type ExtractInput,
  type ExtractOutput,
  type ExtractMutationInput,
  type ExtractMutationOutput,
  type StreamedQueryOptions,
  type LiveQueryOptions,
  type HookNames,
  // Procedure name extractors (for debugging/advanced use cases)
  type QueryProcedureNames,
  type MutationProcedureNames,
  // Method type helpers (for debugging) - defined in generate-hooks
  type IsGetMethod,
  type IsNonGetMethod
} from './generate-hooks';

// Re-export types from builder for debugging use cases
export {
  type ExtractRouteMethod,
  type HasRouteMethodMeta
} from '../shared/route-method-meta';

// Cache invalidation utilities
export {
  createProcedureInvalidator,
  InvalidationStrategy,
  commonPatterns,
  type ProcedureInvalidationConfig,
  type ProcedureInvalidator
} from './invalidation';

// Composite hooks for common patterns
export {
  createCompositeHooks,
  type CompositeHooksConfig,
  type CompositeHooksOptions
} from './composite-hooks';

// Hook merging utilities
export {
  mergeHooks,
  defineCustomHooks,
  type MergeHooksConfig,
  type MergedHooks,
  type CustomHooks,
  type CustomHooksWithKeys,
  type QueryKeys,
  type QueryKeyFactory,
} from './merge-hooks';

// Re-export key-related types from generate-hooks
export {
  type ExtractCustomHooksKeys,
  type CustomInvalidationContext,
} from './generate-hooks';
