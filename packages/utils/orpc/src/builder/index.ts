// V2 Builder exports (primary)
export { RouteBuilder, route } from "./core/route-builder";
export { DetailedInputBuilder, createDetailedInputBuilder } from "./input/builder";
export { InputSchemaProxy, type InputSchemaProxySchema } from "./input/proxy";
export { DetailedOutputBuilder } from "./output/builder";
export { OutputSchemaProxy, type OutputSchemaProxySchema } from "./output/proxy";
export { ErrorDefinitionBuilder, error } from "./core/error-builder";
export { createPathParamBuilder, type PathParam, type PathParamBuilder, type PathParamBuilderWithExisting } from "./core/params-builder";
export * from "../shared/types";
export * from "../shared/standard-schema-helpers";
export * from "../shared/route-method-meta";
