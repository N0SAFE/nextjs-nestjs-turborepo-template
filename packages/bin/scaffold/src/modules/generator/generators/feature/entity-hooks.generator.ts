import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  DependencySpec,
  FileSpec,
  GeneratorContext,
} from "../../../../types/generator.types";

/**
 * Entity Hooks Generator
 *
 * Auto-generates React Query hooks from ORPC contracts.
 * Follows the ORPC Client Hooks Pattern from the project's core concepts.
 *
 * Features:
 * - Type-safe hooks generated from ORPC procedures
 * - Query hooks with pagination, filtering, sorting
 * - Mutation hooks with cache invalidation
 * - Infinite query support for scroll-based pagination
 * - Prefetch utilities for anticipated user interactions
 * - Composable utility hooks combining multiple operations
 */
@Injectable()
export class EntityHooksGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "entity-hooks",
    priority: 30,
    version: "1.0.0",
    description:
      "Auto-generate React Query hooks from ORPC contracts - type-safe, with cache management and mutations",
    contributesTo: ["hooks/*.ts"],
    dependsOn: ["nextjs", "react-query", "orpc"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    // Only generate if all dependencies are present
    if (
      !this.hasPlugin(context, "nextjs") ||
      !this.hasPlugin(context, "react-query") ||
      !this.hasPlugin(context, "orpc")
    ) {
      return [];
    }

    const files: FileSpec[] = [];

    // Hook generator utilities
    files.push(
      this.file(
        "apps/web/src/lib/hooks/generator.ts",
        this.getHookGenerator(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // Hook types
    files.push(
      this.file(
        "apps/web/src/lib/hooks/types.ts",
        this.getHookTypes(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // Base hook factory
    files.push(
      this.file(
        "apps/web/src/lib/hooks/factory.ts",
        this.getHookFactory(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // Cache utilities
    files.push(
      this.file(
        "apps/web/src/lib/hooks/cache.ts",
        this.getCacheUtils(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // Index export
    files.push(
      this.file(
        "apps/web/src/lib/hooks/index.ts",
        this.getHooksIndex(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // Example entity hooks
    files.push(
      this.file(
        "apps/web/src/hooks/useUsers.ts",
        this.getExampleUserHooks(),
        { mergeStrategy: "replace", priority: 30, skipIfExists: true },
      ),
    );

    // Example usage documentation
    files.push(
      this.file(
        "apps/web/src/hooks/entity-hooks.example.tsx",
        this.getExampleUsage(),
        { mergeStrategy: "replace", priority: 30, skipIfExists: true },
      ),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // Dependencies are already required by orpc and react-query plugins
    return [];
  }

  private getHookTypes(): string {
    return `/**
 * Entity Hook Types
 *
 * Type definitions for auto-generated entity hooks.
 */
import type { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

/**
 * Sort options for list queries
 */
export interface SortOptions<TField extends string = string> {
  field: TField;
  direction: "asc" | "desc";
}

/**
 * Common query options extended from React Query
 */
export interface EntityQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn"> {
  pagination?: PaginationOptions;
  sort?: SortOptions;
  filter?: Record<string, unknown>;
}

/**
 * Common mutation options extended from React Query
 */
export interface EntityMutationOptions<TData, TError = Error, TVariables = void>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn"> {
  /**
   * Whether to invalidate related queries on success
   * @default true
   */
  invalidateOnSuccess?: boolean;
  /**
   * Additional query keys to invalidate on success
   */
  additionalInvalidations?: string[][];
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Infinite query page param
 */
export interface InfinitePageParam {
  page: number;
  cursor?: string;
}

/**
 * Entity hook configuration
 */
export interface EntityHookConfig {
  /**
   * Base query key for the entity
   */
  queryKey: string;
  /**
   * Default stale time in milliseconds
   */
  staleTime?: number;
  /**
   * Default garbage collection time in milliseconds
   */
  gcTime?: number;
}

/**
 * Result of useEntityActions hook
 */
export interface EntityActions<
  TEntity,
  TCreateInput,
  TUpdateInput,
> {
  create: (data: TCreateInput) => void;
  createAsync: (data: TCreateInput) => Promise<TEntity>;
  update: (data: TUpdateInput) => void;
  updateAsync: (data: TUpdateInput) => Promise<TEntity>;
  delete: (id: string) => void;
  deleteAsync: (id: string) => Promise<void>;
  isLoading: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  errors: {
    create: Error | null;
    update: Error | null;
    delete: Error | null;
  };
}
`;
  }

  private getHookFactory(): string {
    return `/**
 * Entity Hook Factory
 *
 * Factory functions to create type-safe entity hooks from ORPC procedures.
 */
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  EntityQueryOptions,
  EntityMutationOptions,
  PaginatedResponse,
  InfinitePageParam,
  EntityHookConfig,
} from "./types";

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<Omit<EntityHookConfig, "queryKey">> = {
  staleTime: 1000 * 60,      // 1 minute
  gcTime: 1000 * 60 * 5,     // 5 minutes
};

/**
 * Create a query hook for fetching a single entity
 */
export function createEntityQuery<TData, TInput = { id: string }>(
  config: EntityHookConfig,
  queryFn: (input: TInput) => Promise<TData>,
) {
  const { queryKey, staleTime, gcTime } = { ...DEFAULT_CONFIG, ...config };

  return function useEntityQuery(
    input: TInput,
    options?: EntityQueryOptions<TData>,
  ) {
    return useQuery({
      queryKey: [queryKey, input],
      queryFn: () => queryFn(input),
      staleTime,
      gcTime,
      ...options,
    });
  };
}

/**
 * Create a query hook for fetching a list of entities
 */
export function createEntityListQuery<
  TData,
  TInput extends Record<string, unknown> = Record<string, unknown>,
>(
  config: EntityHookConfig,
  queryFn: (input: TInput) => Promise<PaginatedResponse<TData>>,
) {
  const { queryKey, staleTime, gcTime } = { ...DEFAULT_CONFIG, ...config };

  return function useEntityListQuery(
    input?: TInput,
    options?: EntityQueryOptions<PaginatedResponse<TData>>,
  ) {
    const queryInput = {
      pagination: options?.pagination || { page: 1, pageSize: 20 },
      sort: options?.sort,
      filter: options?.filter,
      ...input,
    } as TInput;

    return useQuery({
      queryKey: [queryKey, "list", queryInput],
      queryFn: () => queryFn(queryInput),
      staleTime,
      gcTime,
      ...options,
    });
  };
}

/**
 * Create an infinite query hook for scroll-based pagination
 */
export function createEntityInfiniteQuery<
  TData,
  TInput extends Record<string, unknown> = Record<string, unknown>,
>(
  config: EntityHookConfig,
  queryFn: (input: TInput & { page: number }) => Promise<PaginatedResponse<TData>>,
) {
  const { queryKey, staleTime, gcTime } = { ...DEFAULT_CONFIG, ...config };

  return function useEntityInfiniteQuery(
    input?: Omit<TInput, "page">,
    options?: Omit<EntityQueryOptions<PaginatedResponse<TData>>, "pagination">,
  ) {
    return useInfiniteQuery({
      queryKey: [queryKey, "infinite", input],
      queryFn: ({ pageParam }) =>
        queryFn({
          ...input,
          page: pageParam,
          pageSize: options?.sort ? 20 : 20,
        } as TInput & { page: number }),
      initialPageParam: 1 as number,
      getNextPageParam: (lastPage) =>
        lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
      getPreviousPageParam: (firstPage) =>
        firstPage.meta.hasPrevPage ? firstPage.meta.page - 1 : undefined,
      staleTime,
      gcTime,
    });
  };
}

/**
 * Create a mutation hook with automatic cache invalidation
 */
export function createEntityMutation<TData, TInput, TContext = unknown>(
  config: EntityHookConfig,
  mutationFn: (input: TInput) => Promise<TData>,
  invalidationKeys?: string[][],
) {
  const { queryKey } = config;

  return function useEntityMutation(
    options?: EntityMutationOptions<TData, Error, TInput>,
  ) {
    const queryClient = useQueryClient();
    const { invalidateOnSuccess = true, additionalInvalidations = [] } = options || {};

    return useMutation({
      mutationFn,
      onSuccess: (data, variables, context) => {
        if (invalidateOnSuccess) {
          // Invalidate base query key
          queryClient.invalidateQueries({ queryKey: [queryKey] });

          // Invalidate additional keys
          const allInvalidations = [
            ...(invalidationKeys || []),
            ...additionalInvalidations,
          ];
          allInvalidations.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }

        options?.onSuccess?.(data, variables, context as TContext);
      },
      ...options,
    });
  };
}

/**
 * Create a delete mutation with cache removal
 */
export function createEntityDeleteMutation(
  config: EntityHookConfig,
  mutationFn: (id: string) => Promise<void>,
) {
  const { queryKey } = config;

  return function useEntityDeleteMutation(
    options?: EntityMutationOptions<void, Error, string>,
  ) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn,
      onSuccess: (_, id, context) => {
        // Remove the specific entity from cache
        queryClient.removeQueries({ queryKey: [queryKey, { id }] });

        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: [queryKey, "list"] });
        queryClient.invalidateQueries({ queryKey: [queryKey, "infinite"] });

        options?.onSuccess?.(undefined, id, context);
      },
      ...options,
    });
  };
}

/**
 * Create prefetch function for an entity query
 */
export function createEntityPrefetch<TData, TInput = { id: string }>(
  config: EntityHookConfig,
  queryFn: (input: TInput) => Promise<TData>,
) {
  const { queryKey, staleTime, gcTime } = { ...DEFAULT_CONFIG, ...config };

  return function prefetchEntity(
    queryClient: QueryClient,
    input: TInput,
  ) {
    return queryClient.prefetchQuery({
      queryKey: [queryKey, input],
      queryFn: () => queryFn(input),
      staleTime,
      gcTime,
    });
  };
}

/**
 * Create prefetch function for entity list query
 */
export function createEntityListPrefetch<
  TData,
  TInput extends Record<string, unknown> = Record<string, unknown>,
>(
  config: EntityHookConfig,
  queryFn: (input: TInput) => Promise<PaginatedResponse<TData>>,
) {
  const { queryKey, staleTime, gcTime } = { ...DEFAULT_CONFIG, ...config };

  return function prefetchEntityList(
    queryClient: QueryClient,
    input: TInput,
  ) {
    return queryClient.prefetchQuery({
      queryKey: [queryKey, "list", input],
      queryFn: () => queryFn(input),
      staleTime,
      gcTime,
    });
  };
}
`;
  }

  private getCacheUtils(): string {
    return `/**
 * Cache Utilities
 *
 * Helpers for managing React Query cache in entity hooks.
 */
import type { QueryClient } from "@tanstack/react-query";

/**
 * Invalidate all queries for an entity
 */
export function invalidateEntity(
  queryClient: QueryClient,
  entityKey: string,
): void {
  queryClient.invalidateQueries({ queryKey: [entityKey] });
}

/**
 * Invalidate list queries for an entity
 */
export function invalidateEntityList(
  queryClient: QueryClient,
  entityKey: string,
): void {
  queryClient.invalidateQueries({ queryKey: [entityKey, "list"] });
  queryClient.invalidateQueries({ queryKey: [entityKey, "infinite"] });
}

/**
 * Invalidate a specific entity by ID
 */
export function invalidateEntityById(
  queryClient: QueryClient,
  entityKey: string,
  id: string,
): void {
  queryClient.invalidateQueries({ queryKey: [entityKey, { id }] });
}

/**
 * Remove a specific entity from cache
 */
export function removeEntityFromCache(
  queryClient: QueryClient,
  entityKey: string,
  id: string,
): void {
  queryClient.removeQueries({ queryKey: [entityKey, { id }] });
}

/**
 * Set entity data directly in cache
 */
export function setEntityInCache<TData>(
  queryClient: QueryClient,
  entityKey: string,
  id: string,
  data: TData,
): void {
  queryClient.setQueryData([entityKey, { id }], data);
}

/**
 * Get entity data from cache
 */
export function getEntityFromCache<TData>(
  queryClient: QueryClient,
  entityKey: string,
  id: string,
): TData | undefined {
  return queryClient.getQueryData<TData>([entityKey, { id }]);
}

/**
 * Update entity in cache with partial data
 */
export function updateEntityInCache<TData extends Record<string, unknown>>(
  queryClient: QueryClient,
  entityKey: string,
  id: string,
  updater: Partial<TData> | ((old: TData | undefined) => TData | undefined),
): void {
  queryClient.setQueryData<TData>([entityKey, { id }], (old) => {
    if (typeof updater === "function") {
      return updater(old);
    }
    if (!old) return undefined;
    return { ...old, ...updater };
  });
}

/**
 * Optimistic update helper
 */
export function createOptimisticUpdate<TData>(
  queryClient: QueryClient,
  entityKey: string,
  id: string,
) {
  // Store previous value for rollback
  const previousValue = queryClient.getQueryData<TData>([entityKey, { id }]);

  return {
    /**
     * Apply optimistic update
     */
    apply: (newData: TData): void => {
      queryClient.setQueryData([entityKey, { id }], newData);
    },

    /**
     * Rollback to previous value
     */
    rollback: (): void => {
      queryClient.setQueryData([entityKey, { id }], previousValue);
    },

    /**
     * Get the previous value
     */
    getPrevious: (): TData | undefined => previousValue,
  };
}

/**
 * Cancel ongoing queries for an entity
 */
export async function cancelEntityQueries(
  queryClient: QueryClient,
  entityKey: string,
): Promise<void> {
  await queryClient.cancelQueries({ queryKey: [entityKey] });
}

/**
 * Batch invalidation helper
 */
export function invalidateMultiple(
  queryClient: QueryClient,
  keys: string[][],
): void {
  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: key });
  });
}
`;
  }

  private getHookGenerator(): string {
    return `/**
 * Hook Generator
 *
 * Utilities to generate typed hooks from ORPC procedures.
 * This provides a higher-level abstraction over the factory functions.
 */
import type { QueryClient } from "@tanstack/react-query";
import {
  createEntityQuery,
  createEntityListQuery,
  createEntityInfiniteQuery,
  createEntityMutation,
  createEntityDeleteMutation,
  createEntityPrefetch,
  createEntityListPrefetch,
} from "./factory";
import type {
  EntityHookConfig,
  PaginatedResponse,
  EntityActions,
} from "./types";

/**
 * ORPC procedure types (simplified for generation)
 */
interface ORPCProcedure<TInput, TOutput> {
  call: (input: TInput) => Promise<TOutput>;
}

/**
 * Entity CRUD procedures
 */
export interface EntityProcedures<
  TEntity,
  TListInput extends Record<string, unknown>,
  TCreateInput,
  TUpdateInput extends { id: string },
> {
  findById: ORPCProcedure<{ id: string }, TEntity>;
  list: ORPCProcedure<TListInput, PaginatedResponse<TEntity>>;
  create: ORPCProcedure<TCreateInput, TEntity>;
  update: ORPCProcedure<TUpdateInput, TEntity>;
  delete: ORPCProcedure<{ id: string }, void>;
}

/**
 * Generate a complete set of hooks for an entity
 */
export function generateEntityHooks<
  TEntity extends { id: string },
  TListInput extends Record<string, unknown>,
  TCreateInput,
  TUpdateInput extends { id: string },
>(
  config: EntityHookConfig,
  procedures: EntityProcedures<TEntity, TListInput, TCreateInput, TUpdateInput>,
) {
  // Query hooks
  const useEntity = createEntityQuery<TEntity>(
    config,
    (input: { id: string }) => procedures.findById.call(input),
  );

  const useEntityList = createEntityListQuery<TEntity, TListInput>(
    config,
    (input: TListInput) => procedures.list.call(input),
  );

  const useEntityInfinite = createEntityInfiniteQuery<TEntity, TListInput>(
    config,
    (input: TListInput & { page: number }) =>
      procedures.list.call(input as TListInput),
  );

  // Mutation hooks
  const useCreateEntity = createEntityMutation<TEntity, TCreateInput>(
    config,
    (input: TCreateInput) => procedures.create.call(input),
  );

  const useUpdateEntity = createEntityMutation<TEntity, TUpdateInput>(
    config,
    (input: TUpdateInput) => procedures.update.call(input),
  );

  const useDeleteEntity = createEntityDeleteMutation(
    config,
    (id: string) => procedures.delete.call({ id }),
  );

  // Prefetch functions
  const prefetchEntity = createEntityPrefetch<TEntity>(
    config,
    (input: { id: string }) => procedures.findById.call(input),
  );

  const prefetchEntityList = createEntityListPrefetch<TEntity, TListInput>(
    config,
    (input: TListInput) => procedures.list.call(input),
  );

  // Composite hooks
  function useEntityActions(): EntityActions<TEntity, TCreateInput, TUpdateInput> {
    const createMutation = useCreateEntity();
    const updateMutation = useUpdateEntity();
    const deleteMutation = useDeleteEntity();

    return {
      create: createMutation.mutate,
      createAsync: createMutation.mutateAsync,
      update: updateMutation.mutate,
      updateAsync: updateMutation.mutateAsync,
      delete: (id: string) => deleteMutation.mutate(id),
      deleteAsync: (id: string) => deleteMutation.mutateAsync(id),
      isLoading: {
        create: createMutation.isPending,
        update: updateMutation.isPending,
        delete: deleteMutation.isPending,
      },
      errors: {
        create: createMutation.error,
        update: updateMutation.error,
        delete: deleteMutation.error,
      },
    };
  }

  return {
    // Query hooks
    useEntity,
    useEntityList,
    useEntityInfinite,

    // Mutation hooks
    useCreateEntity,
    useUpdateEntity,
    useDeleteEntity,

    // Composite hooks
    useEntityActions,

    // Prefetch functions
    prefetchEntity,
    prefetchEntityList,
  };
}

/**
 * Type helper for generated hooks
 */
export type GeneratedEntityHooks<
  TEntity extends { id: string },
  TListInput extends Record<string, unknown>,
  TCreateInput,
  TUpdateInput extends { id: string },
> = ReturnType<
  typeof generateEntityHooks<TEntity, TListInput, TCreateInput, TUpdateInput>
>;
`;
  }

  private getHooksIndex(): string {
    return `/**
 * Entity Hooks
 *
 * Auto-generated React Query hooks utilities.
 */

// Types
export type {
  PaginationOptions,
  SortOptions,
  EntityQueryOptions,
  EntityMutationOptions,
  PaginatedResponse,
  InfinitePageParam,
  EntityHookConfig,
  EntityActions,
} from "./types";

// Factory functions
export {
  createEntityQuery,
  createEntityListQuery,
  createEntityInfiniteQuery,
  createEntityMutation,
  createEntityDeleteMutation,
  createEntityPrefetch,
  createEntityListPrefetch,
} from "./factory";

// Cache utilities
export {
  invalidateEntity,
  invalidateEntityList,
  invalidateEntityById,
  removeEntityFromCache,
  setEntityInCache,
  getEntityFromCache,
  updateEntityInCache,
  createOptimisticUpdate,
  cancelEntityQueries,
  invalidateMultiple,
} from "./cache";

// Generator
export {
  generateEntityHooks,
  type EntityProcedures,
  type GeneratedEntityHooks,
} from "./generator";
`;
  }

  private getExampleUserHooks(): string {
    return `/**
 * User Entity Hooks
 *
 * Example implementation of entity hooks for User.
 * This demonstrates the ORPC Client Hooks Pattern.
 */
"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";

// Types inferred from ORPC contracts
type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserListInput = {
  pagination?: { page?: number; pageSize?: number };
  sort?: { field: string; direction: "asc" | "desc" };
  filter?: Partial<Pick<User, "email" | "name">>;
};

type CreateUserInput = {
  email: string;
  name?: string;
  password: string;
};

type UpdateUserInput = {
  id: string;
  email?: string;
  name?: string;
};

// Configuration
const USER_QUERY_KEY = "users";
const DEFAULT_STALE_TIME = 1000 * 60; // 1 minute
const DEFAULT_GC_TIME = 1000 * 60 * 5; // 5 minutes

/**
 * Query hook for fetching a single user
 */
export function useUser(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [USER_QUERY_KEY, { id: userId }],
    queryFn: () => orpc.user.findById.call({ id: userId }),
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

/**
 * Query hook for fetching users list with pagination
 */
export function useUsers(options?: {
  pagination?: { page?: number; pageSize?: number };
  sort?: { field: keyof User; direction: "asc" | "desc" };
  filter?: Partial<Pick<User, "email" | "name">>;
  enabled?: boolean;
}) {
  const input: UserListInput = {
    pagination: {
      page: options?.pagination?.page || 1,
      pageSize: options?.pagination?.pageSize || 20,
    },
    sort: options?.sort || { field: "name", direction: "asc" },
    filter: options?.filter,
  };

  return useQuery({
    queryKey: [USER_QUERY_KEY, "list", input],
    queryFn: () => orpc.user.list.call(input),
    enabled: options?.enabled ?? true,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

/**
 * Infinite query hook for scroll-based pagination
 */
export function useUsersInfinite(options?: {
  pageSize?: number;
  sort?: { field: keyof User; direction: "asc" | "desc" };
  filter?: Partial<Pick<User, "email" | "name">>;
}) {
  return useInfiniteQuery({
    queryKey: [USER_QUERY_KEY, "infinite", options],
    queryFn: ({ pageParam }) =>
      orpc.user.list.call({
        pagination: { page: pageParam, pageSize: options?.pageSize || 20 },
        sort: options?.sort,
        filter: options?.filter,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

/**
 * Mutation hook for creating a user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => orpc.user.create.call(input),
    onSuccess: (newUser) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, "infinite"] });

      toast.success(\`User "\${newUser.name || newUser.email}" created successfully\`);
    },
    onError: (error: Error) => {
      toast.error(\`Failed to create user: \${error.message}\`);
    },
  });
}

/**
 * Mutation hook for updating a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserInput) => orpc.user.update.call(input),
    onSuccess: (updatedUser, variables) => {
      // Invalidate specific user query
      queryClient.invalidateQueries({
        queryKey: [USER_QUERY_KEY, { id: variables.id }],
      });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, "list"] });

      toast.success(\`User "\${updatedUser.name || updatedUser.email}" updated successfully\`);
    },
    onError: (error: Error) => {
      toast.error(\`Failed to update user: \${error.message}\`);
    },
  });
}

/**
 * Mutation hook for deleting a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orpc.user.delete.call({ id }),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: [USER_QUERY_KEY, { id }] });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, "infinite"] });

      toast.success("User deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(\`Failed to delete user: \${error.message}\`);
    },
  });
}

/**
 * Composite hook for user actions
 */
export function useUserActions() {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  return {
    createUser: createUser.mutate,
    createUserAsync: createUser.mutateAsync,
    updateUser: updateUser.mutate,
    updateUserAsync: updateUser.mutateAsync,
    deleteUser: deleteUser.mutate,
    deleteUserAsync: deleteUser.mutateAsync,
    isLoading: {
      create: createUser.isPending,
      update: updateUser.isPending,
      delete: deleteUser.isPending,
    },
    errors: {
      create: createUser.error,
      update: updateUser.error,
      delete: deleteUser.error,
    },
  };
}

/**
 * Prefetch user data
 */
export function prefetchUser(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  return queryClient.prefetchQuery({
    queryKey: [USER_QUERY_KEY, { id: userId }],
    queryFn: () => orpc.user.findById.call({ id: userId }),
    staleTime: DEFAULT_STALE_TIME,
  });
}

/**
 * Prefetch users list
 */
export function prefetchUsers(
  queryClient: ReturnType<typeof useQueryClient>,
  input?: UserListInput,
) {
  const defaultInput: UserListInput = {
    pagination: { page: 1, pageSize: 20 },
    sort: { field: "name", direction: "asc" },
    ...input,
  };

  return queryClient.prefetchQuery({
    queryKey: [USER_QUERY_KEY, "list", defaultInput],
    queryFn: () => orpc.user.list.call(defaultInput),
    staleTime: DEFAULT_STALE_TIME,
  });
}

// Type exports
export type { User, UserListInput, CreateUserInput, UpdateUserInput };
`;
  }

  private getExampleUsage(): string {
    return `/**
 * Entity Hooks - Example Usage
 *
 * This file demonstrates how to use the generated entity hooks.
 */
"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  useUsers,
  useUser,
  useUsersInfinite,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUserActions,
  prefetchUser,
  prefetchUsers,
} from "@/hooks/useUsers";

/**
 * Example: Basic list with pagination
 */
export function UserListExample() {
  const { data, isLoading, error } = useUsers({
    pagination: { page: 1, pageSize: 10 },
    sort: { field: "name", direction: "asc" },
  });

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.data.map((user) => (
        <li key={user.id}>{user.name || user.email}</li>
      ))}
    </ul>
  );
}

/**
 * Example: Single user detail
 */
export function UserDetailExample({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
    </div>
  );
}

/**
 * Example: Infinite scroll
 */
export function InfiniteUsersExample() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUsersInfinite({ pageSize: 20 });

  const users = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}

/**
 * Example: Create user form
 */
export function CreateUserExample() {
  const { mutate: createUser, isPending } = useCreateUser();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createUser({
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      password: formData.get("password") as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="name" type="text" placeholder="Name" />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}

/**
 * Example: Update user
 */
export function UpdateUserExample({ userId }: { userId: string }) {
  const { data: user } = useUser(userId);
  const { mutate: updateUser, isPending } = useUpdateUser();

  const handleUpdate = () => {
    if (!user) return;
    updateUser({
      id: userId,
      name: \`\${user.name} (Updated)\`,
    });
  };

  return (
    <button onClick={handleUpdate} disabled={isPending}>
      {isPending ? "Updating..." : "Update User"}
    </button>
  );
}

/**
 * Example: Using composite actions hook
 */
export function UserActionsExample({ userId }: { userId: string }) {
  const { deleteUser, isLoading, errors } = useUserActions();

  return (
    <div>
      <button
        onClick={() => deleteUser(userId)}
        disabled={isLoading.delete}
      >
        {isLoading.delete ? "Deleting..." : "Delete User"}
      </button>
      {errors.delete && <p>Error: {errors.delete.message}</p>}
    </div>
  );
}

/**
 * Example: Prefetch on hover
 */
export function UserLinkWithPrefetch({ userId, name }: { userId: string; name: string }) {
  const queryClient = useQueryClient();

  return (
    <a
      href={\`/users/\${userId}\`}
      onMouseEnter={() => prefetchUser(queryClient, userId)}
    >
      {name}
    </a>
  );
}

/**
 * Example: Prefetch next page
 */
export function PaginatedUsersWithPrefetch() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useUsers({
    pagination: { page, pageSize: 20 },
  });

  const handleNextPage = () => {
    // Prefetch next page before navigation
    prefetchUsers(queryClient, {
      pagination: { page: page + 1, pageSize: 20 },
    });
    setPage(page + 1);
  };

  return (
    <div>
      {/* User list */}
      <button onClick={handleNextPage}>Next Page</button>
    </div>
  );
}

// Add React import for the last example
import React from "react";
`;
  }
}
