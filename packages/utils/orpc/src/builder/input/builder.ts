/**
 * Input builders for route-builder-v2
 * Handles detailed input structure: { params, query, body, headers }
 * Uses Standard Schema instead of Zod
 */

import type { AnySchema } from "../../shared/types";
import type { ObjectSchema, VoidSchema, SchemaShape, OptionalSchema, ShouldBeOptional } from "../../shared/standard-schema-helpers";
import { emptyObjectSchema as createEmptyObjectSchema, voidSchema as createVoidSchema, optionalSchema, objectSchema } from "../../shared/standard-schema-helpers";
import { AsyncIteratorClass, eventIterator } from "@orpc/contract";
import type { Schema } from "@orpc/contract";
import type { PathParam, PathParamBuilderWithExisting, ParamsToSchemaShape } from "../core/params-builder";
import { createPathParamBuilder } from "../core/params-builder";
import { ProxyBuilderBase } from "../core/proxy-builder.base";
import { s } from "../../standard/base/schema";

/**
 * Query builder - provides schema modification methods for query parameters
 */
export class QueryBuilder<TQuery extends AnySchema, TParams extends AnySchema, TBody extends AnySchema, THeaders extends AnySchema, TEntitySchema extends AnySchema> {
    constructor(
        private _parent: DetailedInputBuilder<TParams, TQuery, TBody, THeaders, TEntitySchema>,
        private _schema: TQuery,
    ) {}

    /**
     * Modify the query schema
     */
    schema<TNewQuery extends AnySchema>(modifier: (schema: TQuery) => TNewQuery): DetailedInputBuilder<TParams, TNewQuery, TBody, THeaders, TEntitySchema> {
        const newSchema = modifier(this._schema);
        return new DetailedInputBuilder(this._parent.$params, newSchema, this._parent.$body, this._parent.$headers, this._parent.$entitySchema, this._parent._pendingPath);
    }
}

/**
 * Params builder - provides schema modification methods for path parameters
 * Note: Params are typically defined by pathWithParams, this can only modify them
 */
export class ParamsBuilder<TParams extends AnySchema, TQuery extends AnySchema, TBody extends AnySchema, THeaders extends AnySchema, TEntitySchema extends AnySchema> {
    constructor(
        private _parent: DetailedInputBuilder<TParams, TQuery, TBody, THeaders, TEntitySchema>,
        private _schema: TParams,
    ) {}

    /**
     * Modify the params schema
     */
    schema<TNewParams extends AnySchema>(modifier: (schema: TParams) => TNewParams): DetailedInputBuilder<TNewParams, TQuery, TBody, THeaders, TEntitySchema> {
        const newSchema = modifier(this._schema);
        return new DetailedInputBuilder(newSchema, this._parent.$query, this._parent.$body, this._parent.$headers, this._parent.$entitySchema, this._parent._pendingPath);
    }
}

/**
 * Body builder - provides schema modification methods for request body
 */
export class BodyBuilder<TBody extends AnySchema, TParams extends AnySchema, TQuery extends AnySchema, THeaders extends AnySchema, TEntitySchema extends AnySchema> {
    constructor(
        private _parent: DetailedInputBuilder<TParams, TQuery, TBody, THeaders, TEntitySchema>,
        private _schema: TBody,
    ) {}

    /**
     * Modify the body schema
     */
    schema<TNewBody extends AnySchema>(modifier: (schema: TBody) => TNewBody): DetailedInputBuilder<TParams, TQuery, TNewBody, THeaders, TEntitySchema> {
        const newSchema = modifier(this._schema);
        return new DetailedInputBuilder(this._parent.$params, this._parent.$query, newSchema, this._parent.$headers, this._parent.$entitySchema, this._parent._pendingPath);
    }
}

/**
 * Headers builder - provides schema modification methods for request headers
 */
export class HeadersBuilder<THeaders extends AnySchema, TParams extends AnySchema, TQuery extends AnySchema, TBody extends AnySchema, TEntitySchema extends AnySchema> {
    constructor(
        private _parent: DetailedInputBuilder<TParams, TQuery, TBody, THeaders, TEntitySchema>,
        private _schema: THeaders,
    ) {}

    /**
     * Modify the headers schema
     */
    schema<TNewHeaders extends AnySchema>(modifier: (schema: THeaders) => TNewHeaders): DetailedInputBuilder<TParams, TQuery, TBody, TNewHeaders, TEntitySchema> {
        const newSchema = modifier(this._schema);
        return new DetailedInputBuilder(this._parent.$params, this._parent.$query, this._parent.$body, newSchema, this._parent.$entitySchema, this._parent._pendingPath);
    }
}

type BuiltDetailedInputSchema<TParams extends AnySchema, TQuery extends AnySchema, TBody extends AnySchema, THeaders extends AnySchema> = ObjectSchema<{
    params: ShouldBeOptional<TParams> extends true ? OptionalSchema<TParams> : TParams;
    query: ShouldBeOptional<TQuery> extends true ? OptionalSchema<TQuery> : TQuery;
    body: ShouldBeOptional<TBody> extends true ? OptionalSchema<TBody> : TBody;
    headers: ShouldBeOptional<THeaders> extends true ? OptionalSchema<THeaders> : THeaders;
}>;

type IsEmptyObjectSchemaType<T extends AnySchema> = T extends ObjectSchema<infer S extends SchemaShape> ? (keyof S extends never ? true : false) : false;

export type DetailedInputBuilderSchema<TParams extends AnySchema, TQuery extends AnySchema, TBody extends AnySchema, THeaders extends AnySchema> =
    IsEmptyObjectSchemaType<TParams> extends true
        ? IsEmptyObjectSchemaType<TQuery> extends true
            ? IsEmptyObjectSchemaType<THeaders> extends true
                ? TBody
                : BuiltDetailedInputSchema<TParams, TQuery, TBody, THeaders>
            : BuiltDetailedInputSchema<TParams, TQuery, TBody, THeaders>
        : BuiltDetailedInputSchema<TParams, TQuery, TBody, THeaders>;

/**
 * Detailed input builder that handles input structure as:
 * { params, query, body, headers }
 *
 * Each field has its own builder that exposes the schema for direct manipulation.
 *
 * @example
 * ```typescript
 * inputBuilder(builder => builder
 *   .body(entitySchema)
 *   .query(q => q.schema(s => extendSchema(s, { limit: numberSchema })))
 *   .params(p => p.schema(s => extendSchema(s, { userId: stringSchema })))
 * )
 * ```
 */
export class DetailedInputBuilder<
    TParams extends AnySchema = VoidSchema,
    TQuery extends AnySchema = VoidSchema,
    TBody extends AnySchema = VoidSchema,
    THeaders extends AnySchema = VoidSchema,
    TEntitySchema extends AnySchema = VoidSchema,
> extends ProxyBuilderBase<DetailedInputBuilderSchema<TParams, TQuery, TBody, THeaders>> {
    public readonly $params: TParams;
    public readonly $query: TQuery;
    public readonly $body: TBody;
    public readonly $headers: THeaders;
    public readonly $entitySchema: TEntitySchema;
    /** @internal Path to be applied by RouteBuilder when using template literal params */
    public _pendingPath?: string;

    constructor(params: TParams, query: TQuery, body: TBody, headers: THeaders, entitySchema?: TEntitySchema, pendingPath?: string) {
        super();
        this.$params = params;
        this.$query = query;
        this.$body = body;
        this.$headers = headers;
        // Type assertion necessary: VoidSchema may not be compatible with generic TEntitySchema
        this.$entitySchema = (entitySchema ?? createVoidSchema()) as TEntitySchema;
        this._pendingPath = pendingPath;
    }

    /**
     * Returns either:
     * - direct body schema (when params/query/headers are still empty defaults), or
     * - detailed object schema with params/query/body/headers.
     */
    get schema(): DetailedInputBuilderSchema<TParams, TQuery, TBody, THeaders> {
        if (this._isDirectBodySchemaMode()) {
            return this.$body as DetailedInputBuilderSchema<TParams, TQuery, TBody, THeaders>;
        }
        return this._build() as DetailedInputBuilderSchema<TParams, TQuery, TBody, THeaders>;
    }

    private _isDirectBodySchemaMode(): boolean {
        return isEmptyObjectSchema(this.$params) && isEmptyObjectSchema(this.$query) && isEmptyObjectSchema(this.$headers);
    }

    /**
     * Access to the entity schema for use in body modifications
     */
    get entitySchema(): TEntitySchema {
        return this.$entitySchema;
    }

    /**
     * Access the raw body schema being built
     * Useful for builder pattern to return the body schema directly without detailed wrapping
     *
     * @example
     * ```typescript
     * .input(b => b.body(userSchema).raw)
     * // Returns the body schema directly without wrapping in detailed structure
     * ```
     */
    get raw(): TBody {
        return this.$body;
    }

    /**
     * Body accessor that supports both callable and property access patterns
     *
     * Usage patterns:
     * 1. Direct schema: `.body(schema)`
     * 2. Builder callback: `.body(b => b.schema(s => s ...))`
     * 3. Streamed: `.body.streamed(schema)` - wraps schema in EventIterator for streaming
     *
     * @example
     * ```typescript
     * // Direct schema
     * .body(userSchema)
     *
     * // Builder callback
     * .body(b => b.schema(s => transformSchema(s)))
     *
     * // Streamed body
     * .body.streamed(chunkSchema)
     * ```
     */
    get body() {
        // Create callable that handles both schema and builder callback
        type BodyCallable = {
            <TNewBody extends AnySchema>(
                builder: (b: BodyBuilder<TBody, TParams, TQuery, THeaders, TEntitySchema>) => DetailedInputBuilder<TParams, TQuery, TNewBody, THeaders, TEntitySchema>,
            ): DetailedInputBuilder<TParams, TQuery, TNewBody, THeaders, TEntitySchema>;
            <TNewBody extends AnySchema>(schema: TNewBody): DetailedInputBuilder<TParams, TQuery, TNewBody, THeaders, TEntitySchema>;
            streamed: <TYieldIn, TYieldOut, TReturnIn = unknown, TReturnOut = unknown>(
                yields: Schema<TYieldIn, TYieldOut>,
                returns?: Schema<TReturnIn, TReturnOut>,
            ) => DetailedInputBuilder<TParams, TQuery, Schema<AsyncIteratorObject<TYieldIn, TReturnIn, void>, AsyncIteratorClass<TYieldOut, TReturnOut, void>>, THeaders, TEntitySchema>;
        };

        const callable = (<TNewBody extends AnySchema>(
            schemaOrBuilder: TNewBody | ((b: BodyBuilder<TBody, TParams, TQuery, THeaders, TEntitySchema>) => DetailedInputBuilder<TParams, TQuery, TNewBody, THeaders, TEntitySchema>),
        ): DetailedInputBuilder<TParams, TQuery, TNewBody, THeaders, TEntitySchema> => {
            if (typeof schemaOrBuilder === "function") {
                return schemaOrBuilder(new BodyBuilder(this, this.$body));
            }
            return new DetailedInputBuilder(this.$params, this.$query, schemaOrBuilder, this.$headers, this.$entitySchema, this._pendingPath);
        }) as BodyCallable;

        // Add streamed method
        callable.streamed = <TYieldIn, TYieldOut, TReturnIn = unknown, TReturnOut = unknown>(yields: Schema<TYieldIn, TYieldOut>, returns?: Schema<TReturnIn, TReturnOut>) => {
            const streamedSchema = eventIterator(yields, returns);
            return new DetailedInputBuilder(this.$params, this.$query, streamedSchema, this.$headers, this.$entitySchema, this._pendingPath);
        };

        return callable;
    }

    /**
     * Query accessor - supports both direct schema and builder callback
     *
     * @example
     * ```typescript
     * // Direct schema
     * .query(querySchema)
     *
     * // Builder callback
     * .query(q => q.schema(s => extendSchema(s, { limit: numberSchema })))
     * ```
     */
    query<TNewQuery extends AnySchema>(
        builder: (q: QueryBuilder<TQuery, TParams, TBody, THeaders, TEntitySchema>) => DetailedInputBuilder<TParams, TNewQuery, TBody, THeaders, TEntitySchema>,
    ): DetailedInputBuilder<TParams, TNewQuery, TBody, THeaders, TEntitySchema>;
    query<TNewQuery extends AnySchema>(schema: TNewQuery): DetailedInputBuilder<TParams, TNewQuery, TBody, THeaders, TEntitySchema>;
    query<TNewQuery extends AnySchema>(
        schemaOrBuilder: TNewQuery | ((q: QueryBuilder<TQuery, TParams, TBody, THeaders, TEntitySchema>) => DetailedInputBuilder<TParams, TNewQuery, TBody, THeaders, TEntitySchema>),
    ): DetailedInputBuilder<TParams, TNewQuery, TBody, THeaders, TEntitySchema> {
        if (typeof schemaOrBuilder === "function") {
            return schemaOrBuilder(new QueryBuilder(this, this.$query));
        }
        return new DetailedInputBuilder(this.$params, schemaOrBuilder, this.$body, this.$headers, this.$entitySchema, this._pendingPath);
    }

    /**
     * Params accessor - supports template literals, existing param references, and direct schema
     *
     * **Usage Patterns:**
     *
     * ### 1. Template literal with inline param definition
     * Define new params directly in the template using `p('name', schema)`:
     * ```typescript
     * .params(p => p`/orgs/${p('orgId', z.uuid())}/users`)
     * ```
     *
     * ### 2. Object definition + template literal
     * Define params in an object first, then reference them in template:
     * ```typescript
     * .params({ orgId: z.uuid() }, p => p`/orgs/${p.orgId}/users`)
     * ```
     *
     * ### 3. Direct schema
     * ```typescript
     * .params(paramsSchema)
     * ```
     *
     * ### 4. Builder callback
     * ```typescript
     * .params(p => p.schema(s => extendSchema(s, { userId: stringSchema })))
     * ```
     */
    // Overload 1: Template literal callback - access existing params
    params<
        TNewParams extends readonly PathParam[],
        TNewParamsShape extends SchemaShape = ParamsToSchemaShape<TNewParams>,
        TCurrentShape extends SchemaShape = TParams extends ObjectSchema<infer S extends SchemaShape> ? S : Record<never, never>,
    >(
        templateFn: (p: PathParamBuilderWithExisting<TCurrentShape>) => { template: string; params: TNewParams },
    ): DetailedInputBuilder<
        ObjectSchema<{
            [K in keyof TCurrentShape | keyof TNewParamsShape]: K extends keyof TNewParamsShape ? TNewParamsShape[K] : K extends keyof TCurrentShape ? TCurrentShape[K] : never;
        }>,
        TQuery,
        TBody,
        THeaders,
        TEntitySchema
    >;

    // Overload 2: Object definition + template literal
    params<
        TNewParamsDef extends SchemaShape,
        TCurrentShape extends SchemaShape = TParams extends ObjectSchema<infer S extends SchemaShape> ? S : Record<never, never>,
        TCombinedShape extends SchemaShape = {
            [K in keyof TCurrentShape | keyof TNewParamsDef]: K extends keyof TNewParamsDef ? TNewParamsDef[K] : K extends keyof TCurrentShape ? TCurrentShape[K] : never;
        },
    >(
        newParams: TNewParamsDef,
        templateFn: (p: PathParamBuilderWithExisting<TCombinedShape>) => { template: string },
    ): DetailedInputBuilder<ObjectSchema<TCombinedShape>, TQuery, TBody, THeaders, TEntitySchema>;

    // Overload 3: Builder callback
    params<TNewParams extends AnySchema>(
        builder: (p: ParamsBuilder<TParams, TQuery, TBody, THeaders, TEntitySchema>) => DetailedInputBuilder<TNewParams, TQuery, TBody, THeaders, TEntitySchema>,
    ): DetailedInputBuilder<TNewParams, TQuery, TBody, THeaders, TEntitySchema>;

    // Overload 4: Direct schema
    params<TNewParams extends AnySchema>(schema: TNewParams): DetailedInputBuilder<TNewParams, TQuery, TBody, THeaders, TEntitySchema>;

    // Overload 5: Object-only (add/override param types without changing path)
    params<
        TNewParamsDef extends SchemaShape,
        TCurrentShape extends SchemaShape = TParams extends ObjectSchema<infer S extends SchemaShape> ? S : Record<never, never>,
        TMergedShape extends SchemaShape = {
            [K in keyof TCurrentShape | keyof TNewParamsDef]: K extends keyof TNewParamsDef ? TNewParamsDef[K] : K extends keyof TCurrentShape ? TCurrentShape[K] : never;
        },
    >(newParams: TNewParamsDef): DetailedInputBuilder<ObjectSchema<TMergedShape>, TQuery, TBody, THeaders, TEntitySchema>;

    // Implementation (no generics - rely on runtime shape + type assertion)
    params(paramsOrModifier: unknown, templateFnIfNewParams?: unknown): DetailedInputBuilder<AnySchema, TQuery, TBody, THeaders, TEntitySchema> {
        type TemplateResult = { template: string; params: readonly PathParam[] };
        type TemplateFn = (builder: PathParamBuilderWithExisting<SchemaShape>) => TemplateResult;
        const isTemplateFn = (value: unknown): value is TemplateFn => typeof value === "function";

        // Extract existing params shape at runtime
        const existingParamsShape = typeof this.$params === "object" ? ((this.$params as Record<string, unknown> & Record<symbol, SchemaShape>)[Symbol.for("standard-schema:shape")] ?? {}) : {};

        // Overload 2: Object + template function
        if (typeof paramsOrModifier === "object" && paramsOrModifier !== null && !("~standard" in paramsOrModifier) && isTemplateFn(templateFnIfNewParams)) {
            const newParamsDef = paramsOrModifier as SchemaShape;

            // Combine existing params with new definitions for the builder
            const combinedForBuilder = { ...existingParamsShape, ...newParamsDef };

            // Create path param builder with combined params
            const builder = createPathParamBuilder(combinedForBuilder);
            const result = templateFnIfNewParams(builder);

            // Build new params shape from template result
            const newParamsShape = result.params.reduce<Record<string, AnySchema>>((acc, param) => {
                acc[param.name] = param.schema;
                return acc;
            }, {});

            // Final shape: existing + new definitions + template params
            const finalShape = { ...existingParamsShape, ...newParamsDef, ...newParamsShape };
            const paramsSchema = objectSchema(finalShape);

            // Trust overload signature for type inference
            return new DetailedInputBuilder(paramsSchema, this.$query, this.$body, this.$headers, this.$entitySchema, result.template) as DetailedInputBuilder<
                AnySchema,
                TQuery,
                TBody,
                THeaders,
                TEntitySchema
            >;
        }

        // Overload 1: Template literal callback function
        if (typeof paramsOrModifier === "function") {
            // Check if result is a template result (has 'template' and 'params')
            const builder = createPathParamBuilder(existingParamsShape);
            const callbackFn = paramsOrModifier as (builder: PathParamBuilderWithExisting<SchemaShape>) => TemplateResult | DetailedInputBuilder<AnySchema, TQuery, TBody, THeaders, TEntitySchema>;
            const result = callbackFn(builder);

            // If result has template and params, it's a template literal usage
            if ("template" in result && "params" in result) {
                const templateResult = result;

                // Build new params shape from template result
                const newParamsShape = templateResult.params.reduce<Record<string, AnySchema>>((acc, param) => {
                    acc[param.name] = param.schema;
                    return acc;
                }, {});

                // Merge existing params with new params
                const combinedShape = { ...existingParamsShape, ...newParamsShape };
                const paramsSchema = objectSchema(combinedShape);

                // Trust overload signature for type inference
                return new DetailedInputBuilder(paramsSchema, this.$query, this.$body, this.$headers, this.$entitySchema, templateResult.template) as DetailedInputBuilder<
                    AnySchema,
                    TQuery,
                    TBody,
                    THeaders,
                    TEntitySchema
                >;
            }

            // Otherwise it's a builder callback that returns DetailedInputBuilder
            return result;
        }

        // Overload 3: Object-only (add/override param types without changing path)
        // Check if first arg is object without ~standard property and no second arg
        if (typeof paramsOrModifier === "object" && paramsOrModifier !== null && !("~standard" in paramsOrModifier) && !templateFnIfNewParams) {
            const overrides = paramsOrModifier as Record<string, AnySchema>;

            // Merge with existing params
            const finalShape = { ...existingParamsShape, ...overrides };
            const paramsSchema = objectSchema(finalShape);

            // Trust overload signature for type inference
            return new DetailedInputBuilder(paramsSchema, this.$query, this.$body, this.$headers, this.$entitySchema, this._pendingPath) as DetailedInputBuilder<
                AnySchema,
                TQuery,
                TBody,
                THeaders,
                TEntitySchema
            >;
        }

        // Fallback: Direct schema
        return new DetailedInputBuilder(paramsOrModifier as AnySchema, this.$query, this.$body, this.$headers, this.$entitySchema, this._pendingPath);
    }

    /**
     * Headers accessor - supports direct schema, builder callback, and raw shape
     *
     * @example
     * ```typescript
     * // Direct schema
     * .headers(headersSchema)
     *
     * // Builder callback
     * .headers(h => h.schema(s => extendSchema(s, { 'x-api-key': stringSchema })))
     *
     * // Raw shape (object with schema values)
     * .headers({ 'if-match': z.string() })
     * ```
     */
    headers<TNewHeaders extends AnySchema>(
        builder: (h: HeadersBuilder<THeaders, TParams, TQuery, TBody, TEntitySchema>) => DetailedInputBuilder<TParams, TQuery, TBody, TNewHeaders, TEntitySchema>,
    ): DetailedInputBuilder<TParams, TQuery, TBody, TNewHeaders, TEntitySchema>;
    headers<TNewHeaders extends AnySchema>(schema: TNewHeaders): DetailedInputBuilder<TParams, TQuery, TBody, TNewHeaders, TEntitySchema>;
    headers<TNewShape extends SchemaShape>(shape: TNewShape): DetailedInputBuilder<TParams, TQuery, TBody, ObjectSchema<TNewShape>, TEntitySchema>;
    headers(schemaOrBuilderOrShape: unknown): DetailedInputBuilder<TParams, TQuery, TBody, AnySchema, TEntitySchema> {
        if (typeof schemaOrBuilderOrShape === "function") {
            // Builder callback
            const callbackFn = schemaOrBuilderOrShape as (h: HeadersBuilder<THeaders, TParams, TQuery, TBody, TEntitySchema>) => DetailedInputBuilder<TParams, TQuery, TBody, AnySchema, TEntitySchema>;
            return callbackFn(new HeadersBuilder(this, this.$headers));
        }

        // Check if it's a raw shape (object without ~standard property)
        if (typeof schemaOrBuilderOrShape === "object" && schemaOrBuilderOrShape !== null && !("~standard" in schemaOrBuilderOrShape)) {
            const schema = s.object(schemaOrBuilderOrShape as SchemaShape);
            return new DetailedInputBuilder(this.$params, this.$query, this.$body, schema, this.$entitySchema, this._pendingPath);
        }

        // Direct schema
        return new DetailedInputBuilder(this.$params, this.$query, this.$body, schemaOrBuilderOrShape as AnySchema, this.$entitySchema, this._pendingPath);
    }

    /**
     * Apply custom modification to entity schema
     */
    custom<TNewEntitySchema extends AnySchema>(modifier: (schema: TEntitySchema) => TNewEntitySchema): DetailedInputBuilder<TParams, TQuery, TBody, THeaders, TNewEntitySchema> {
        const newSchema = modifier(this.$entitySchema);
        return new DetailedInputBuilder(this.$params, this.$query, this.$body, this.$headers, newSchema, this._pendingPath);
    }

    /**
     * Omit fields from the current body schema (or entity schema when body is not object-like).
     */
    omit(fields: readonly string[]): DetailedInputBuilder<TParams, TQuery, AnySchema, THeaders, TEntitySchema> {
        const target = this._resolveObjectSchemaTarget();
        if (!("omit" in target) || typeof target.omit !== "function") {
            throw new Error("omit() can only be called on object schemas");
        }

        const omitRecord = Object.fromEntries(fields.map((field) => [field, true])) as Record<string, true>;
        const schema = (target as { omit: (shape: Record<string, true>) => AnySchema }).omit(omitRecord);
        return new DetailedInputBuilder(this.$params, this.$query, schema, this.$headers, this.$entitySchema, this._pendingPath);
    }

    /**
     * Pick fields from the current body schema (or entity schema when body is not object-like).
     */
    pick(fields: readonly string[]): DetailedInputBuilder<TParams, TQuery, AnySchema, THeaders, TEntitySchema> {
        const target = this._resolveObjectSchemaTarget();
        if (!("pick" in target) || typeof target.pick !== "function") {
            throw new Error("pick() can only be called on object schemas");
        }

        const pickRecord = Object.fromEntries(fields.map((field) => [field, true])) as Record<string, true>;
        const schema = (target as { pick: (shape: Record<string, true>) => AnySchema }).pick(pickRecord);
        return new DetailedInputBuilder(this.$params, this.$query, schema, this.$headers, this.$entitySchema, this._pendingPath);
    }

    /**
     * Make all or selected fields optional on the current body schema.
     */
    partial(fields?: readonly string[]): DetailedInputBuilder<TParams, TQuery, AnySchema, THeaders, TEntitySchema> {
        const target = this._resolveObjectSchemaTarget();
        if (!("partial" in target) || typeof target.partial !== "function") {
            throw new Error("partial() can only be called on object schemas");
        }

        const schema = (target as { partial: (shape?: readonly string[]) => AnySchema }).partial(fields);
        return new DetailedInputBuilder(this.$params, this.$query, schema, this.$headers, this.$entitySchema, this._pendingPath);
    }

    /**
     * Extend the current body schema with additional fields.
     */
    extend(shape: Record<string, unknown>): DetailedInputBuilder<TParams, TQuery, AnySchema, THeaders, TEntitySchema> {
        const target = this._resolveObjectSchemaTarget();
        if (!("extend" in target) || typeof target.extend !== "function") {
            throw new Error("extend() can only be called on object schemas");
        }

        const schema = (target as { extend: (shape: Record<string, unknown>) => AnySchema }).extend(shape);
        return new DetailedInputBuilder(this.$params, this.$query, schema, this.$headers, this.$entitySchema, this._pendingPath);
    }

    private _resolveObjectSchemaTarget(): AnySchema {
        if (typeof this.$body === "object") {
            return this.$body;
        }
        return this.$entitySchema;
    }

    /**
     * Build the final detailed input schema
     * Fields are made optional only when they are void/never or object schemas with all-optional properties
     * Returns properly typed ObjectSchema with shape preservation for type inference
     * @internal
     */
    _build(): ObjectSchema<{
        params: ShouldBeOptional<TParams> extends true ? OptionalSchema<TParams> : TParams;
        query: ShouldBeOptional<TQuery> extends true ? OptionalSchema<TQuery> : TQuery;
        body: ShouldBeOptional<TBody> extends true ? OptionalSchema<TBody> : TBody;
        headers: ShouldBeOptional<THeaders> extends true ? OptionalSchema<THeaders> : THeaders;
    }> {
        // Build shape with properly typed fields - preserves generics for inference
        const paramsOptional = shouldBeOptional(this.$params);
        const queryOptional = shouldBeOptional(this.$query);
        const bodyOptional = shouldBeOptional(this.$body);
        const headersOptional = shouldBeOptional(this.$headers);

        const shape = {
            params: paramsOptional ? optionalSchema(this.$params) : this.$params,
            query: queryOptional ? optionalSchema(this.$query) : this.$query,
            body: bodyOptional ? optionalSchema(this.$body) : this.$body,
            headers: headersOptional ? optionalSchema(this.$headers) : this.$headers,
        } as const;

        const schema = objectSchema(shape);

        // Add DetailedInputBrand symbol for runtime detection
        // This allows RouteBuilder to distinguish DetailedInput from regular ObjectSchema
        const DetailedInputBrand = Symbol.for("DetailedInputBrand");
        (schema as unknown as Record<symbol, boolean>)[DetailedInputBrand] = true;

        // TypeScript can't evaluate conditional types from runtime branching,
        // so we assert the return type which is guaranteed by the runtime logic above
        return schema as unknown as ObjectSchema<{
            params: ShouldBeOptional<TParams> extends true ? OptionalSchema<TParams> : TParams;
            query: ShouldBeOptional<TQuery> extends true ? OptionalSchema<TQuery> : TQuery;
            body: ShouldBeOptional<TBody> extends true ? OptionalSchema<TBody> : TBody;
            headers: ShouldBeOptional<THeaders> extends true ? OptionalSchema<THeaders> : THeaders;
        }>;
    }
}

/**
 * Check if a schema should be optional in the detailed input
 * A schema is optional if:
 * - It's void or never
 * - It's an object where ALL properties are optional
 */
function shouldBeOptional(schema: AnySchema): boolean {
    // Check for void/never using our type markers
    if (typeof schema === "object" && "_type" in schema) {
        const type = (schema as { _type?: string })._type;
        if (type === "void" || type === "never") {
            return true;
        }
    }

    // Check for object schema
    if (typeof schema === "object") {
        const shapeSymbol = Symbol.for("standard-schema:shape");
        if (shapeSymbol in schema) {
            const shape = (schema as unknown as Record<symbol, Record<string, AnySchema>>)[shapeSymbol];
            if (!shape) return false;

            const keys = Object.keys(shape);

            // Empty object - never optionalized by shape emptiness alone
            if (keys.length === 0) return false;

            // All fields optional - make the whole thing optional
            return keys.every((key) => {
                const field = shape[key];
                return typeof field === "object" && "_inner" in field; // OptionalSchema marker
            });
        }
    }

    return false;
}

function isEmptyObjectSchema(schema: AnySchema): boolean {
    if (typeof schema !== "object") {
        return false;
    }

    const shapeSymbol = Symbol.for("standard-schema:shape");
    if (!(shapeSymbol in schema)) {
        return false;
    }

    const shape = (schema as unknown as Record<symbol, Record<string, AnySchema>>)[shapeSymbol];
    if (!shape || typeof shape !== "object") {
        return false;
    }

    return Object.keys(shape).length === 0;
}

/**
 * Create a new detailed input builder with default schemas
 */
export function createDetailedInputBuilder<TEntitySchema extends AnySchema = VoidSchema>(
    entitySchema?: TEntitySchema,
): DetailedInputBuilder<ObjectSchema<Record<never, never>>, ObjectSchema<Record<never, never>>, VoidSchema, ObjectSchema<Record<never, never>>, TEntitySchema> {
    return new DetailedInputBuilder(createEmptyObjectSchema(), createEmptyObjectSchema(), createVoidSchema(), createEmptyObjectSchema(), entitySchema);
}
