/**
 * Output schema proxy - immutable chainable builder for output structure
 *
 * Tracks a single `TData` generic (like RouteBuilder's TOutput) that evolves
 * as chainable methods are called. Each method returns a new OutputSchemaProxy
 * with an updated TData type.
 *
 * When returned from a `.output(b => ...)` callback, RouteBuilder calls `_build()`
 * to get the final schema and uses it as TOutput.
 *
 * @example
 * ```typescript
 * // Chain body + status
 * .output(b => b.body(userSchema).status(201))
 *
 * // Streamed body
 * .output(b => b.streamed(chunkSchema).status(200))
 *
 * // Builder callback accessing current schema
 * .output(b => b.body(current => extendSchema(current, { extra: s.string() })))
 *
 * // Headers + body + status
 * .output(b => b.headers(headersSchema).body(bodySchema).status(200))
 * ```
 */

import { eventIterator } from "@orpc/contract";
import { DetailedOutputBrand, type RouteBuilder, type DetailedOutput } from "./route-builder";
import type { AnySchema, HTTPMethod, ErrorMap, UnionTuple } from "./types";
import type { ObjectSchema, LiteralSchema, VoidSchema } from "./standard-schema-helpers";
import { objectSchema, voidSchema, literalSchema, unionSchema, emptyObjectSchema, getSchemaShape } from "./standard-schema-helpers";

// ============================================================================
// TYPE HELPERS - Extract parts from TData
// ============================================================================

/**
 * Extract body schema from output type.
 * If output is a detailed ObjectSchema with `body` field, extracts it. Otherwise VoidSchema.
 */
export type ExtractOutputBody<T> =
    T extends ObjectSchema<infer S>
        ? S extends { body: infer B extends AnySchema } ? B : VoidSchema
        : VoidSchema;

/**
 * Extract status number from output type.
 * If output is a detailed ObjectSchema with a `status` LiteralSchema, extracts the number. Otherwise 200.
 */
export type ExtractOutputStatus<T> =
    T extends ObjectSchema<infer S>
        ? S extends { status: LiteralSchema<infer N extends number> } ? N : 200
        : 200;

/**
 * Extract headers schema from output type.
 * If output is a detailed ObjectSchema with `headers` field, extracts it. Otherwise empty ObjectSchema.
 */
export type ExtractOutputHeaders<T> =
    T extends ObjectSchema<infer S>
        ? S extends { headers: infer H extends AnySchema } ? H : ObjectSchema<Record<never, never>>
        : ObjectSchema<Record<never, never>>;

// ============================================================================
// DETAILED MODE CHECK
// ============================================================================

/**
 * Check if data is in detailed mode (has the DetailedOutputBrand).
 * Use this to guard calls to internal extraction methods.
 */
export function isDetailedMode(data: AnySchema | DetailedOutput): boolean {
    return DetailedOutputBrand in (data as object);
}

// ============================================================================
// OUTPUT SCHEMA PROXY - Immutable Chainable Builder
// ============================================================================

/**
 * Immutable chainable builder for output schema.
 *
 * Tracks a single `TData` generic that represents the accumulated output type,
 * mirroring RouteBuilder's `TOutput extends AnySchema | DetailedOutput`.
 *
 * Each chainable method (body, status, headers, streamed) returns a new proxy
 * with TData updated to a `DetailedOutput<TStatus, THeaders, TBody>`.
 *
 * `_build()` returns `TData` directly — the data is already the final schema.
 *
 * @example
 * ```typescript
 * // b starts with TData = VoidSchema (or current TOutput)
 * b.body(userSchema)           // TData = DetailedOutput<200, {}, userSchema>
 *  .status(201)                // TData = DetailedOutput<201, {}, userSchema>
 *  .headers(headersSchema)     // TData = DetailedOutput<201, headersSchema, userSchema>
 * ```
 */
export class OutputSchemaProxy<
    TData extends AnySchema | DetailedOutput = VoidSchema,
    TMethod extends HTTPMethod = "GET",
    TEntitySchema extends AnySchema = VoidSchema,
    TErrors extends ErrorMap = Record<string, never>,
> {
    readonly $data: TData;
    /** @internal Reference to underlying RouteBuilder (for metadata access) */
    readonly _routeBuilder: RouteBuilder<AnySchema, AnySchema, TMethod, TEntitySchema, TErrors>;

    constructor(
        routeBuilder: RouteBuilder<AnySchema, AnySchema, TMethod, TEntitySchema, TErrors>,
        data: TData,
    ) {
        this._routeBuilder = routeBuilder;
        this.$data = data;
    }

    /**
     * Get the entity schema from the underlying RouteBuilder
     */
    get entitySchema(): TEntitySchema | undefined {
        return this._routeBuilder.getEntitySchema();
    }

    // ========================================================================
    // INTERNAL HELPERS - Extract parts from $data (throws if not in detailed mode)
    // ========================================================================

    /**
     * @internal Extract body from current $data.
     * PRECONDITION: caller must have verified `isDetailedMode(this.$data)`.
     * Throws if not in detailed mode (safety assertion).
     */
    private _extractBody(): ExtractOutputBody<TData> {
        if (!isDetailedMode(this.$data)) {
            throw new Error('OutputSchemaProxy._extractBody: not in detailed mode. Check with isDetailedMode before calling.');
        }
        const shape = getSchemaShape(this.$data);
        return shape.body as ExtractOutputBody<TData>;
    }

    /**
     * @internal Extract status code number from current $data.
     * PRECONDITION: caller must have verified `isDetailedMode(this.$data)`.
     * Throws if not in detailed mode (safety assertion).
     */
    private _extractStatus(): ExtractOutputStatus<TData> {
        if (!isDetailedMode(this.$data)) {
            throw new Error('OutputSchemaProxy._extractStatus: not in detailed mode. Check with isDetailedMode before calling.');
        }
        const shape = getSchemaShape(this.$data);
        const statusSchema = shape.status as LiteralSchema<number>;
        return statusSchema._value as ExtractOutputStatus<TData>;
    }

    /**
     * @internal Extract headers from current $data.
     * PRECONDITION: caller must have verified `isDetailedMode(this.$data)`.
     * Throws if not in detailed mode (safety assertion).
     */
    private _extractHeaders(): ExtractOutputHeaders<TData> {
        if (!isDetailedMode(this.$data)) {
            throw new Error('OutputSchemaProxy._extractHeaders: not in detailed mode. Check with isDetailedMode before calling.');
        }
        const shape = getSchemaShape(this.$data);
        return shape.headers as ExtractOutputHeaders<TData>;
    }

    // ========================================================================
    // DEFAULTS - For non-detailed mode (first call in a chain)
    // ========================================================================

    /** @internal Default status (200) typed as ExtractOutputStatus<TData> */
    private _defaultStatus(): ExtractOutputStatus<TData> {
        return 200 as ExtractOutputStatus<TData>;
    }

    /** @internal Default headers (empty object schema) typed as ExtractOutputHeaders<TData> */
    private _defaultHeaders(): ExtractOutputHeaders<TData> {
        return emptyObjectSchema() as unknown as ExtractOutputHeaders<TData>;
    }

    /** @internal When not in detailed mode, TData itself IS the body */
    private _defaultBody(): ExtractOutputBody<TData> {
        return this.$data as unknown as ExtractOutputBody<TData>;
    }

    // ========================================================================
    // SCHEMA FACTORY - Build a DetailedOutput at runtime (with brand)
    // ========================================================================

    /**
     * @internal Build a DetailedOutput schema at runtime with proper brand symbol.
     * Returns a precisely-typed DetailedOutput.
     */
    private _buildDetailedSchema<TStatus extends number, THeaders extends AnySchema, TBody extends AnySchema>(
        status: TStatus, headers: THeaders, body: TBody,
    ): DetailedOutput<TStatus, THeaders, TBody> {
        const shape = {
            status: literalSchema(status),
            headers,
            body,
        };
        const schema = objectSchema(shape);
        Object.defineProperty(schema, DetailedOutputBrand, { value: true, writable: false });
        return schema as unknown as DetailedOutput<TStatus, THeaders, TBody>;
    }

    // ========================================================================
    // CHAINABLE METHODS - Each returns a new OutputSchemaProxy with updated TData
    // ========================================================================

    /**
     * Set response body schema.
     * Accepts a direct schema or a builder callback receiving the current body schema.
     *
     * @example
     * ```typescript
     * .output(b => b.body(userSchema))
     * .output(b => b.body(current => extendSchema(current, { extra: s.string() })))
     * .output(b => b.body(userSchema).status(201))
     * ```
     */
    body<TNewBody extends AnySchema>(
        schema: TNewBody
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>, TNewBody>, TMethod, TEntitySchema, TErrors>;
    body<TNewBody extends AnySchema>(
        builder: (current: ExtractOutputBody<TData>) => TNewBody
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>, TNewBody>, TMethod, TEntitySchema, TErrors>;
    body<TNewBody extends AnySchema>(
        schemaOrBuilder: TNewBody | ((current: ExtractOutputBody<TData>) => TNewBody),
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>, TNewBody>, TMethod, TEntitySchema, TErrors> {
        const detailed = isDetailedMode(this.$data);
        const currentBody = detailed ? this._extractBody() : this._defaultBody();
        const newBody = typeof schemaOrBuilder === 'function'
            ? (schemaOrBuilder as (current: ExtractOutputBody<TData>) => TNewBody)(currentBody)
            : schemaOrBuilder;
        const status = detailed ? this._extractStatus() : this._defaultStatus();
        const headers = detailed ? this._extractHeaders() : this._defaultHeaders();
        const built = this._buildDetailedSchema(status, headers, newBody);
        return new OutputSchemaProxy(this._routeBuilder, built);
    }

    /**
     * Set response status code.
     *
     * @example
     * ```typescript
     * .output(b => b.status(201))
     * .output(b => b.body(schema).status(201))
     * ```
     */
    status<TNewStatus extends number>(
        statusCode: TNewStatus,
    ): OutputSchemaProxy<DetailedOutput<TNewStatus, ExtractOutputHeaders<TData>, ExtractOutputBody<TData>>, TMethod, TEntitySchema, TErrors> {
        const detailed = isDetailedMode(this.$data);
        const body = detailed ? this._extractBody() : this._defaultBody();
        const headers = detailed ? this._extractHeaders() : this._defaultHeaders();
        const built = this._buildDetailedSchema(statusCode, headers, body);
        return new OutputSchemaProxy(this._routeBuilder, built);
    }

    /**
     * Set response headers schema.
     * Accepts a direct schema or a builder callback receiving the current headers schema.
     *
     * @example
     * ```typescript
     * .output(b => b.headers(headersSchema))
     * .output(b => b.headers(current => extendSchema(current, { 'x-custom': s.string() })))
     * .output(b => b.headers(headersSchema).body(bodySchema).status(200))
     * ```
     */
    headers<TNewHeaders extends AnySchema>(
        schema: TNewHeaders
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, TNewHeaders, ExtractOutputBody<TData>>, TMethod, TEntitySchema, TErrors>;
    headers<TNewHeaders extends AnySchema>(
        builder: (current: ExtractOutputHeaders<TData>) => TNewHeaders
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, TNewHeaders, ExtractOutputBody<TData>>, TMethod, TEntitySchema, TErrors>;
    headers<TNewHeaders extends AnySchema>(
        schemaOrBuilder: TNewHeaders | ((current: ExtractOutputHeaders<TData>) => TNewHeaders),
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, TNewHeaders, ExtractOutputBody<TData>>, TMethod, TEntitySchema, TErrors> {
        const detailed = isDetailedMode(this.$data);
        const currentHeaders = detailed ? this._extractHeaders() : this._defaultHeaders();
        const newHeaders = typeof schemaOrBuilder === 'function'
            ? (schemaOrBuilder as (current: ExtractOutputHeaders<TData>) => TNewHeaders)(currentHeaders)
            : schemaOrBuilder;
        const status = detailed ? this._extractStatus() : this._defaultStatus();
        const body = detailed ? this._extractBody() : this._defaultBody();
        const built = this._buildDetailedSchema(status, newHeaders, body);
        return new OutputSchemaProxy(this._routeBuilder, built);
    }

    /**
     * Set streamed response body (wraps schema in EventIterator).
     * Accepts a direct chunk schema or a builder callback.
     *
     * @example
     * ```typescript
     * .output(b => b.streamed(chunkSchema))
     * .output(b => b.streamed(chunkSchema).status(200))
     * ```
     */
    streamed<TNewBody extends AnySchema>(
        schema: TNewBody
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>>, TMethod, TEntitySchema, TErrors>;
    streamed<TNewBody extends AnySchema>(
        builder: (current: ExtractOutputBody<TData>) => TNewBody
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>>, TMethod, TEntitySchema, TErrors>;
    streamed<TNewBody extends AnySchema>(
        schemaOrBuilder: TNewBody | ((current: ExtractOutputBody<TData>) => TNewBody),
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>>, TMethod, TEntitySchema, TErrors> {
        const detailed = isDetailedMode(this.$data);
        const currentBody = detailed ? this._extractBody() : this._defaultBody();
        const baseSchema = typeof schemaOrBuilder === 'function'
            ? (schemaOrBuilder as (current: ExtractOutputBody<TData>) => TNewBody)(currentBody)
            : schemaOrBuilder;
        const streamedBody = eventIterator(baseSchema) as AnySchema;
        const status = detailed ? this._extractStatus() : this._defaultStatus();
        const headers = detailed ? this._extractHeaders() : this._defaultHeaders();
        const built = this._buildDetailedSchema(status, headers, streamedBody);
        return new OutputSchemaProxy(this._routeBuilder, built);
    }

    /**
     * Apply custom transformation to current body schema.
     *
     * @example
     * ```typescript
     * .output(b => b.custom(body => wrapInArray(body)))
     * ```
     */
    custom<TNewBody extends AnySchema>(
        modifier: (body: ExtractOutputBody<TData>) => TNewBody,
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>, TNewBody>, TMethod, TEntitySchema, TErrors> {
        const detailed = isDetailedMode(this.$data);
        const currentBody = detailed ? this._extractBody() : this._defaultBody();
        const newBody = modifier(currentBody);
        const status = detailed ? this._extractStatus() : this._defaultStatus();
        const headers = detailed ? this._extractHeaders() : this._defaultHeaders();
        const built = this._buildDetailedSchema(status, headers, newBody);
        return new OutputSchemaProxy(this._routeBuilder, built);
    }

    /**
     * Create a union of multiple response variants.
     * The callback receives a fresh proxy (TData=VoidSchema) and should return
     * an array of configured proxies.
     *
     * @example
     * ```typescript
     * .output(b => b.variant(v => [
     *   v.body(userSchema).status(200),
     *   v.body(errorSchema).status(404),
     * ]))
     * ```
     */
    variant(
        builder: (
            v: OutputSchemaProxy<VoidSchema, TMethod, TEntitySchema, TErrors>,
        ) => OutputSchemaProxy<AnySchema | DetailedOutput, HTTPMethod, AnySchema, ErrorMap>[],
    ): OutputSchemaProxy<AnySchema, TMethod, TEntitySchema, TErrors> {
        const variantProxy = new OutputSchemaProxy<VoidSchema, TMethod, TEntitySchema, TErrors>(
            this._routeBuilder,
            voidSchema(),
        );
        const variants = builder(variantProxy);
        const variantSchemas = variants.map(v => v._build());

        if (variantSchemas.length < 2) {
            const single = variantSchemas[0] ?? voidSchema();
            return new OutputSchemaProxy<AnySchema, TMethod, TEntitySchema, TErrors>(this._routeBuilder, single);
        }

        const unified = unionSchema(variantSchemas as unknown as UnionTuple);
        return new OutputSchemaProxy<AnySchema, TMethod, TEntitySchema, TErrors>(this._routeBuilder, unified);
    }

    /**
     * Create union of response schemas directly.
     *
     * @example
     * ```typescript
     * .output(b => b.union([successSchema, errorSchema]))
     * ```
     */
    union<TSchemas extends [AnySchema, AnySchema, ...AnySchema[]]>(
        schemas: TSchemas,
    ): OutputSchemaProxy<AnySchema, TMethod, TEntitySchema, TErrors> {
        const unified = unionSchema(schemas);
        return new OutputSchemaProxy<AnySchema, TMethod, TEntitySchema, TErrors>(this._routeBuilder, unified);
    }

    // ========================================================================
    // BUILD - Returns TData directly (already the final schema)
    // ========================================================================

    /**
     * Return the accumulated output schema.
     * Called by RouteBuilder when the `.output()` callback returns this proxy.
     * @internal
     */
    _build(): TData {
        return this.$data;
    }
}

// ============================================================================
// FACTORY - Creates proxy from existing RouteBuilder
// ============================================================================

/**
 * Create an OutputSchemaProxy initialized with the RouteBuilder's current TOutput.
 */
export function createOutputSchemaProxy<
    TOutput extends AnySchema | DetailedOutput,
    TMethod extends HTTPMethod,
    TEntitySchema extends AnySchema,
    TErrors extends ErrorMap,
>(
    routeBuilder: RouteBuilder<AnySchema, TOutput, TMethod, TEntitySchema, TErrors>,
): OutputSchemaProxy<TOutput, TMethod, TEntitySchema, TErrors> {
    const rb = routeBuilder as unknown as RouteBuilder<AnySchema, AnySchema, TMethod, TEntitySchema, TErrors>;
    const data = routeBuilder.getOutputSchema();
    return new OutputSchemaProxy<TOutput, TMethod, TEntitySchema, TErrors>(rb, data);
}
