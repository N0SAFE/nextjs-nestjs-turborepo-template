/**
 * Output builders for route-builder-v2.
 *
 * Mirrors the input-side architecture (`input/builder.ts` + `input/proxy.ts`):
 * - this file contains the full output building logic (`DetailedOutputBuilder`),
 * - `output/proxy.ts` only wires RouteBuilder context into a thin proxy wrapper.
 *
 * Output structure concerns RESPONSE semantics only:
 * - `status`
 * - `headers`
 * - `body`
 * - `streamed` output wrappers
 * - response `union` composition
 */

import { eventIterator } from "@orpc/contract";
import { DetailedOutputBrand, type DetailedOutput } from "../core/route-builder";
import type { AnySchema, HTTPMethod, ErrorMap, UnionTuple } from "../../shared/types";
import type { ObjectSchema, LiteralSchema, VoidSchema, SchemaShape } from "../../shared/standard-schema-helpers";
import { objectSchema, voidSchema, literalSchema, unionSchema, emptyObjectSchema, getSchemaShape } from "../../shared/standard-schema-helpers";
import { ProxyBuilderBase } from "../core/proxy-builder.base";
import type { OutputSchemaProxy } from "./proxy";

/**
 * Extract body schema from output type.
 * - If detailed output shape exists, returns `body` schema.
 * - Otherwise returns the schema itself.
 */
export type ExtractOutputBody<T> = T extends ObjectSchema<infer S> ? (S extends { body: infer B extends AnySchema } ? B : T) : T;

/**
 * Extract numeric status code from output type.
 * Defaults to `200` when no detailed status exists.
 */
export type ExtractOutputStatus<T> = T extends ObjectSchema<infer S> ? (S extends { status: LiteralSchema<infer N extends number> } ? N : 200) : 200;

/**
 * Extract headers schema from output type.
 * Defaults to empty object schema when not in detailed mode.
 */
export type ExtractOutputHeaders<T> =
    T extends ObjectSchema<infer S> ? (S extends { headers: infer H extends AnySchema } ? H : ObjectSchema<Record<never, never>>) : ObjectSchema<Record<never, never>>;

/**
 * Public schema view for output proxy/builder consumers:
 * - returns direct body schema for common case (`status=200` and no headers),
 * - otherwise returns the detailed output schema.
 */
export type OutputSchemaProxySchema<TData extends AnySchema | DetailedOutput> =
    TData extends DetailedOutput<infer S, infer H, infer B> ? (S extends 200 ? (H extends ObjectSchema<Record<never, never>> ? B : TData) : TData) : TData;

/**
 * Runtime guard for detailed output mode.
 */
export function isDetailedMode(data: AnySchema | DetailedOutput): boolean {
    return DetailedOutputBrand in (data as object);
}

/**
 * Core output builder with immutable chaining.
 *
 * This class intentionally contains all output-building behavior so the
 * architecture matches input-side layering (`DetailedInputBuilder`).
 */
export abstract class DetailedOutputBuilder<
    TData extends AnySchema | DetailedOutput = VoidSchema,
    TMethod extends HTTPMethod = "GET",
    TEntitySchema extends AnySchema = VoidSchema,
    TErrors extends ErrorMap = Record<string, never>,
> extends ProxyBuilderBase<OutputSchemaProxySchema<TData>> {
    /** Internal accumulated output schema state. */
    readonly $data: TData;

    constructor(data: TData) {
        super();
        this.$data = data;
    }

    /**
     * Factory hook implemented by proxy layer.
     * Must return a new immutable proxy instance with updated data.
     */
    protected abstract _create<TNewData extends AnySchema | DetailedOutput>(data: TNewData): OutputSchemaProxy<TNewData, TMethod, TEntitySchema, TErrors>;

    /**
     * Entity schema hook delegated to proxy layer (RouteBuilder context).
     */
    protected abstract _getEntitySchema(): TEntitySchema | undefined;

    /** Access entity schema from route context. */
    get entitySchema(): TEntitySchema | undefined {
        return this._getEntitySchema();
    }

    /**
     * Resolved output schema view.
     *
     * - Non-detailed mode => raw schema
     * - Detailed mode with 200/no-headers => direct body schema
     * - Otherwise => full detailed schema
     */
    get schema(): OutputSchemaProxySchema<TData> {
        const detailed = isDetailedMode(this.$data);
        if (!detailed) {
            return this.$data as OutputSchemaProxySchema<TData>;
        }

        const status = this._extractStatus();
        const headers = this._extractHeaders();
        const headerShape = getSchemaShape(headers as AnySchema);
        const hasHeaders = Object.keys(headerShape).length > 0;

        if (status === 200 && !hasHeaders) {
            return this._extractBody() as unknown as OutputSchemaProxySchema<TData>;
        }

        return this.$data as OutputSchemaProxySchema<TData>;
    }

    /** Extract body from detailed schema (guarded). */
    protected _extractBody(): ExtractOutputBody<TData> {
        if (!isDetailedMode(this.$data)) {
            throw new Error("DetailedOutputBuilder._extractBody: not in detailed mode.");
        }
        const shape = getSchemaShape(this.$data);
        return shape.body as ExtractOutputBody<TData>;
    }

    /** Extract status from detailed schema (guarded). */
    protected _extractStatus(): ExtractOutputStatus<TData> {
        if (!isDetailedMode(this.$data)) {
            throw new Error("DetailedOutputBuilder._extractStatus: not in detailed mode.");
        }
        const shape = getSchemaShape(this.$data);
        const statusSchema = shape.status as LiteralSchema<number>;
        return statusSchema._value as ExtractOutputStatus<TData>;
    }

    /** Extract headers from detailed schema (guarded). */
    protected _extractHeaders(): ExtractOutputHeaders<TData> {
        if (!isDetailedMode(this.$data)) {
            throw new Error("DetailedOutputBuilder._extractHeaders: not in detailed mode.");
        }
        const shape = getSchemaShape(this.$data);
        return shape.headers as ExtractOutputHeaders<TData>;
    }

    /** Default status for non-detailed mode. */
    protected _defaultStatus(): ExtractOutputStatus<TData> {
        return 200 as ExtractOutputStatus<TData>;
    }

    /** Default headers for non-detailed mode. */
    protected _defaultHeaders(): ExtractOutputHeaders<TData> {
        return emptyObjectSchema() as unknown as ExtractOutputHeaders<TData>;
    }

    /** Default body for non-detailed mode. */
    protected _defaultBody(): ExtractOutputBody<TData> {
        return this.$data as unknown as ExtractOutputBody<TData>;
    }

    /** Build branded detailed output schema object. */
    protected _buildDetailedSchema<TStatus extends number, THeaders extends AnySchema, TBody extends AnySchema>(
        status: TStatus,
        headers: THeaders,
        body: TBody,
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

    /**
     * Body accessor with callable + streamed sub-call.
     */
    get body() {
        type BodyCallable = {
            <TNewBody extends AnySchema>(schema: TNewBody): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>, TNewBody>, TMethod, TEntitySchema, TErrors>;
            <TNewBody extends AnySchema>(
                builder: (current: ExtractOutputBody<TData>) => TNewBody,
            ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>, TNewBody>, TMethod, TEntitySchema, TErrors>;
            streamed: {
                <TNewBody extends AnySchema>(schema: TNewBody): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>>, TMethod, TEntitySchema, TErrors>;
                <TNewBody extends AnySchema>(
                    builder: (current: ExtractOutputBody<TData>) => TNewBody,
                ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>>, TMethod, TEntitySchema, TErrors>;
            };
        };

        const callable = (<TNewBody extends AnySchema>(
            schemaOrBuilder: TNewBody | ((current: ExtractOutputBody<TData>) => TNewBody),
        ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>, TNewBody>, TMethod, TEntitySchema, TErrors> => {
            const detailed = isDetailedMode(this.$data);
            const currentBody = detailed ? this._extractBody() : this._defaultBody();
            const newBody = typeof schemaOrBuilder === "function" ? (schemaOrBuilder as (current: ExtractOutputBody<TData>) => TNewBody)(currentBody) : schemaOrBuilder;
            const status = detailed ? this._extractStatus() : this._defaultStatus();
            const headers = detailed ? this._extractHeaders() : this._defaultHeaders();
            const built = this._buildDetailedSchema(status, headers, newBody);
            return this._create(built);
        }) as BodyCallable;

        callable.streamed = <TNewBody extends AnySchema>(schemaOrBuilder: TNewBody | ((current: ExtractOutputBody<TData>) => TNewBody)) => {
            const detailed = isDetailedMode(this.$data);
            const currentBody = detailed ? this._extractBody() : this._defaultBody();
            const baseSchema = typeof schemaOrBuilder === "function" ? (schemaOrBuilder as (current: ExtractOutputBody<TData>) => TNewBody)(currentBody) : schemaOrBuilder;
            const streamedBody = eventIterator(baseSchema) as AnySchema;
            const status = detailed ? this._extractStatus() : this._defaultStatus();
            const headers = detailed ? this._extractHeaders() : this._defaultHeaders();
            const built = this._buildDetailedSchema(status, headers, streamedBody);
            return this._create(built);
        };

        return callable;
    }

    /**
     * Set response status (optionally replacing body in one call).
     */
    status<TNewStatus extends number>(
        statusCode: TNewStatus,
    ): OutputSchemaProxy<DetailedOutput<TNewStatus, ExtractOutputHeaders<TData>, ExtractOutputBody<TData>>, TMethod, TEntitySchema, TErrors>;
    status<TNewStatus extends number, TNewBody extends AnySchema>(
        statusCode: TNewStatus,
        bodySchema: TNewBody,
    ): OutputSchemaProxy<DetailedOutput<TNewStatus, ExtractOutputHeaders<TData>, TNewBody>, TMethod, TEntitySchema, TErrors>;
    status<TNewStatus extends number, TNewBody extends AnySchema = never>(
        statusCode: TNewStatus,
        bodySchema?: TNewBody,
    ): OutputSchemaProxy<DetailedOutput<TNewStatus, ExtractOutputHeaders<TData>, ExtractOutputBody<TData> | TNewBody>, TMethod, TEntitySchema, TErrors> {
        const detailed = isDetailedMode(this.$data);
        const body = bodySchema ?? (detailed ? this._extractBody() : this._defaultBody());
        const headers = detailed ? this._extractHeaders() : this._defaultHeaders();
        const built = this._buildDetailedSchema(statusCode, headers, body);
        return this._create(built);
    }

    /**
     * Set response headers using schema, shape, or transform callback.
     */
    headers<TNewHeaders extends AnySchema>(schema: TNewHeaders): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, TNewHeaders, ExtractOutputBody<TData>>, TMethod, TEntitySchema, TErrors>;
    headers<TNewShape extends SchemaShape>(
        shape: TNewShape,
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ObjectSchema<TNewShape>, ExtractOutputBody<TData>>, TMethod, TEntitySchema, TErrors>;
    headers<TNewHeaders extends AnySchema>(
        builder: (current: ExtractOutputHeaders<TData>) => TNewHeaders,
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, TNewHeaders, ExtractOutputBody<TData>>, TMethod, TEntitySchema, TErrors>;
    headers<TNewHeaders extends AnySchema>(
        schemaOrBuilder: TNewHeaders | ((current: ExtractOutputHeaders<TData>) => TNewHeaders),
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, TNewHeaders, ExtractOutputBody<TData>>, TMethod, TEntitySchema, TErrors> {
        const detailed = isDetailedMode(this.$data);
        const currentHeaders = detailed ? this._extractHeaders() : this._defaultHeaders();
        const newHeaders =
            typeof schemaOrBuilder === "function"
                ? (schemaOrBuilder as (current: ExtractOutputHeaders<TData>) => TNewHeaders)(currentHeaders)
                : typeof schemaOrBuilder === "object" && !("~standard" in schemaOrBuilder)
                  ? (objectSchema(schemaOrBuilder as SchemaShape) as unknown as TNewHeaders)
                  : schemaOrBuilder;

        const status = detailed ? this._extractStatus() : this._defaultStatus();
        const body = detailed ? this._extractBody() : this._defaultBody();
        const built = this._buildDetailedSchema(status, newHeaders, body);
        return this._create(built);
    }

    /**
     * Wrap body as streamed `EventIterator` output.
     */
    streamed<TNewBody extends AnySchema>(schema: TNewBody): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>>, TMethod, TEntitySchema, TErrors>;
    streamed<TNewBody extends AnySchema>(
        builder: (current: ExtractOutputBody<TData>) => TNewBody,
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>>, TMethod, TEntitySchema, TErrors>;
    streamed<TNewBody extends AnySchema>(
        schemaOrBuilder: TNewBody | ((current: ExtractOutputBody<TData>) => TNewBody),
    ): OutputSchemaProxy<DetailedOutput<ExtractOutputStatus<TData>, ExtractOutputHeaders<TData>>, TMethod, TEntitySchema, TErrors> {
        const detailed = isDetailedMode(this.$data);
        const currentBody = detailed ? this._extractBody() : this._defaultBody();
        const baseSchema = typeof schemaOrBuilder === "function" ? (schemaOrBuilder as (current: ExtractOutputBody<TData>) => TNewBody)(currentBody) : schemaOrBuilder;
        const streamedBody = eventIterator(baseSchema) as AnySchema;
        const status = detailed ? this._extractStatus() : this._defaultStatus();
        const headers = detailed ? this._extractHeaders() : this._defaultHeaders();
        const built = this._buildDetailedSchema(status, headers, streamedBody);
        return this._create(built);
    }

    /**
     * OpenAPI-friendly no-op, kept for fluent symmetry.
     */
    description(_description: string): this {
        void _description;
        return this;
    }

    /**
     * Apply custom body transformation.
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
        return this._create(built);
    }

    /**
     * Build response union from a list of raw schemas and/or output builders.
     */
    union<
        TItems extends readonly [
            AnySchema | OutputSchemaProxy<AnySchema | DetailedOutput, TMethod, TEntitySchema, TErrors>,
            ...(AnySchema | OutputSchemaProxy<AnySchema | DetailedOutput, TMethod, TEntitySchema, TErrors>)[],
        ],
    >(items: TItems): OutputSchemaProxy<AnySchema, TMethod, TEntitySchema, TErrors>;
    union(
        items: readonly [
            AnySchema | OutputSchemaProxy<AnySchema | DetailedOutput, TMethod, TEntitySchema, TErrors>,
            ...(AnySchema | OutputSchemaProxy<AnySchema | DetailedOutput, TMethod, TEntitySchema, TErrors>)[],
        ],
    ): OutputSchemaProxy<AnySchema, TMethod, TEntitySchema, TErrors> {
        const schemas = items.map((item) => {
            const maybeBuilder = item as { _build?: () => AnySchema };
            if (typeof maybeBuilder._build === "function") {
                return maybeBuilder._build();
            }
            return item;
        }) as AnySchema[];

        if (schemas.length < 2) {
            const single = schemas[0] ?? voidSchema();
            return this._create(single);
        }

        const unified = unionSchema(schemas as unknown as UnionTuple);
        return this._create(unified) as OutputSchemaProxy<AnySchema, TMethod, TEntitySchema, TErrors>;
    }

    /** @internal Final schema emission for route builder wiring. */
    _build(): TData {
        return this.$data;
    }
}
