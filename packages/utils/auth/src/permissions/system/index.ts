// Export core builder
export { PermissionBuilder, RoleBuilder } from './builder/builder';

// Export base configuration class
export { BaseConfig } from './builder/shared/base-config';

// Export statement configuration classes
export { StatementConfig } from './builder/statements/single-statement-config';
export { StatementsConfig } from './builder/statements/statements-config';
export { StatementConfigCollection } from './builder/statements/statement-config-collection';

// Export role configuration classes
export { RoleConfig } from './builder/roles/single-role-config';
export { RolesConfig } from './builder/roles/roles-config';
export { RoleConfigCollection } from './builder/roles/role-config-collection';

// Export types
export type {
  Permission,
  Resource,
  ResourceActions,
  ActionsForResource,
  RoleName,
  AuthenticatedUserType,
  CommonPermissionPattern,
  StrictPermission,
  RoleLevel,
  AllRoleNames,
  PermissionTypes,
  AccessControlInstance,
} from './types';
