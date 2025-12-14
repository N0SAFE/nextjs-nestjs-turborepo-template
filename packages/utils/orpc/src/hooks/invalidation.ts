/**
 * @fileoverview Smart cache invalidation strategies
 * 
 * Provides intelligent cache invalidation based on:
 * - Operation semantics (create/update/delete)
 * - Entity relationships (parent/child)
 * - Data dependencies (list depends on items)
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidation strategy types
 */
export type InvalidationStrategy = 
  | 'optimistic'      // Update cache immediately before server response
  | 'pessimistic'     // Wait for server response before updating
  | 'hybrid'          // Optimistic for UI, pessimistic for refetch
  | 'none';           // No automatic invalidation

/**
 * Configuration for procedure-specific invalidation
 */
export type ProcedureInvalidationConfig = {
  /** Procedures to invalidate (by name or query key pattern) */
  invalidate?: string[];
  
  /** Procedures to refetch immediately */
  refetch?: string[];
  
  /** Strategy to use */
  strategy?: InvalidationStrategy;
  
  /** Custom invalidation logic */
  custom?: (queryClient: QueryClient, variables: unknown, data?: unknown) => void | Promise<void>;
};

/**
 * Build a smart invalidator for ORPC procedures
 */
export type ProcedureInvalidator = {
  /**
   * Register invalidation rules for a mutation
   */
  onMutation(mutationName: string, config: ProcedureInvalidationConfig): void;
  
  /**
   * Execute invalidation for a mutation
   */
  invalidate(
    queryClient: QueryClient, 
    mutationName: string, 
    variables: unknown, 
    data?: unknown
  ): Promise<void>;
  
  /**
   * Get all registered rules
   */
  getRules(): Record<string, ProcedureInvalidationConfig>;
};

/**
 * Create a procedure invalidator with smart defaults
 */
export function createProcedureInvalidator(
  router: Record<string, unknown>,
  defaults?: {
    strategy?: InvalidationStrategy;
    autoDetect?: boolean;
  }
): ProcedureInvalidator {
  const rules = new Map<string, ProcedureInvalidationConfig>();
  
  return {
    onMutation(mutationName: string, config: ProcedureInvalidationConfig) {
      rules.set(mutationName, {
        strategy: defaults?.strategy ?? 'hybrid',
        ...config
      });
    },
    
    async invalidate(queryClient, mutationName, variables, data) {
      const config = rules.get(mutationName);
      
      if (!config) {
        // Use auto-detection if enabled
        if (defaults?.autoDetect) {
          await autoInvalidate(queryClient, router, mutationName, variables);
        }
        return;
      }
      
      // Execute custom logic first
      if (config.custom) {
        await config.custom(queryClient, variables, data);
      }
      
      // Handle standard invalidations
      if (config.invalidate) {
        for (const procedureName of config.invalidate) {
          const procedure = router[procedureName] as Record<string, unknown> | undefined;
          if (procedure?.queryKey) {
            await queryClient.invalidateQueries({ 
              queryKey: (procedure.queryKey as (opts: Record<string, unknown>) => unknown[])({ input: {} })
            });
          }
        }
      }
      
      // Handle refetches
      if (config.refetch) {
        for (const procedureName of config.refetch) {
          const procedure = router[procedureName] as Record<string, unknown> | undefined;
          if (procedure?.queryKey) {
            await queryClient.refetchQueries({ 
              queryKey: (procedure.queryKey as (opts: Record<string, unknown>) => unknown[])({ input: {} })
            });
          }
        }
      }
    },
    
    getRules() {
      return Object.fromEntries(rules);
    }
  };
}

/**
 * Auto-detect and execute invalidations based on mutation semantics
 */
async function autoInvalidate(
  queryClient: QueryClient,
  router: Record<string, unknown>,
  mutationName: string,
  variables: unknown
) {
  const lowerMutation = mutationName.toLowerCase();
  const typedVariables = variables as { id?: string } | null | undefined;
  
  // CREATE operations invalidate lists and counts
  if (lowerMutation.includes('create') || lowerMutation.includes('add')) {
    for (const [name, procedure] of Object.entries(router)) {
      if (name.toLowerCase().includes('list') || name.toLowerCase().includes('count')) {
        const typedProcedure = procedure as Record<string, unknown> | undefined;
        if (typedProcedure?.queryKey) {
          await queryClient.invalidateQueries({ 
            queryKey: (typedProcedure.queryKey as (opts: Record<string, unknown>) => unknown[])({ input: {} })
          });
        }
      }
    }
  }
  
  // UPDATE operations invalidate lists and specific items
  if (lowerMutation.includes('update') || lowerMutation.includes('edit')) {
    for (const [name, procedure] of Object.entries(router)) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('list') || lowerName.includes('findbyid') || lowerName.includes('get')) {
        const typedProcedure = procedure as Record<string, unknown> | undefined;
        if (typedProcedure?.queryKey) {
          // For findById, try to use the ID from variables
          const input = (lowerName.includes('findbyid') || lowerName.includes('get')) && typedVariables?.id
            ? { id: typedVariables.id }
            : {};
          await queryClient.invalidateQueries({ 
            queryKey: (typedProcedure.queryKey as (opts: Record<string, unknown>) => unknown[])({ input })
          });
        }
      }
    }
  }
  
  // DELETE operations invalidate everything related
  if (lowerMutation.includes('delete') || lowerMutation.includes('remove')) {
    for (const [name, procedure] of Object.entries(router)) {
      const typedProcedure = procedure as Record<string, unknown> | undefined;
      if (typedProcedure?.queryKey) {
        // For findById, try to use the ID from variables
        const input = (name.toLowerCase().includes('findbyid') || name.toLowerCase().includes('get')) && typedVariables?.id
          ? { id: typedVariables.id }
          : {};
        await queryClient.invalidateQueries({ 
          queryKey: (typedProcedure.queryKey as (opts: Record<string, unknown>) => unknown[])({ input })
        });
      }
    }
  }
}

/**
 * Predefined invalidation patterns for common scenarios
 */
export const commonPatterns = {
  /**
   * Standard CRUD pattern
   */
  crud: (listName = 'list', findByIdName = 'findById', countName = 'count') => ({
    create: {
      invalidate: [listName, countName],
      strategy: 'optimistic' as const
    },
    update: {
      invalidate: [listName, findByIdName],
      strategy: 'optimistic' as const
    },
    delete: {
      invalidate: [listName, countName, findByIdName],
      strategy: 'pessimistic' as const
    }
  }),
  
  /**
   * Pattern for hierarchical data (parent/child relationships)
   */
  hierarchical: (parentList: string, childList: string) => ({
    createChild: {
      invalidate: [childList, parentList],
      strategy: 'optimistic' as const
    },
    updateChild: {
      invalidate: [childList],
      strategy: 'optimistic' as const
    },
    deleteChild: {
      invalidate: [childList, parentList],
      strategy: 'pessimistic' as const
    }
  }),
  
  /**
   * Pattern for search/filter operations
   */
  searchable: (searchName: string, listName: string) => ({
    updateSearchResults: {
      invalidate: [searchName],
      refetch: [listName],
      strategy: 'hybrid' as const
    }
  })
};
