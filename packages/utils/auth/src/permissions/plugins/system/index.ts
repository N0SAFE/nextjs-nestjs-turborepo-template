/**
 * System-level plugin exports for permissions/plugins
 */

export {
  PluginWrapperRegistry,
  type PluginWrapper,
  type PluginWrapperFactory,
} from './registry';

export {
  type WithAuthPlugins,
  type MinimalAuth,
} from './auth-with-plugins';

export {
  BasePluginWrapper,
  type BasePluginWrapperOptions,
  type AnyPluginWrapper,
  type InferParams,
  type ExtractBody,
  type ExtractQuery,
  type InferSessionFromAuth,
  // Error classes for assertion failures
  PermissionAssertionError,
  RoleAssertionError,
} from './base-plugin-wrapper';

export {
  type AnyPermissionBuilder,
  type InferStatementFromBuilder,
  type InferRolesFromBuilder,
  type InferRoleNamesFromBuilder,
} from './type-inference';

// Assertion system - for creating plugin methods that return assertion definitions
export {
  type AssertionDefinition,
  type AssertionMetadata,
  type CompositePayload,
  type CompositeOperator,
  type InferPayload,
  createAssertion,
  createAssertionMetadata,
  assertAll,
  assertAny,
  assertNot,
  isAssertionDefinition,
  isAssertionMetadata,
  isCompositeAssertion,
} from './assertion';
