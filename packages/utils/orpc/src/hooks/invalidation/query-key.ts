import type { QueryClient } from '@tanstack/react-query';

type RouterProcedure = {
  queryKey?: ((opts: Record<string, unknown>) => unknown[]) | unknown[];
};

export function getProcedureQueryKey(
  router: Record<string, unknown>,
  procedureName: string,
  input: Record<string, unknown> = {}
): unknown[] | undefined {
  const procedure = router[procedureName] as RouterProcedure | undefined;
  if (!procedure?.queryKey) {
    return undefined;
  }

  if (typeof procedure.queryKey === 'function') {
    return procedure.queryKey({ input });
  }

  return procedure.queryKey;
}

export async function invalidateProcedure(
  queryClient: QueryClient,
  router: Record<string, unknown>,
  procedureName: string,
  input: Record<string, unknown> = {}
): Promise<void> {
  const queryKey = getProcedureQueryKey(router, procedureName, input);
  if (!queryKey) return;
  await queryClient.invalidateQueries({ queryKey });
}

export async function refetchProcedure(
  queryClient: QueryClient,
  router: Record<string, unknown>,
  procedureName: string,
  input: Record<string, unknown> = {}
): Promise<void> {
  const queryKey = getProcedureQueryKey(router, procedureName, input);
  if (!queryKey) return;
  await queryClient.refetchQueries({ queryKey });
}
