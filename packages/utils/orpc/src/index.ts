// Re-export all builder functionality
export * from "./builder";
export * from "./query";

// Re-export standard operations (unified entry point)
export {
    standard,
    ZodStandardOperations,
    zodStandard,
    createZodStandardOperations,
    BaseStandardOperations,
    ListOperationBuilder,
    createListConfig,
    createFilterConfig,
    type ZodEntitySchema,
    type ZodEntityOperationOptions,
    type EntityOperationOptions,
    type ListOperationOptions,
    type ListPlainOptions,
    type BuilderFilterField,
} from "./standard";

// Explicitly re-export the standard module's ComputeInputSchema/ComputeOutputSchema
// (overrides the query module's version which uses flattened filter fields)
export type {
    ComputeInputSchema,
    ComputeOutputSchema,
} from "./standard/zod/utils/query-builder";

// Convenience re-exports for most common use cases
export { RouteBuilder, route } from "./builder/core/route-builder";
export { QueryBuilder, createQueryBuilder, createListQuery, createSearchQuery, createAdvancedQuery } from "./query";
