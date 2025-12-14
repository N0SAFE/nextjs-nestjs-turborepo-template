import type { HTTPMethod } from "@orpc/contract";

/**
 * @fileoverview Mount method helper for ORPC contracts
 * 
 * This module provides a discriminator pattern for ORPC contracts created via RouteBuilder.
 * Only contracts that have been created using RouteBuilder (with this metadata injected)
 * will work with the hook generator. Hand-made ORPC contracts will NOT work.
 * 
 * The unique metadata key ensures that the hook generator can distinguish between:
 * - RouteBuilder-created contracts (with method metadata) → hooks are generated
 * - Hand-made contracts (without method metadata) → hooks are NOT generated
 */

/**
 * Unique metadata key for RouteBuilder-created contracts.
 * 
 * This key is intentionally complex to prevent accidental collisions with
 * user-defined metadata. It serves as a discriminator to ensure only
 * RouteBuilder-created contracts work with the hook generator.
 * 
 * @internal
 */
export const ROUTE_METHOD_META_KEY = "__orpc_route_builder_method__" as const;

/**
 * Type for the unique metadata key
 */
export type RouteMethodMetaKey = typeof ROUTE_METHOD_META_KEY;

/**
 * Metadata shape that RouteBuilder injects into contracts.
 * Contains the HTTP method for discriminating between query and mutation operations.
 * 
 * @example
 * ```typescript
 * // Shape of the metadata injected by RouteBuilder
 * {
 *   __orpc_route_builder_method__: {
 *     method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
 *   }
 * }
 * ```
 */
export type RouteMethodMeta<TMethod extends HTTPMethod = HTTPMethod> = {
  readonly [ROUTE_METHOD_META_KEY]: {
    readonly method: TMethod;
  };
};

/**
 * Type guard to check if a contract has RouteBuilder method metadata.
 * Used by the hook generator to determine if hooks should be generated.
 * 
 * This type handles both optional and required property forms since:
 * - Real RouteBuilder contracts may have optional markers
 * - Test mocks with `as const` have required properties
 * 
 * @example
 * ```typescript
 * type HasMeta = HasRouteMethodMeta<typeof myContract>; // true | false
 * ```
 */
export type HasRouteMethodMeta<T> =
  ExtractRouteMethod<T> extends never ? false : true;

/**
 * Extract the HTTP method from RouteBuilder contract metadata.
 * Returns `never` if the contract doesn't have the required metadata.
 * 
 * This type uses indexed access with NonNullable to handle both optional
 * and required property forms, as well as computed property keys.
 * 
 * @example
 * ```typescript
 * // For a RouteBuilder-created GET contract
 * type Method = ExtractRouteMethod<typeof getContract>; // "GET"
 * 
 * // For a hand-made contract without metadata
 * type NoMethod = ExtractRouteMethod<typeof handMadeContract>; // never
 * ```
 */
export type ExtractRouteMethod<T> =
  T extends { "~orpc": infer Orpc }
    ? Orpc extends { meta: infer Meta }
      ? Meta extends Record<RouteMethodMetaKey, infer RouteMeta>
        ? RouteMeta extends { method: infer M }
          ? M extends HTTPMethod
            ? M
            : never
          : never
        : never
      : never
    : never;

/**
 * Check if the extracted method is a GET method (for query operations)
 * Only returns true if the contract has RouteBuilder metadata AND method is GET
 */
export type IsRouteBuilderGetMethod<T> = ExtractRouteMethod<T> extends HTTPMethod
  ? Uppercase<ExtractRouteMethod<T>> extends "GET"
    ? true
    : false
  : false;

/**
 * Check if the extracted method is a non-GET method (for mutation operations)
 * Only returns true if the contract has RouteBuilder metadata AND method is NOT GET
 */
export type IsRouteBuilderNonGetMethod<T> = ExtractRouteMethod<T> extends HTTPMethod
  ? Uppercase<ExtractRouteMethod<T>> extends "GET"
    ? false
    : true
  : false;

/**
 * Check if a procedure is a valid RouteBuilder query procedure.
 * Must have RouteBuilder metadata with GET method.
 */
export type IsRouteBuilderQuery<T> = IsRouteBuilderGetMethod<T> extends true
  ? T extends { queryOptions: unknown }
    ? true
    : false
  : false;

/**
 * Check if a procedure is a valid RouteBuilder mutation procedure.
 * Must have RouteBuilder metadata with non-GET method.
 */
export type IsRouteBuilderMutation<T> = IsRouteBuilderNonGetMethod<T> extends true
  ? T extends { mutationOptions: unknown }
    ? true
    : false
  : false;

/**
 * Create the metadata object for a specific HTTP method.
 * This is used internally by RouteBuilder.build() to inject the method metadata.
 * 
 * @param method - The HTTP method to encode in the metadata
 * @returns The metadata object to pass to oc.$meta()
 * 
 * @example
 * ```typescript
 * const meta = createRouteMethodMeta("GET");
 * // { __orpc_route_builder_method__: { method: "GET" } }
 * ```
 */
export function createRouteMethodMeta<TMethod extends HTTPMethod>(
  method: TMethod
): RouteMethodMeta<TMethod> {
  return {
    [ROUTE_METHOD_META_KEY]: {
      method,
    },
  } as RouteMethodMeta<TMethod>;
}

/**
 * Runtime helper to check if a procedure has RouteBuilder method metadata.
 * Used by the hook generator at runtime to validate contracts.
 * 
 * @param procedure - The ORPC procedure to check
 * @returns true if the procedure has valid RouteBuilder method metadata
 * 
 * @example
 * ```typescript
 * if (hasRouteMethodMeta(procedure)) {
 *   const method = getRouteMethod(procedure);
 *   // Generate hooks based on method
 * } else {
 *   // Skip this procedure - not a RouteBuilder contract
 * }
 * ```
 */
export function hasRouteMethodMeta(procedure: unknown): boolean {
  if (!procedure || typeof procedure !== "object") return false;
  
  const def = (procedure as { "~orpc"?: Record<string, unknown> })["~orpc"];
  if (!def || typeof def !== "object") return false;
  
  const meta = (def as { meta?: Record<string, unknown> }).meta;
  if (!meta || typeof meta !== "object") return false;
  
  const routeMeta = meta[ROUTE_METHOD_META_KEY];
  if (!routeMeta || typeof routeMeta !== "object") return false;
  
  const method = (routeMeta as { method?: unknown }).method;
  return typeof method === "string" && method.length > 0;
}

/**
 * Runtime helper to extract the HTTP method from RouteBuilder contract metadata.
 * Returns undefined if the contract doesn't have the required metadata.
 * 
 * @param procedure - The ORPC procedure to extract the method from
 * @returns The HTTP method or undefined if not present
 * 
 * @example
 * ```typescript
 * const method = getRouteMethod(procedure);
 * if (method === "GET") {
 *   // This is a query operation
 * } else if (method) {
 *   // This is a mutation operation
 * } else {
 *   // Not a RouteBuilder contract
 * }
 * ```
 */
export function getRouteMethod(procedure: unknown): HTTPMethod | undefined {
  if (!procedure || typeof procedure !== "object") return undefined;
  
  const def = (procedure as { "~orpc"?: Record<string, unknown> })["~orpc"];
  if (!def || typeof def !== "object") return undefined;
  
  const meta = (def as { meta?: Record<string, unknown> }).meta;
  if (!meta || typeof meta !== "object") return undefined;
  
  const routeMeta = meta[ROUTE_METHOD_META_KEY];
  if (!routeMeta || typeof routeMeta !== "object") return undefined;
  
  const method = (routeMeta as { method?: unknown }).method;
  if (typeof method === "string" && method.length > 0) {
    return method as HTTPMethod;
  }
  
  return undefined;
}
