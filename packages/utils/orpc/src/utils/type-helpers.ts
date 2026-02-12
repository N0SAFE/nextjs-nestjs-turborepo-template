/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Type utilities for inferring properties from ORPC builders and contracts.
 * These helpers provide type-safe access to ORPC's internal type system.
 * 
 * NOTE: This file requires `any` types to match ORPC's type constraints.
 * ORPC's ContractBuilder/ContractProcedure types use `any` as generic bounds
 * to accept any Zod schema type. Using `unknown` breaks ORPC's type system.
 */

import {
  type ContractProcedure,  type ContractBuilder,  type ContractProcedureBuilder,
  type ContractProcedureBuilderWithInput,
  type ContractProcedureBuilderWithOutput,
  type ContractProcedureBuilderWithInputOutput,
  type ContractRouterBuilder,
  type AnyContractProcedure,
} from "@orpc/contract";

/**
 * Union type of all possible ORPC contract builder types.
 * Includes base builder and all specialized builders (with input, output, or both).
 */
export type AnyContractBuilder =
  | ContractBuilder<any, any, any, any>
  | ContractProcedureBuilder<any, any, any, any>
  | ContractProcedureBuilderWithInput<any, any, any, any>
  | ContractProcedureBuilderWithOutput<any, any, any, any>
  | ContractProcedureBuilderWithInputOutput<any, any, any, any>;

/**
 * Union type representing any ORPC procedure or builder.
 * Can be used to accept both finalized procedures and builders in progress.
 */
export type AnyContractProcedureOrBuilder =
  | AnyContractProcedure
  | AnyContractBuilder;

/**
 * Type guard to check if a value is an ORPC ContractProcedure.
 * A ContractProcedure has the `~orpc` property with defined options.
 */
export function isContractProcedure(
  value: unknown
): value is ContractProcedure<any, any, any, any> {
  return (
    typeof value === "object" &&
    value !== null &&
    "~orpc" in value &&
    typeof value["~orpc"] === "object" &&
    value["~orpc"] !== null
  );
}

/**
 * Type guard to check if a value is an ORPC ContractProcedureBuilder.
 * Builders have the `~orpc` property and builder methods like `input`, `output`, etc.
 */
export function isContractBuilder(value: unknown): value is AnyContractBuilder {
  return (
    isContractProcedure(value) &&
    typeof value === "object" &&
    ("input" in value || "output" in value || "meta" in value)
  );
}

/**
 * Type guard to check if a value is a ContractRouterBuilder.
 * Router builders have the `~orpc` property with `errorMap` and the `router` method.
 */
export function isContractRouterBuilder(
  value: unknown
): value is ContractRouterBuilder<any, any> {
  return (
    typeof value === "object" &&
    value !== null &&
    "~orpc" in value &&
    typeof value["~orpc"] === "object" &&
    value["~orpc"] !== null &&
    "errorMap" in value["~orpc"] &&
    "router" in value
  );
}

/**
 * Extract the meta type from an ORPC procedure or builder.
 */
export type InferMeta<T extends AnyContractProcedureOrBuilder> =
  T extends ContractProcedure<any, any, any, infer TMeta> ? TMeta : never;

/**
 * Extract the input schema type from an ORPC procedure or builder.
 */
export type InferInputSchema<T extends AnyContractProcedureOrBuilder> =
  T extends ContractProcedure<infer TInputSchema, any, any, any>
    ? TInputSchema
    : never;

/**
 * Extract the output schema type from an ORPC procedure or builder.
 */
export type InferOutputSchema<T extends AnyContractProcedureOrBuilder> =
  T extends ContractProcedure<any, infer TOutputSchema, any, any>
    ? TOutputSchema
    : never;

/**
 * Extract the error map type from an ORPC procedure or builder.
 */
export type InferErrorMap<T extends AnyContractProcedureOrBuilder> =
  T extends ContractProcedure<any, any, infer TErrorMap, any>
    ? TErrorMap
    : never;

/**
 * Helper to get the meta property from an ORPC procedure at runtime.
 * Returns the meta object if the value is a valid procedure, undefined otherwise.
 * @template T - The procedure or builder type to infer meta from
 */
export function getProcedureMeta<T extends AnyContractProcedureOrBuilder>(
  procedure: T
): T extends ContractProcedure<any, any, any, infer TMeta> ? TMeta : undefined {
  if (!isContractProcedure(procedure)) {
    return undefined as T extends ContractProcedure<any, any, any, infer TMeta> ? TMeta : undefined;
  }
  return procedure["~orpc"].meta as T extends ContractProcedure<any, any, any, infer TMeta> ? TMeta : undefined;
}

/**
 * Helper to get the route property from an ORPC procedure at runtime.
 * Returns the route object if the value is a valid procedure, undefined otherwise.
 * @template T - The procedure or builder type to get route from
 */
export function getProcedureRoute<T extends AnyContractProcedureOrBuilder>(
  procedure: T
): T extends { "~orpc": { route: infer TRoute } } ? TRoute : undefined {
  if (!isContractProcedure(procedure)) {
    return undefined as T extends { "~orpc": { route: infer TRoute } } ? TRoute : undefined;
  }
  return procedure["~orpc"].route as T extends { "~orpc": { route: infer TRoute } } ? TRoute : undefined;
}

/**
 * Helper to get the error map from an ORPC procedure at runtime.
 * Returns the error map if the value is a valid procedure, undefined otherwise.
 * @template T - The procedure or builder type to infer error map from
 */
export function getProcedureErrorMap<T extends AnyContractProcedureOrBuilder>(
  procedure: T
): T extends ContractProcedure<any, any, infer TErrorMap, any> ? TErrorMap : undefined {
  if (!isContractProcedure(procedure)) {
    return undefined as T extends ContractProcedure<any, any, infer TErrorMap, any> ? TErrorMap : undefined;
  }
  return procedure["~orpc"].errorMap as T extends ContractProcedure<any, any, infer TErrorMap, any> ? TErrorMap : undefined;
}

/**
 * Helper to get the input schema from an ORPC procedure at runtime.
 * Returns the input schema if the value is a valid procedure, undefined otherwise.
 * @template T - The procedure or builder type to infer input schema from
 */
export function getProcedureInputSchema<T extends AnyContractProcedureOrBuilder>(
  procedure: T
): T extends ContractProcedure<infer TInputSchema, any, any, any> ? TInputSchema | undefined : undefined {
  if (!isContractProcedure(procedure)) {
    return undefined as T extends ContractProcedure<infer TInputSchema, any, any, any> ? TInputSchema | undefined : undefined;
  }
  return procedure["~orpc"].inputSchema as T extends ContractProcedure<infer TInputSchema, any, any, any> ? TInputSchema | undefined : undefined;
}

/**
 * Helper to get the output schema from an ORPC procedure at runtime.
 * Returns the output schema if the value is a valid procedure, undefined otherwise.
 * @template T - The procedure or builder type to infer output schema from
 */
export function getProcedureOutputSchema<T extends AnyContractProcedureOrBuilder>(
  procedure: T
): T extends ContractProcedure<any, infer TOutputSchema, any, any> ? TOutputSchema | undefined : undefined {
  if (!isContractProcedure(procedure)) {
    return undefined as T extends ContractProcedure<any, infer TOutputSchema, any, any> ? TOutputSchema | undefined : undefined;
  }
  return procedure["~orpc"].outputSchema as T extends ContractProcedure<any, infer TOutputSchema, any, any> ? TOutputSchema | undefined : undefined;
}

/**
 * Apply meta to a builder with proper typing.
 * ORPC's `.meta()` method doesn't properly retype the builder by default,
 * so this helper ensures the meta type is correctly inferred.
 * 
 * @template TBuilder - The builder type
 * @template TMeta - The meta object type
 * @param builder - The ORPC builder to add meta to
 * @param meta - The meta object to apply
 * @returns A new builder with the meta applied and properly typed
 * 
 * @example
 * const procedure = withMeta(
 *   oc.input(z.object({ id: z.string() })),
 *   { httpMethod: "GET", path: "/users/:id" }
 * );
 */
export function withMeta<
  TBuilder extends AnyContractBuilder,
  TMeta extends Record<string, any>
>(
  builder: TBuilder,
  meta: TMeta
): TBuilder extends ContractBuilder<infer TInputSchema, infer TOutputSchema, infer TErrorMap, any>
  ? ContractBuilder<TInputSchema, TOutputSchema, TErrorMap, TMeta>
  : TBuilder extends ContractProcedureBuilder<infer TInputSchema, infer TOutputSchema, infer TErrorMap, any>
  ? ContractProcedureBuilder<TInputSchema, TOutputSchema, TErrorMap, TMeta>
  : TBuilder extends ContractProcedureBuilderWithInput<infer TInputSchema, infer TOutputSchema, infer TErrorMap, any>
  ? ContractProcedureBuilderWithInput<TInputSchema, TOutputSchema, TErrorMap, TMeta>
  : TBuilder extends ContractProcedureBuilderWithOutput<infer TInputSchema, infer TOutputSchema, infer TErrorMap, any>
  ? ContractProcedureBuilderWithOutput<TInputSchema, TOutputSchema, TErrorMap, TMeta>
  : TBuilder extends ContractProcedureBuilderWithInputOutput<infer TInputSchema, infer TOutputSchema, infer TErrorMap, any>
  ? ContractProcedureBuilderWithInputOutput<TInputSchema, TOutputSchema, TErrorMap, TMeta>
  : never {
  // @ts-expect-error - TypeScript cannot narrow the builder type at runtime, but we know it has meta method
  return builder.meta(meta);
}
