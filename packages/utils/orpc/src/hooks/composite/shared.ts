export type QueryResult<TData = unknown> = {
  data?: TData;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
  refetch?: () => void;
};

export type MutationResult<TVariables = unknown, TData = unknown> = {
  mutate?: (vars: TVariables) => void;
  mutateAsync?: (vars: TVariables) => Promise<TData>;
  isPending?: boolean;
  error?: Error | null;
  reset?: () => void;
};

export function getOptionalHook<THook>(
  hooks: Record<string, unknown>,
  name: string
): THook | undefined {
  return hooks[name] as THook | undefined;
}
