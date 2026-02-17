/**
 * Output proxy layer.
 *
 * Keeps RouteBuilder-specific wiring minimal while the heavy output-building
 * behavior lives in `./builder.ts`.
 */

import type { AnySchema, HTTPMethod, ErrorMap } from "../../shared/types";
import type { VoidSchema } from "../../shared/standard-schema-helpers";
import type { RouteBuilder, DetailedOutput } from "../core/route-builder";
import { DetailedOutputBuilder } from "./builder";

export {
    type ExtractOutputBody,
    type ExtractOutputStatus,
    type ExtractOutputHeaders,
    type OutputSchemaProxySchema,
    isDetailedMode,
    DetailedOutputBuilder,
} from "./builder";

/**
 * Route-aware output schema proxy.
 *
 * This class only provides:
 * - access to RouteBuilder context (`entitySchema`),
 * - immutable proxy creation hook (`_create`).
 *
 * All output mutation/union logic is inherited from `DetailedOutputBuilder`.
 */
export class OutputSchemaProxy<
    TData extends AnySchema | DetailedOutput = VoidSchema,
    TMethod extends HTTPMethod = "GET",
    TEntitySchema extends AnySchema = VoidSchema,
    TErrors extends ErrorMap = Record<string, never>,
> extends DetailedOutputBuilder<TData, TMethod, TEntitySchema, TErrors> {
    readonly _routeBuilder: RouteBuilder<AnySchema, AnySchema, TMethod, TEntitySchema, TErrors>;

    constructor(routeBuilder: RouteBuilder<AnySchema, AnySchema, TMethod, TEntitySchema, TErrors>, data: TData) {
        super(data);
        this._routeBuilder = routeBuilder;
    }

    /** Create next immutable proxy instance with updated output state. */
    protected _create<TNewData extends AnySchema | DetailedOutput>(data: TNewData): OutputSchemaProxy<TNewData, TMethod, TEntitySchema, TErrors> {
        return new OutputSchemaProxy(this._routeBuilder, data);
    }

    /** Expose entity schema from route context. */
    protected _getEntitySchema(): TEntitySchema | undefined {
        return this._routeBuilder.getEntitySchema();
    }
}

/**
 * Create an output proxy from a RouteBuilder instance.
 */
export function createOutputSchemaProxy<TOutput extends AnySchema | DetailedOutput, TMethod extends HTTPMethod, TEntitySchema extends AnySchema, TErrors extends ErrorMap>(
    routeBuilder: RouteBuilder<AnySchema, TOutput, TMethod, TEntitySchema, TErrors>,
): OutputSchemaProxy<TOutput, TMethod, TEntitySchema, TErrors> {
    const rb = routeBuilder as unknown as RouteBuilder<AnySchema, AnySchema, TMethod, TEntitySchema, TErrors>;
    const data = routeBuilder.getOutputSchema();
    return new OutputSchemaProxy<TOutput, TMethod, TEntitySchema, TErrors>(rb, data);
}
