/**
 * @fileoverview Composite hooks for common UI patterns
 * 
 * Provides higher-level hooks that combine multiple procedures:
 * - List with pagination and filtering
 * - CRUD operations bundled together
 * - Admin/management panels
 * - Form integration
 */

import * as React from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { RouterHooks } from './generate-hooks';
import { getOptionalHook, type MutationResult, type QueryResult } from './composite/shared';

/**
 * Configuration for composite hooks
 */
export type CompositeHooksConfig = {
  /** Enable debug logging */
  debug?: boolean;
  
  /** Default pagination size */
  defaultPageSize?: number;
  
  /** Enable optimistic updates */
  optimistic?: boolean;
};

export type CompositeHooksOptions = CompositeHooksConfig & {
  /**
   * Lazy QueryClient provider (typically TanStack Query's `useQueryClient`).
   * Required for utilities that invalidate cache.
   */
  useQueryClient: () => QueryClient;
};

/**
 * Create composite hooks for common patterns
 */
export function createCompositeHooks<TRouter extends object>(
  router: TRouter,
  baseHooks: RouterHooks<TRouter>,
  compositeOptions: CompositeHooksOptions
) {
  /**
   * Combine list query with CRUD mutations
   * Useful for admin panels and management UIs
   * 
   * @example
   * ```ts
   * const { 
   *   items, 
   *   isLoading, 
   *   create, 
   *   update, 
   *   delete: deleteItem 
   * } = useManagement({
   *   pagination: { pageSize: 20 }
   * });
   * ```
   */
  function useManagement(options?: {
    pagination?: { page?: number; pageSize?: number };
    filter?: unknown;
    sort?: unknown;
  }) {
    const queryClient = compositeOptions.useQueryClient();
    
    // Try to find list, create, update, delete hooks
    const hooksRecord = baseHooks as Record<string, unknown>;
    const listHook = getOptionalHook<(opts: unknown) => unknown>(hooksRecord, 'useList');
    const createHook = getOptionalHook<() => unknown>(hooksRecord, 'useCreate');
    const updateHook = getOptionalHook<() => unknown>(hooksRecord, 'useUpdate');
    const deleteHook = getOptionalHook<() => unknown>(hooksRecord, 'useDelete');

    const listQuery = listHook?.(options?.pagination) as QueryResult<{ data?: unknown[]; meta?: unknown }> | undefined;
    const createMutation = createHook?.() as MutationResult | undefined;
    const updateMutation = updateHook?.() as MutationResult | undefined;
    const deleteMutation = deleteHook?.() as MutationResult | undefined;
    
    return {
      // Query data
      items: listQuery?.data?.data ?? [],
      meta: listQuery?.data?.meta,
      isLoading: listQuery?.isLoading ?? false,
      isFetching: listQuery?.isFetching ?? false,
      error: listQuery?.error,
      
      // Mutations
      create: createMutation?.mutate,
      createAsync: createMutation?.mutateAsync,
      update: updateMutation?.mutate,
      updateAsync: updateMutation?.mutateAsync,
      delete: deleteMutation?.mutate,
      deleteAsync: deleteMutation?.mutateAsync,
      
      // Loading states
      isCreating: createMutation?.isPending ?? false,
      isUpdating: updateMutation?.isPending ?? false,
      isDeleting: deleteMutation?.isPending ?? false,
      
      // Errors
      createError: createMutation?.error,
      updateError: updateMutation?.error,
      deleteError: deleteMutation?.error,
      
      // Utility functions
      refresh: () => listQuery?.refetch?.(),
      invalidate: () => {
        const queryKey = ((router as Record<string, Record<string, unknown>>).list?.queryKey as
          | ((opts: Record<string, unknown>) => unknown[])
          | undefined
        )?.({ input: {} });

        if (!queryKey) {
          return Promise.resolve();
        }

        return queryClient.invalidateQueries({ queryKey });
      }
    };
  }
  
  /**
   * Paginated list with controls
   * Includes page navigation and size controls
   * 
   * @example
   * ```ts
   * const { 
   *   items, 
   *   page, 
   *   totalPages, 
   *   nextPage, 
   *   prevPage 
   * } = usePaginatedList({
   *   pageSize: 20
   * });
   * ```
   */
  function usePaginatedList(options?: {
    pageSize?: number;
    filter?: unknown;
    sort?: unknown;
  }) {
    const [page, setPage] = React.useState(1);
    const pageSize = options?.pageSize ?? compositeOptions.defaultPageSize ?? 20;
    
    const hooksRecord = baseHooks as Record<string, unknown>;
    const listHook = getOptionalHook<(opts: unknown) => unknown>(hooksRecord, 'useList');
    const countHook = getOptionalHook<() => unknown>(hooksRecord, 'useCount');
    
    const listQuery = listHook?.({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      ...options?.filter as Record<string, unknown>,
      ...options?.sort as Record<string, unknown>
    }) as QueryResult<{ data?: unknown[]; meta?: unknown; count?: number }> | undefined;
    
    const countQuery = countHook?.() as QueryResult<{ count?: number }> | undefined;
    
    const totalPages = countQuery?.data?.count 
      ? Math.ceil(countQuery.data.count / pageSize)
      : 0;
    
    return {
      // Data
      items: listQuery?.data?.data ?? [],
      meta: listQuery?.data?.meta,
      
      // Pagination state
      page,
      pageSize,
      totalPages,
      totalItems: countQuery?.data?.count ?? 0,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      
      // Pagination controls
      nextPage: () => {setPage(p => Math.min(p + 1, totalPages))},
      prevPage: () => {setPage(p => Math.max(p - 1, 1))},
      goToPage: (newPage: number) => {setPage(Math.max(1, Math.min(newPage, totalPages)))},
      
      // Loading states
      isLoading: listQuery?.isLoading ?? false,
      isFetching: listQuery?.isFetching ?? false,
      
      // Errors
      error: listQuery?.error ?? countQuery?.error
    };
  }
  
  /**
   * Form integration hook
   * Combines findById query with update mutation
   * 
   * @example
   * ```ts
   * const { 
   *   data: user, 
   *   update, 
   *   isUpdating 
   * } = useFormData('user-123');
   * 
   * <form onSubmit={(e) => {
   *   e.preventDefault();
   *   update(formData);
   * }}>
   * ```
   */
  function useFormData(id: string) {
    const hooksRecord = baseHooks as Record<string, unknown>;
    const findByIdHook = getOptionalHook<(value: string) => unknown>(hooksRecord, 'useFindById');
    const updateHook = getOptionalHook<() => unknown>(hooksRecord, 'useUpdate');
    
    const query = findByIdHook?.(id) as QueryResult | undefined;
    const mutation = updateHook?.() as MutationResult | undefined;
    
    return {
      // Query data
      data: query?.data,
      isLoading: query?.isLoading ?? false,
      error: query?.error,
      
      // Update mutation
      update: mutation?.mutate,
      updateAsync: mutation?.mutateAsync,
      isUpdating: mutation?.isPending ?? false,
      updateError: mutation?.error,
      
      // Utility
      reset: mutation?.reset,
      refetch: query?.refetch
    };
  }
  
  /**
   * Infinite scroll/load more pattern
   * 
   * @example
   * ```ts
   * const { 
   *   items, 
   *   loadMore, 
   *   hasMore 
   * } = useInfiniteList({
   *   pageSize: 20
   * });
   * ```
   */
  function useInfiniteList(options?: {
    pageSize?: number;
    filter?: unknown;
    sort?: unknown;
  }) {
    const [allItems, setAllItems] = React.useState<unknown[]>([]);
    const [offset, setOffset] = React.useState(0);
    const pageSize = options?.pageSize ?? compositeOptions.defaultPageSize ?? 20;
    
    const listHook = getOptionalHook<(opts: unknown) => unknown>(
      baseHooks as Record<string, unknown>,
      'useList'
    );
    
    const query = listHook?.({
      limit: pageSize,
      offset,
      ...options?.filter as Record<string, unknown>,
      ...options?.sort as Record<string, unknown>
    }) as QueryResult<{ data?: unknown[]; meta?: { hasMore?: boolean } }> | undefined;
    
    // Accumulate items
    React.useEffect(() => {
      if (query?.data?.data) {
        setAllItems(prev => offset === 0 ? (query.data?.data ?? []) : [...prev, ...(query.data?.data ?? [])]);
      }
    }, [query?.data, offset]);
    
    const hasMore = query?.data?.meta?.hasMore ?? false;
    
    return {
      items: allItems,
      hasMore,
      isLoading: query?.isLoading ?? false,
      isFetchingMore: query?.isFetching && offset > 0,
      
      loadMore: () => {
        if (hasMore && !query?.isFetching) {
          setOffset(prev => prev + pageSize);
        }
      },
      
      reset: () => {
        setAllItems([]);
        setOffset(0);
      },
      
      error: query?.error
    };
  }
  
  /**
   * Selection management hook
   * Track selected items with bulk operations
   * 
   * @example
   * ```ts
   * const { 
   *   selected, 
   *   toggle, 
   *   selectAll, 
   *   deleteSelected 
   * } = useSelection();
   * ```
   */
  function useSelection() {
    const [selected, setSelected] = React.useState<Set<string>>(new Set());
    const deleteHook = getOptionalHook<() => unknown>(
      baseHooks as Record<string, unknown>,
      'useDelete'
    );
    
    const deleteMutation = deleteHook?.() as MutationResult<{ id: string }> | undefined;
    
    return {
      selected: Array.from(selected),
      selectedSet: selected,
      count: selected.size,
      
      toggle: (id: string) => {
        setSelected(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      },
      
      selectAll: (ids: string[]) => {
        setSelected(new Set(ids));
      },
      
      clear: () => {
        setSelected(new Set());
      },
      
      deleteSelected: async () => {
        if (deleteMutation?.mutateAsync) {
          for (const id of Array.from(selected)) {
            await deleteMutation.mutateAsync({ id });
          }
          setSelected(new Set());
        }
      },
      
      isDeleting: deleteMutation?.isPending ?? false
    };
  }
  
  return {
    useManagement,
    usePaginatedList,
    useFormData,
    useInfiniteList,
    useSelection
  };
}
