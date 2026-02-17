import type { AnySchema } from "../../shared/types";
import type { ObjectSchema, OptionalSchema, ShouldBeOptional, VoidSchema } from "../../shared/standard-schema-helpers";
import { DetailedInputBuilder } from "./builder";
import type { DetailedInputBuilderSchema } from "./builder";

export type InputSchemaProxySchema<
    TParams extends AnySchema,
    TQuery extends AnySchema,
    TBody extends AnySchema,
    THeaders extends AnySchema,
> = DetailedInputBuilderSchema<TParams, TQuery, TBody, THeaders>;

export class InputSchemaProxy<
    TParams extends AnySchema = VoidSchema,
    TQuery extends AnySchema = VoidSchema,
    TBody extends AnySchema = VoidSchema,
    THeaders extends AnySchema = VoidSchema,
    TEntitySchema extends AnySchema = VoidSchema,
> extends DetailedInputBuilder<TParams, TQuery, TBody, THeaders, TEntitySchema> {
    override get schema(): InputSchemaProxySchema<TParams, TQuery, TBody, THeaders> {
        return super.schema;
    }

    override _build(): ObjectSchema<{
        params: ShouldBeOptional<TParams> extends true ? OptionalSchema<TParams> : TParams;
        query: ShouldBeOptional<TQuery> extends true ? OptionalSchema<TQuery> : TQuery;
        body: ShouldBeOptional<TBody> extends true ? OptionalSchema<TBody> : TBody;
        headers: ShouldBeOptional<THeaders> extends true ? OptionalSchema<THeaders> : THeaders;
    }> {
        return super._build();
    }
}
