import { statement, ac, roles, schemas } from "./config";

// Export all system classes and types
export * from "./system";

// Export built configuration
export { statement, ac, roles, schemas };

// Export role names constant and type for type-safe role access
export { ROLE_NAMES, type RoleName } from './config';

// Export resource names constant and types for type-safe resource access
export { RESOURCE_NAMES, type ResourceName, type ActionsForResource } from './config';

// Export common permissions
export { commonPermissions, type CommonPermissionKeys, type CommonPermission } from "./common";

// Export utilities
export * from './utils';

// Export access control utilities
export * from './access-control';

