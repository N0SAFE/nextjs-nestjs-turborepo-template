import type { QueryClient } from '@tanstack/react-query';
import { invalidateProcedure } from './query-key';

/**
 * Auto-detect and execute invalidations based on mutation semantics.
 */
export async function autoInvalidate(
  queryClient: QueryClient,
  router: Record<string, unknown>,
  mutationName: string,
  variables: unknown
): Promise<void> {
  const lowerMutation = mutationName.toLowerCase();
  const typedVariables = variables as { id?: string } | null | undefined;

  if (lowerMutation.includes('create') || lowerMutation.includes('add')) {
    for (const name of Object.keys(router)) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('list') || lowerName.includes('count')) {
        await invalidateProcedure(queryClient, router, name);
      }
    }
  }

  if (lowerMutation.includes('update') || lowerMutation.includes('edit')) {
    for (const name of Object.keys(router)) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('list') || lowerName.includes('findbyid') || lowerName.includes('get')) {
        const input = (lowerName.includes('findbyid') || lowerName.includes('get')) && typedVariables?.id
          ? { id: typedVariables.id }
          : {};
        await invalidateProcedure(queryClient, router, name, input);
      }
    }
  }

  if (lowerMutation.includes('delete') || lowerMutation.includes('remove')) {
    for (const name of Object.keys(router)) {
      const input = (name.toLowerCase().includes('findbyid') || name.toLowerCase().includes('get')) && typedVariables?.id
        ? { id: typedVariables.id }
        : {};
      await invalidateProcedure(queryClient, router, name, input);
    }
  }
}
