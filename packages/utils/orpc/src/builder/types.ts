import type { ContractRouter, ContractProcedure } from "@orpc/contract";
import type { z } from "zod/v4";

/**
 * HTTP methods supported by ORPC routes
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Route metadata for defining ORPC route characteristics
 */
export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  tags?: string[];
}

/**
 * Base entity schema type - any Zod object schema
 */
export type EntitySchema = z.ZodObject<any>;

/**
 * Extract the type from a Zod schema
 */
export type InferSchemaType<T extends z.ZodTypeAny> = z.infer<T>;

/**
 * Contract procedure builder state
 */
export interface ContractProcedureState<
  TInput extends z.ZodTypeAny = any,
  TOutput extends z.ZodTypeAny = any
> {
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
export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  includeOffset?: boolean;
  includeCursor?: boolean;
}

/**
 * Sorting options for list operations
 */
export interface SortingOptions {
  fields: readonly string[];
  defaultField?: string;
  defaultDirection?: "asc" | "desc";
}

/**
 * Filtering options for list operations
 */
export interface FilteringOptions {
  fields?: Record<string, z.ZodTypeAny>;
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
export interface BatchOptions {
  maxBatchSize?: number;
  allowPartialSuccess?: boolean;
}

/**
 * Event iterator options for streaming
 */
export interface EventIteratorOptions {
  bufferSize?: number;
  timeoutMs?: number;
}
