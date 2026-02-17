import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidation strategy types.
 */
export type InvalidationStrategy =
  | 'optimistic'
  | 'pessimistic'
  | 'hybrid'
  | 'none';

/**
 * Configuration for procedure-specific invalidation.
 */
export type ProcedureInvalidationConfig = {
  /** Procedures to invalidate (by name or query key pattern). */
  invalidate?: string[];

  /** Procedures to refetch immediately. */
  refetch?: string[];

  /** Strategy to use. */
  strategy?: InvalidationStrategy;

  /** Custom invalidation logic. */
  custom?: (queryClient: QueryClient, variables: unknown, data?: unknown) => void | Promise<void>;
};

/**
 * Build a smart invalidator for ORPC procedures.
 */
export type ProcedureInvalidator = {
  /** Register invalidation rules for a mutation. */
  onMutation(mutationName: string, config: ProcedureInvalidationConfig): void;

  /** Execute invalidation for a mutation. */
  invalidate(
    queryClient: QueryClient,
    mutationName: string,
    variables: unknown,
    data?: unknown
  ): Promise<void>;

  /** Get all registered rules. */
  getRules(): Record<string, ProcedureInvalidationConfig>;
};
