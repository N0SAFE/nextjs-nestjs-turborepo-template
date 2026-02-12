/**
 * Output builders for route-builder-v2
 * Handles output schemas including detailed output with status, headers, and body
 * Uses Standard Schema instead of Zod
 */

import { AsyncIteratorClass, eventIterator } from "@orpc/contract";
import type { Schema } from "@orpc/contract";
import type { AnySchema, UnionTuple } from "./types";
import type { SchemaShape, ObjectSchema, IsEmptyRecord, LiteralSchema, VoidSchema } from "./standard-schema-helpers";
import { objectSchema, literalSchema, unionSchema } from "./standard-schema-helpers";

// ============================================================================
// EXTRACT TYPE HELPERS
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

/**
 * Build a DetailedOutput type from builder generics.
 * Maps DetailedOutputBuilder's internal types to the output ObjectSchema + brand.
 */
export type DetailedOutputFromBuilder<
    TBody extends AnySchema,
    THeaders extends SchemaShape,
    TStatus extends number,
    TBrand extends string | undefined,
> = ObjectSchema<DetailedOutputObjectShape<TBody, THeaders, TStatus, TBrand>>;

// ============================================================================
// DETAILED MODE CHECK
// ============================================================================

/**
 * Check if data is in detailed mode (has the DetailedOutputBrand).
 * Use this to guard calls to internal extraction methods.
 */
export function isDetailedMode(data: AnySchema): boolean {
    const DetailedOutputBrand = Symbol.for('DetailedOutputBrand');
    return DetailedOutputBrand in (data as object);
}

/**
 * Type for body callable with streamed property
 */
export type BodyCallable<
    TInitialBody extends AnySchema,
    TResultHeaders extends SchemaShape,
    TResultStatus extends number,
    TDescription extends string | undefined,
    TBrand extends string | undefined,
    TEntitySchema extends AnySchema = VoidSchema,
> = {
    /**
     * Set the response body schema
     */
    <TNewBody extends AnySchema>(body: TNewBody): DetailedOutputBuilder<TInitialBody, TNewBody, TResultHeaders, TResultStatus, TDescription, TBrand, TEntitySchema>;
    
    /**
     * Set the response body as a streamed (EventIterator) schema
     * 
     * @example
     * ```typescript
     * .detailed(d => d.body.streamed(chunkSchema))
     * ```
     */
    streamed: <TYieldIn, TYieldOut, TReturnIn = unknown, TReturnOut = unknown>(yields: Schema<TYieldIn, TYieldOut>, returns?: Schema<TReturnIn, TReturnOut>) => DetailedOutputBuilder<TInitialBody, Schema<AsyncIteratorObject<TYieldIn, TReturnIn, void>, AsyncIteratorClass<TYieldOut, TReturnOut, void>>, TResultHeaders, TResultStatus, TDescription, TBrand, TEntitySchema>;
};


/**
 * Output variant builder for creating output response variants
 * Used for building union types with different status codes
 */
export class OutputVariantBuilder<
    TStatus extends number | undefined = undefined,
    TDescription extends string | undefined = undefined,
    THeaders extends SchemaShape | undefined = undefined,
    TBody extends AnySchema | undefined = undefined,
> {
    private _status?: TStatus;
    private _description?: TDescription;
    private _headers?: THeaders;
    private _body?: TBody;

    /**
     * Set the HTTP status code for this variant
     */
    status<TNewStatus extends number>(status: TNewStatus): OutputVariantBuilder<TNewStatus, TDescription, THeaders, TBody> {
        const builder = new OutputVariantBuilder<TNewStatus, TDescription, THeaders, TBody>();
        builder._status = status;
        builder._description = this._description;
        builder._headers = this._headers;
        builder._body = this._body;
        return builder;
    }

    /**
     * Set the description for this variant
     */
    description<TNewDescription extends string>(description: TNewDescription): OutputVariantBuilder<TStatus, TNewDescription, THeaders, TBody> {
        const builder = new OutputVariantBuilder<TStatus, TNewDescription, THeaders, TBody>();
        builder._status = this._status;
        builder._description = description;
        builder._headers = this._headers;
        builder._body = this._body;
        return builder;
    }

    /**
     * Set the headers for this variant
     */
    headers<TNewHeaders extends SchemaShape>(headers: TNewHeaders): OutputVariantBuilder<TStatus, TDescription, TNewHeaders, TBody> {
        const builder = new OutputVariantBuilder<TStatus, TDescription, TNewHeaders, TBody>();
        builder._status = this._status;
        builder._description = this._description;
        builder._headers = headers;
        builder._body = this._body;
        return builder;
    }

    /**
     * Set the body schema for this variant
     */
    body<TNewBody extends AnySchema>(body: TNewBody): OutputVariantBuilder<TStatus, TDescription, THeaders, TNewBody> {
        const builder = new OutputVariantBuilder<TStatus, TDescription, THeaders, TNewBody>();
        builder._status = this._status;
        builder._description = this._description;
        builder._headers = this._headers;
        builder._body = body;
        return builder;
    }

    /**
     * Build the final schema for this variant
     * @internal
     */
    _build(): AnySchema {
        const shape: SchemaShape = {};

        if (this._status !== undefined) {
            shape.status = literalSchema(this._status);
        }

        if (this._headers && Object.keys(this._headers).length > 0) {
            shape.headers = objectSchema(this._headers);
        }

        if (this._body) {
            shape.body = this._body;
        }

        return objectSchema(shape);
    }
}

/**
 * Detailed output object shape type helper
 */
export type DetailedOutputObjectShape<
    TResultBody extends AnySchema, 
    TResultHeaders extends SchemaShape, 
    TResultStatus extends number,
    TBrand extends string | undefined = undefined
> = 
    { status: ReturnType<typeof literalSchema<TResultStatus>> } &
    (IsEmptyRecord<TResultHeaders> extends true 
        ? (TBrand extends string 
            ? { headers: ObjectSchema<{ 'x-brand': ReturnType<typeof literalSchema<TBrand>> }> } 
            : Record<never, never>
        )
        : (TBrand extends string 
            ? { headers: ObjectSchema<TResultHeaders & { 'x-brand': ReturnType<typeof literalSchema<TBrand>> }> }
            : { headers: ObjectSchema<TResultHeaders> }
        )
    ) &
    { body: TResultBody };

/**
 * Detailed output builder for creating structured output with status, headers, and body
 */
export class DetailedOutputBuilder<
    TInitialBody extends AnySchema = AnySchema,
    TResultBody extends AnySchema = AnySchema,
    TResultHeaders extends SchemaShape = Record<never, never>,
    TResultStatus extends number = 200,
    TDescription extends string | undefined = undefined,
    TBrand extends string | undefined = undefined,
    TEntitySchema extends AnySchema = VoidSchema,
> {
    private _initialBody: TInitialBody;
    private _resultBody: TResultBody;
    private _resultHeaders: TResultHeaders;
    private _resultStatus: TResultStatus;
    private _description?: TDescription;
    private _brand?: TBrand;
    private _entitySchema: TEntitySchema;

    constructor(
        initialBody: TInitialBody,
        resultBody: TResultBody,
        headers: TResultHeaders,
        status: TResultStatus,
        description?: TDescription,
        brand?: TBrand,
        entitySchema?: TEntitySchema
    ) {
        this._initialBody = initialBody;
        this._resultBody = resultBody;
        this._resultHeaders = headers;
        this._resultStatus = status;
        this._description = description;
        this._brand = brand;
        this._entitySchema = (entitySchema ?? { validator: () => ({ success: false, issues: [] }) }) as TEntitySchema;
    }

    /**
     * Access the raw result body schema being built
     * Useful for builder pattern to return the body schema directly without detailed wrapping
     * 
     * @example
     * ```typescript
     * .output(b => b.body(userSchema).raw)
     * // Returns the body schema directly without wrapping in detailed structure
     * ```
     */
    get raw(): TResultBody {
        return this._resultBody;
    }

    /**
     * Access to the entity schema for reference
     */
    get entitySchema(): TEntitySchema {
        return this._entitySchema;
    }

    /**
     * Set the HTTP status code
     */
    status<TNewStatus extends number>(status: TNewStatus): DetailedOutputBuilder<TInitialBody, TResultBody, TResultHeaders, TNewStatus, TDescription, TBrand, TEntitySchema> {
        return new DetailedOutputBuilder(
            this._initialBody,
            this._resultBody,
            this._resultHeaders,
            status,
            this._description,
            this._brand,
            this._entitySchema
        );
    }

    /**
     * Set response headers
     */
    headers<TNewHeaders extends SchemaShape>(headers: TNewHeaders): DetailedOutputBuilder<TInitialBody, TResultBody, TNewHeaders, TResultStatus, TDescription, TBrand, TEntitySchema> {
        return new DetailedOutputBuilder(
            this._initialBody,
            this._resultBody,
            headers,
            this._resultStatus,
            this._description,
            this._brand,
            this._entitySchema
        );
    }

    /**
     * Get body callable with streamed support
     * 
     * @example
     * ```typescript
     * // Direct body
     * .detailed(d => d.body(userSchema))
     * 
     * // Streamed body
     * .detailed(d => d.body.streamed(chunkSchema))
     * ```
     */
    get body(): BodyCallable<TInitialBody, TResultHeaders, TResultStatus, TDescription, TBrand> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        
        // Create callable function for body(schema)
        const callable = <TNewBody extends AnySchema>(body: TNewBody): DetailedOutputBuilder<TInitialBody, TNewBody, TResultHeaders, TResultStatus, TDescription, TBrand, TEntitySchema> => {
            return new DetailedOutputBuilder(
                self._initialBody,
                body,
                self._resultHeaders,
                self._resultStatus,
                self._description,
                self._brand,
                self._entitySchema
            );
        };
        
        // Add streamed property for body.streamed(schema)
        callable.streamed = <TYieldIn, TYieldOut, TReturnIn = unknown, TReturnOut = unknown>(yields: Schema<TYieldIn, TYieldOut>, returns?: Schema<TReturnIn, TReturnOut>) => {
            const streamedSchema = eventIterator(yields, returns);
            return new DetailedOutputBuilder(
                self._initialBody,
                streamedSchema,
                self._resultHeaders,
                self._resultStatus,
                self._description,
                self._brand,
                self._entitySchema
            );
        };
        
        return callable as BodyCallable<TInitialBody, TResultHeaders, TResultStatus, TDescription, TBrand, TEntitySchema>;
    }

    /**
     * Set a description for this output
     */
    description<TNewDescription extends string>(description: TNewDescription): DetailedOutputBuilder<TInitialBody, TResultBody, TResultHeaders, TResultStatus, TNewDescription, TBrand, TEntitySchema> {
        return new DetailedOutputBuilder(
            this._initialBody,
            this._resultBody,
            this._resultHeaders,
            this._resultStatus,
            description,
            this._brand,
            this._entitySchema
        );
    }

    /**
     * Set a brand identifier for this output (added to headers as x-brand)
     */
    brand<TNewBrand extends string>(brand: TNewBrand): DetailedOutputBuilder<TInitialBody, TResultBody, TResultHeaders, TResultStatus, TDescription, TNewBrand, TEntitySchema> {
        return new DetailedOutputBuilder(
            this._initialBody,
            this._resultBody,
            this._resultHeaders,
            this._resultStatus,
            this._description,
            brand,
            this._entitySchema
        );
    }

    /**
     * Create union of multiple response variants
     * 
     * This method allows building multiple response types from the detailed builder context.
     * Each builder in the array will be built and combined into a union schema.
     * 
     * Returns a `DetailedOutputUnionResult` (not a `DetailedOutputBuilder`) so that
     * the `output()` overload in RouteBuilder can detect the union case and produce
     * a TypeScript-level union of DetailedOutput types for proper status discrimination.
     * 
     * @example
     * ```typescript
     * // Within output(), create union of different responses
     * .output(b => b.union([
     *   b.status(200).body(successSchema),
     *   b.status(404).body(notFoundSchema),
     *   b.status(500).body(errorSchema),
     * ]))
     * 
     * // With streaming variant
     * .output(b => b.union([
     *   b.status(200).body.streamed(chunkSchema),
     *   b.status(500).body(errorSchema),
     * ]))
     * ```
     */
    union<const TBuilders extends readonly DetailedOutputBuilder<AnySchema, AnySchema, SchemaShape, number, string | undefined, string | undefined, AnySchema>[]>(
        builders: TBuilders
    ): DetailedOutputUnionResult<TBuilders> {
        // Build all variants and combine into union
        const variantSchemas: AnySchema[] = builders.map(b => b._build());
        
        if (variantSchemas.length < 2) {
            // Single variant - still wrap in union result for consistent type flow
            const singleSchema = variantSchemas[0] ?? objectSchema({});
            return new DetailedOutputBuilderWithUnion(builders, singleSchema);
        }
        
        // Create union schema
        const unionOutputSchema = unionSchema(variantSchemas as unknown as UnionTuple);
        
        return new DetailedOutputBuilderWithUnion(builders, unionOutputSchema);
    }

    /**
     * Build array of builders into a union schema (static method)
     * 
     * @example
     * ```typescript
     * const unionSchema = DetailedOutputBuilder.buildFromArray([
     *   builder1,
     *   builder2,
     * ]);
     * ```
     */
    static buildFromArray<const T extends readonly DetailedOutputBuilder<AnySchema, AnySchema, SchemaShape, number, string | undefined, string | undefined>[]>(
        builders: T
    ): AnySchema {
        const variantSchemas: AnySchema[] = builders.map(b => b._build());
        
        if (variantSchemas.length < 2) {
            return variantSchemas[0] ?? objectSchema({});
        }
        
        return unionSchema(variantSchemas as unknown as UnionTuple);
    }

    /**
     * Build the final detailed output schema
     * @internal
     */
    _build(): ObjectSchema<DetailedOutputObjectShape<TResultBody, TResultHeaders, TResultStatus, TBrand>> {
        const shape: SchemaShape = {
            status: literalSchema(this._resultStatus),
            body: this._resultBody,
        };

        // Add headers if present or if brand is set
        if (Object.keys(this._resultHeaders).length > 0 || this._brand) {
            const headersShape: SchemaShape = { ...this._resultHeaders };
            
            if (this._brand) {
                headersShape['x-brand'] = literalSchema(this._brand);
            }
            
            shape.headers = objectSchema(headersShape);
        }

        const schema = objectSchema(shape) as unknown as ObjectSchema<DetailedOutputObjectShape<TResultBody, TResultHeaders, TResultStatus, TBrand>>;
        
        // Add DetailedOutputBrand symbol for runtime detection
        // This allows RouteBuilder to distinguish DetailedOutput from regular ObjectSchema
        const DetailedOutputBrand = Symbol.for('DetailedOutputBrand');
        (schema as unknown as Record<symbol, boolean>)[DetailedOutputBrand] = true;
        
        return schema;
    }
}

/**
 * Result type from DetailedOutputBuilder.union() - carries the builder types
 * for proper type-level union extraction in RouteBuilder's output() overload.
 * 
 * Distinguished from DetailedOutputBuilder by the `__unionBuilders` brand property,
 * ensuring correct overload resolution in RouteBuilder.output().
 */
export type DetailedOutputUnionResult<
    TBuilders extends readonly DetailedOutputBuilder<AnySchema, AnySchema, SchemaShape, number, string | undefined, string | undefined, AnySchema>[]
> = {
    readonly __unionBuilders: TBuilders;
    _build(): AnySchema;
}

/**
 * Extended DetailedOutputBuilder that holds a pre-built union schema
 * Used internally by union() method to return the union schema directly.
 * Does NOT extend DetailedOutputBuilder so overload resolution can distinguish them.
 * @internal
 */
class DetailedOutputBuilderWithUnion<
    TBuilders extends readonly DetailedOutputBuilder<AnySchema, AnySchema, SchemaShape, number, string | undefined, string | undefined, AnySchema>[]
> implements DetailedOutputUnionResult<TBuilders> {
    readonly __unionBuilders: TBuilders;
    private _unionSchema: AnySchema;

    constructor(builders: TBuilders, unionSchemaValue: AnySchema) {
        this.__unionBuilders = builders;
        this._unionSchema = unionSchemaValue;
    }

    /**
     * Return the union schema directly
     * @internal
     */
    _build(): AnySchema {
        return this._unionSchema;
    }
}

/**
 * Create a detailed output builder
 */
export function createDetailedOutputBuilder<TBody extends AnySchema, TEntitySchema extends AnySchema = VoidSchema>(
    initialBody: TBody,
    entitySchema?: TEntitySchema
): DetailedOutputBuilder<TBody, TBody, Record<never, never>, 200, undefined, undefined, TEntitySchema> {
    return new DetailedOutputBuilder(initialBody, initialBody, {} as Record<never, never>, 200, undefined, undefined, entitySchema);
}

/**
 * Create an output variant builder
 */
export function createOutputVariantBuilder(): OutputVariantBuilder {
    return new OutputVariantBuilder();
}
