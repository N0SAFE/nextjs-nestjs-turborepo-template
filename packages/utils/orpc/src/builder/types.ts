import type { HTTPMethod, HTTPPath } from "@orpc/contract";
import type { z } from "zod/v4";

/**
 * HTTP methods supported by ORPC routes
 */
export type HttpMethod = HTTPMethod;

/**
 * Route metadata for defining ORPC route characteristics
 * This matches the ORPC Route interface
 */
export type RouteMetadata = {
  method?: HTTPMethod;
  path?: HTTPPath;
  operationId?: string;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  tags?: readonly string[];
  successStatus?: number;
  successDescription?: string;
  inputStructure?: 'compact' | 'detailed';
  outputStructure?: 'compact' | 'detailed';
}

/**
 * Base entity schema type - any Zod object schema
 * Using `any` is intentional for dynamic schema manipulation
 */
 
export type EntitySchema = z.ZodObject;

/**
 * Extract the type from a Zod schema
 */
export type InferSchemaType<T extends z.ZodType> = z.infer<T>;

/**
 * Contract procedure builder state
 * Using `any` defaults is intentional for unconstrained generic defaults
 */
 
export type ContractProcedureState<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType
> = {
  route: RouteMetadata;
  input: TInput;
  output: TOutput;
}

/**
 * Custom modifier function type for chaining
 */
export type CustomModifier<TState, TResult = TState> = (
  state: TState
) => TResult;

/**
 * Pagination options for list operations
 */
export type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
  includeOffset?: boolean;
  includeCursor?: boolean;
}

/**
 * Sorting options for list operations
 */
export type SortingOptions = {
  fields: readonly string[];
  defaultField?: string;
  defaultDirection?: "asc" | "desc";
}

/**
 * Filtering options for list operations
 */
export type FilteringOptions = {
  fields?: Record<string, z.ZodType>;
  searchFields?: readonly string[];
}

/**
 * Standard operation types
 */
export type StandardOperation =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "list"
  | "count"
  | "search";

/**
 * Batch operation options
 */
export type BatchOptions = {
  maxBatchSize?: number;
  allowPartialSuccess?: boolean;
}

/**
 * Event iterator options for streaming
 */
export type EventIteratorOptions = {
  bufferSize?: number;
  timeoutMs?: number;
}
