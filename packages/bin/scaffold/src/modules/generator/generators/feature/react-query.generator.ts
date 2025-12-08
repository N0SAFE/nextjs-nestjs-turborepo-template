/**
 * React Query Generator
 *
 * Sets up TanStack Query (React Query) for data fetching and caching.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class ReactQueryGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "react-query",
    priority: 30,
    version: "1.0.0",
    description: "TanStack Query for data fetching and state management",
    dependencies: ["nextjs", "typescript"],
    contributesTo: ["package.json", "apps/web/src/app/layout.tsx"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    if (!this.hasPlugin(context, "nextjs")) {
      return [];
    }

    return [
      this.file("apps/web/src/lib/query/provider.tsx", this.getQueryProvider()),
      this.file("apps/web/src/lib/query/client.ts", this.getQueryClient()),
      this.file("apps/web/src/lib/query/index.ts", this.getQueryIndex()),
      this.file("apps/web/src/lib/query/hooks.ts", this.getQueryHooks()),
      this.file("apps/web/src/lib/query/keys.ts", this.getQueryKeys()),
    ];
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    if (!this.hasPlugin(context, "nextjs")) {
      return [];
    }

    return [
      { name: "@tanstack/react-query", version: "^5.50.0", type: "prod", target: "apps/web", pluginId: "react-query" },
      { name: "@tanstack/react-query-devtools", version: "^5.50.0", type: "dev", target: "apps/web", pluginId: "react-query" },
    ];
  }

  private getQueryProvider(): string {
    return `"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { createQueryClient } from "./client";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * React Query Provider with SSR support
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create client once per browser session
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
`;
  }

  private getQueryClient(): string {
    return `import { QueryClient, defaultShouldDehydrateQuery, isServer } from "@tanstack/react-query";

/**
 * Create Query Client with optimal defaults
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR: Don't retry on server, let errors propagate
        retry: isServer ? false : 3,
        
        // Data freshness
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
        
        // Refetch behavior
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
      dehydrate: {
        // Include pending queries in dehydration for SSR
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

// Browser client singleton
let browserClient: QueryClient | undefined;

/**
 * Get Query Client for browser (singleton)
 */
export function getQueryClient() {
  if (isServer) {
    // Always create a new client on server
    return createQueryClient();
  }

  // Create singleton for browser
  if (!browserClient) {
    browserClient = createQueryClient();
  }
  
  return browserClient;
}
`;
  }

  private getQueryIndex(): string {
    return `/**
 * React Query exports
 */
export { QueryProvider } from "./provider";
export { createQueryClient, getQueryClient } from "./client";
export * from "./hooks";
export * from "./keys";
`;
  }

  private getQueryHooks(): string {
    return `"use client";

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

/**
 * Custom hooks built on React Query
 */

/**
 * Hook for data fetching with automatic error handling
 */
export function useFetch<TData, TError = Error>(
  key: string | string[],
  fetcher: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: fetcher,
    ...options,
  });
}

/**
 * Hook for mutations with optimistic updates
 */
export function useMutate<TData, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  return useMutation({
    mutationFn,
    ...options,
  });
}

/**
 * Hook for invalidating queries
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidate: (key: string | string[]) => {
      return queryClient.invalidateQueries({
        queryKey: Array.isArray(key) ? key : [key],
      });
    },
    invalidateAll: () => {
      return queryClient.invalidateQueries();
    },
    reset: (key: string | string[]) => {
      return queryClient.resetQueries({
        queryKey: Array.isArray(key) ? key : [key],
      });
    },
  };
}

/**
 * Hook for prefetching data
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  
  return <TData>(
    key: string | string[],
    fetcher: () => Promise<TData>,
    staleTime?: number
  ) => {
    return queryClient.prefetchQuery({
      queryKey: Array.isArray(key) ? key : [key],
      queryFn: fetcher,
      staleTime,
    });
  };
}

/**
 * Hook for setting query data optimistically
 */
export function useOptimisticUpdate<TData>() {
  const queryClient = useQueryClient();
  
  return {
    setData: (key: string | string[], updater: TData | ((old: TData | undefined) => TData)) => {
      queryClient.setQueryData(Array.isArray(key) ? key : [key], updater);
    },
    getData: (key: string | string[]): TData | undefined => {
      return queryClient.getQueryData(Array.isArray(key) ? key : [key]);
    },
    cancelQueries: async (key: string | string[]) => {
      await queryClient.cancelQueries({ queryKey: Array.isArray(key) ? key : [key] });
    },
  };
}
`;
  }

  private getQueryKeys(): string {
    return `/**
 * Query Key Factory
 * 
 * Centralized query key management for consistent cache invalidation
 */

export const queryKeys = {
  // User queries
  users: {
    all: ["users"] as const,
    list: (params?: { page?: number; limit?: number }) => [...queryKeys.users.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
    me: () => [...queryKeys.users.all, "me"] as const,
  },

  // Health/Status
  health: {
    all: ["health"] as const,
    status: () => [...queryKeys.health.all, "status"] as const,
  },

  // Generic factory for custom domains
  create: <T extends string>(domain: T) => ({
    all: [domain] as const,
    list: (params?: Record<string, unknown>) => [domain, "list", params] as const,
    detail: (id: string) => [domain, "detail", id] as const,
  }),
} as const;

export type QueryKeys = typeof queryKeys;

/**
 * Helper to create query keys for a specific entity
 */
export function createEntityKeys<T extends string>(entity: T) {
  return {
    all: [entity] as const,
    lists: () => [entity, "list"] as const,
    list: (filters?: Record<string, unknown>) => [entity, "list", filters] as const,
    details: () => [entity, "detail"] as const,
    detail: (id: string) => [entity, "detail", id] as const,
  } as const;
}
`;
  }
}
