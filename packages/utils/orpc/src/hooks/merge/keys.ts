import type { QueryKeys } from './types';

export function extractRouterQueryKeys(router: Record<string, unknown>): QueryKeys {
  return (router as { queryKeys?: QueryKeys }).queryKeys ?? {};
}

export function extractCustomQueryKeys(custom: Record<string, unknown>): QueryKeys {
  return (custom as { keys?: QueryKeys }).keys ?? {};
}

export function mergeQueryKeys(routerKeys: QueryKeys, customKeys: QueryKeys): QueryKeys {
  return {
    ...routerKeys,
    ...customKeys,
  };
}
