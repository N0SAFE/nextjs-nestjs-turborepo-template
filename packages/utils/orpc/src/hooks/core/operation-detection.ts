import type { AnySchema } from '@orpc/contract';
import { getEventIteratorSchemaDetails } from '@orpc/contract';
import { hasRouteMethodMeta, getRouteMethod } from '../../shared/route-method-meta';
import { isContractProcedure } from '../../utils/type-helpers';

/**
 * Extended operation type supporting all ORPC operation types.
 */
export type OperationType = 'query' | 'mutation' | 'streaming' | 'unsupported';

/**
 * Contract procedure metadata structure.
 */
export type ContractProcedureMetadata = {
  route?: {
    method?: string;
    path?: string;
  };
  meta?: Record<string, unknown>;
  outputSchema?: AnySchema;
  inputSchema?: AnySchema;
};

/**
 * Check if a schema represents an EventIterator output (streaming).
 */
export function isEventIteratorOutput(outputSchema: AnySchema | undefined): boolean {
  if (!outputSchema) return false;
  return getEventIteratorSchemaDetails(outputSchema) !== undefined;
}

/**
 * Detect operation type from RouteBuilder contract metadata.
 */
export function detectOperationType(
  procedure: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _procedureName?: string
): OperationType {
  if (!isContractProcedure(procedure)) {
    return 'unsupported';
  }

  if (!hasRouteMethodMeta(procedure)) {
    return 'unsupported';
  }

  const def = (procedure as { '~orpc'?: ContractProcedureMetadata })['~orpc'];

  if (def?.outputSchema && isEventIteratorOutput(def.outputSchema)) {
    return 'streaming';
  }

  const method = getRouteMethod(procedure);
  if (method) {
    return method.toUpperCase() === 'GET' ? 'query' : 'mutation';
  }

  return 'unsupported';
}

/**
 * Legacy name-based detection for backwards compatibility.
 * @deprecated Use detectOperationType with procedure object instead.
 */
export function detectOperationTypeByName(name: string): 'query' | 'mutation' {
  const mutationVerbs = ['create', 'update', 'delete', 'remove', 'add', 'set', 'toggle', 'check', 'verify', 'send'];
  const lowerName = name.toLowerCase();

  return mutationVerbs.some(verb => lowerName.includes(verb)) ? 'mutation' : 'query';
}

/**
 * Auto-detect which queries should be invalidated by a mutation.
 */
export function inferInvalidations(mutationName: string, availableQueries: string[]): string[] {
  const invalidations = new Set<string>();
  const lowerMutation = mutationName.toLowerCase();

  if (lowerMutation.includes('create') || lowerMutation.includes('delete') || lowerMutation.includes('update')) {
    availableQueries.forEach(query => {
      if (query.toLowerCase().includes('list') || query.toLowerCase().includes('count')) {
        invalidations.add(query);
      }
    });
  }

  if (lowerMutation.includes('update') || lowerMutation.includes('delete')) {
    availableQueries.forEach(query => {
      if (query.toLowerCase().includes('findbyid') || query.toLowerCase().includes('get')) {
        invalidations.add(query);
      }
    });
  }

  return Array.from(invalidations);
}
