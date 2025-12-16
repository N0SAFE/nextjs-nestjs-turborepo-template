/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
import type { HTTPMethod } from "@orpc/contract";
import type { AnyContractBuilder, AnyContractProcedureOrBuilder } from "../utils/type-helpers";
import { getProcedureMeta, withMeta } from "../utils/type-helpers";

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
export type HasRouteMethodMeta<T> = ExtractRouteMethod<T> extends never ? false : true;

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
export type ExtractRouteMethod<T> = T extends { "~orpc": infer Orpc }
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
export type IsRouteBuilderGetMethod<T> = ExtractRouteMethod<T> extends HTTPMethod ? (Uppercase<ExtractRouteMethod<T>> extends "GET" ? true : false) : false;

/**
 * Check if the extracted method is a non-GET method (for mutation operations)
 * Only returns true if the contract has RouteBuilder metadata AND method is NOT GET
 */
export type IsRouteBuilderNonGetMethod<T> = ExtractRouteMethod<T> extends HTTPMethod ? (Uppercase<ExtractRouteMethod<T>> extends "GET" ? false : true) : false;

/**
 * Check if a procedure is a valid RouteBuilder query procedure.
 * Must have RouteBuilder metadata with GET method.
 */
export type IsRouteBuilderQuery<T> = IsRouteBuilderGetMethod<T> extends true ? (T extends { queryOptions: unknown } ? true : false) : false;

/**
 * Check if a procedure is a valid RouteBuilder mutation procedure.
 * Must have RouteBuilder metadata with non-GET method.
 */
export type IsRouteBuilderMutation<T> = IsRouteBuilderNonGetMethod<T> extends true ? (T extends { mutationOptions: unknown } ? true : false) : false;

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
export function createRouteMethodMeta<TMethod extends HTTPMethod>(method: TMethod): RouteMethodMeta<TMethod> {
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
export function hasRouteMethodMeta(procedure: AnyContractProcedureOrBuilder): boolean {
    const metaObj = getProcedureMeta(procedure) as Record<string, unknown> | undefined;
    
    if (!metaObj || typeof metaObj !== "object") return false;
  
    const routeMeta = metaObj[ROUTE_METHOD_META_KEY];
    if (!routeMeta || typeof routeMeta !== "object") return false;

    const routeMetaObj = routeMeta as Record<string, unknown>;
    const method = routeMetaObj.method;
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
export function getRouteMethod(procedure: AnyContractProcedureOrBuilder): HTTPMethod | undefined {
    if (!hasRouteMethodMeta(procedure)) {
        return undefined;
    }

    // Extract metadata using the helper from type-helpers
    const meta = getProcedureMeta(procedure) as Record<string, unknown> | undefined;
    if (!meta || typeof meta !== "object") return undefined;
    
    const routeMeta = meta[ROUTE_METHOD_META_KEY] as { method: HTTPMethod } | undefined;
    return routeMeta?.method;
}

/**
 * Apply HTTP method metadata to an ORPC builder with proper typing.
 *
 * This function is a wrapper around `withMeta` that specifically handles
 * route method metadata for the RouteBuilder discriminator pattern.
 * It ensures that contracts have the required metadata structure for the
 * hook generator to identify them as RouteBuilder-created contracts.
 *
 * @template TMethod - The HTTP method type (GET, POST, PUT, DELETE, PATCH)
 * @template TBuilder - The builder type (ContractBuilder or any procedure builder)
 *
 * @param method - The HTTP method for this contract (GET, POST, PUT, DELETE, PATCH)
 * @param builder - The ORPC builder to apply the method metadata to
 *
 * @returns The builder with route method metadata applied and properly typed
 *
 * @example
 * // Apply method metadata to oc builder
 * const typedBuilder = withRouteMethod("GET", oc);
 * const contract = typedBuilder
 *   .route({ method: "GET", path: "/my-path" })
 *   .input(myInput)
 *   .output(myOutput);
 *
 * // Apply to existing builder
 * const baseBuilder = oc.input(z.object({ id: z.string() }));
 * const withMethod = withRouteMethod("POST", baseBuilder);
 *
 * @remarks
 * This function uses the same metadata structure as RouteBuilder, ensuring
 * that contracts created with withRouteMethod() are indistinguishable from
 * RouteBuilder contracts at the type and runtime level.
 */
export function withRouteMethod<
    TMethod extends HTTPMethod,
    TBuilder extends AnyContractBuilder
>(
    method: TMethod,
    builder: TBuilder
) {
    const meta = createRouteMethodMeta(method);
    return withMeta(builder, meta);
}
