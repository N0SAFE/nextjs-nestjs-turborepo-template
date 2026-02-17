/**
 * Core type definitions for route-builder-v2
 * Maximizes reuse of types from @orpc/contract and @orpc/shared
 */

import type { AnySchema, Route } from "@orpc/contract";

/**
 * Re-export commonly used ORPC types
 */
export type { 
    HTTPMethod, 
    HTTPPath, 
    AnySchema, 
    Route,
    InputStructure,
    OutputStructure,
    ErrorMap,
    ErrorMapItem,
    InferSchemaInput,
    InferSchemaOutput,
    ContractProcedure,
} from "@orpc/contract";

// Utility types (formerly from @orpc/shared)
export type IsEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Route metadata alias for backward compatibility
 */
export type RouteMetadata = Route;

/**
 * Custom modifier type for extending builder functionality
 */
export type CustomModifier<TInput = unknown, TOutput = unknown> = (schema: TInput) => TOutput;

/**
 * Contract procedure state
 */
export type ContractProcedureState = {
    input?: AnySchema;
    output?: AnySchema;
};

/**
 * Union tuple type - a tuple with at least 2 elements
 * Required for unionSchema which needs at least 2 schemas
 */
export type UnionTuple = readonly [AnySchema, AnySchema, ...AnySchema[]];

// ============================================================================
// LEGACY TYPES - Backward compatibility with V1 builder consumers
// ============================================================================

import type { z } from "zod/v4";

/**
 * HTTP method alias (V1 backward compat)
 */
export type HttpMethod = import("@orpc/contract").HTTPMethod;

/**
 * Base entity schema type
 */
export type EntitySchema = z.ZodObject;

/**
 * Extract the type from a Zod schema
 */
export type InferSchemaType<T extends z.ZodType> = z.infer<T>;

/**
 * Pagination options for list operations
 */
export type PaginationOptions = {
    defaultLimit?: number;
    maxLimit?: number;
    includeOffset?: boolean;
    includeCursor?: boolean;
};

/**
 * Sorting options for list operations
 */
export type SortingOptions = {
    fields: readonly string[];
    defaultField?: string;
    defaultDirection?: "asc" | "desc";
};

/**
 * Filtering options for list operations
 */
export type FilteringOptions = {
    fields?: Record<string, z.ZodType>;
    searchFields?: readonly string[];
};

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
};

/**
 * Event iterator options for streaming
 */
export type EventIteratorOptions = {
    bufferSize?: number;
    timeoutMs?: number;
};
