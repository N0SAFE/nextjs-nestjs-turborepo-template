/**
 * Path parameter handling for route-builder-v2
 * Uses Standard Schema instead of Zod
 */

import type { AnySchema } from "./types";

/**
 * Schema shape type imported for PathParamBuilderWithExisting
 */
type SchemaShape = Record<string, AnySchema>;

/**
 * Represents a path parameter with its name and schema
 */
export type PathParam<TName extends string = string, TSchema extends AnySchema = AnySchema> = {
    __brand: "PathParam";
    name: TName;
    schema: TSchema;
    wildcard?: boolean;
};

/**
 * Convert PathParam array to Schema shape - recursive approach
 * This preserves specific types instead of collapsing to Record<string, AnySchema>
 */
export type ParamsToSchemaShape<TParams extends readonly PathParam[]> = TParams extends readonly []
    ? Record<never, never>
    : TParams extends readonly [infer First extends PathParam, ...infer Rest extends readonly PathParam[]]
      ? First extends PathParam<infer Name extends string, infer Schema extends AnySchema>
          ? { [K in Name]: Schema } & ParamsToSchemaShape<Rest>
          : never
      : never;

/**
 * Extract all PathParams from a tuple
 */
export type ExtractPathParams<T extends readonly unknown[]> = 
    T extends readonly [infer First, ...infer Rest] 
        ? (First extends PathParam ? [First, ...ExtractPathParams<Rest>] : ExtractPathParams<Rest>) 
        : [];

/**
 * PathParamBuilder - both a function to create params and a template tag
 */
export type PathParamBuilder = {
    <TName extends string, TSchema extends AnySchema>(name: TName, schema: TSchema): PathParam<TName, TSchema>;
    <TValues extends readonly unknown[]>(
        strings: TemplateStringsArray,
        ...values: TValues
    ): {
        template: string;
        params: ExtractPathParams<TValues>;
    };
    wildcard<TName extends string, TSchema extends AnySchema>(name: TName, schema: TSchema): PathParam<TName, TSchema>;
};

/**
 * PathParamBuilder with existing params exposed as properties
 * Allows syntax like: p`/${p.id}/${p('newParam', schema)}`
 * where `p.id` references an existing param
 */
export type PathParamBuilderWithExisting<TExistingParams extends SchemaShape> = PathParamBuilder & {
    [K in keyof TExistingParams]: PathParam<K & string, TExistingParams[K] & AnySchema>;
};

/**
 * Type guard for PathParam
 */
export function isPathParam(value: unknown): value is PathParam {
    return typeof value === "object" && value !== null && "__brand" in value && value.__brand === "PathParam" && "name" in value && "schema" in value;
}

/**
 * Create a PathParamBuilder instance
 * @param existingParams Optional object with existing params (from params schema shape) to expose as properties
 */
export function createPathParamBuilder<TExisting extends SchemaShape = Record<never, never>>(existingParams?: TExisting): PathParamBuilderWithExisting<TExisting> {
    // Function to create a path parameter
    function createParam<TName extends string, TSchema extends AnySchema>(name: TName, schema: TSchema): PathParam<TName, TSchema> {
        return {
            __brand: "PathParam",
            name,
            schema,
        } as PathParam<TName, TSchema>;
    }

    // Function to create a wildcard path parameter
    function createWildcard<TName extends string, TSchema extends AnySchema>(name: TName, schema: TSchema): PathParam<TName, TSchema> {
        return {
            __brand: "PathParam",
            name,
            schema,
            wildcard: true,
        } as PathParam<TName, TSchema>;
    }

    // Template tag function
    function templateTag<TValues extends readonly unknown[]>(strings: TemplateStringsArray, ...values: TValues): { template: string; params: ExtractPathParams<TValues> } {
        // Extract only PathParam values
        const params = values.filter(isPathParam) as unknown as ExtractPathParams<TValues>;

        // Build template string - uses OpenAPI-style {param} format for compatibility
        let template = "";
        strings.forEach((str, i) => {
            template += str;
            if (i < values.length) {
                const value = values[i];
                if (isPathParam(value)) {
                    // Use * prefix for wildcard params, {name} for regular params (OpenAPI style)
                    template += value.wildcard ? `*${value.name}` : `{${value.name}}`;
                } else {
                    template += String(value);
                }
            }
        });

        return { template, params };
    }

    // Merge both behaviors
    const builder = function <TArgs extends unknown[]>(...args: TArgs): PathParam | { template: string; params: readonly PathParam[] } {
        // If first arg is TemplateStringsArray, it's template tag usage
        if (args[0] && typeof args[0] === "object" && "raw" in args[0] && Array.isArray((args[0] as TemplateStringsArray).raw)) {
            return templateTag(args[0] as TemplateStringsArray, ...args.slice(1));
        }
        // Otherwise, it's createParam usage - assert types since we know the overload signature
        return createParam(args[0] as string, args[1] as AnySchema);
    } as PathParamBuilderWithExisting<TExisting>;

    // Add wildcard method
    builder.wildcard = createWildcard;

    // Add existing params as properties
    if (existingParams) {
        for (const [name, schema] of Object.entries(existingParams)) {
            (builder as unknown as Record<string, PathParam>)[name] = {
                __brand: "PathParam",
                name,
                schema,
            };
        }
    }

    return builder;
}
