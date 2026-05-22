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
export type { InferInputSchema, InferOutputSchema, AnyContractBuilder, AnyContractProcedureOrBuilder } from "./utils/type-helpers";
export {
    observable,
    getObservableSchemaDetails,
    OBSERVABLE_DETAILS_SYMBOL,
    type Observable,
    type ObservableObserver,
    type ObservableSubscription,
    type ObservableSchemaDetails,
} from "./utils/observable/contract";
export {
    createDirectObservable,
    createEventIteratorFrame,
    isEventIteratorFrame,
    serializeEventIteratorFrame,
    deserializeEventIteratorFrame,
    deconstructObservableToEventIterator,
    reconstructObservableFromEventIterator,
    type DirectObservable,
    type DirectObserver,
    type DirectSubscription,
    type EventIteratorFrame,
    type EventIteratorFrameKind,
    type EventIteratorProtocolVersion,
    type EventSerializer,
    type EventDeserializer,
} from "./utils/observable/event-iterator";
export {
    createObservableQueryUtils,
    type ObservableQueryMode,
    type ObservablePipeInvoker,
    type ObservablePipeTransform,
    type ObservableQueryFnOptions,
    type StreamedObservableQueryFnOptions,
    type ObservableOptionsConfig,
    type StreamedObservableOptionsConfig,
    type ObservableProcedureQueryUtils,
    type ObservableQueryUtils,
} from "./utils/observable/tanstack-query";

// Re-export RxJS primitives to avoid requiring direct app-level rxjs installs.
export {
    Observable as RxObservable,
    Subscription as RxSubscription,
} from "rxjs";
