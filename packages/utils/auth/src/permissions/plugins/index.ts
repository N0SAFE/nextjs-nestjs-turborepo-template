/**
 * Plugin Exports - Context-Aware Permission Wrappers
 * 
 * Each plugin wraps Better Auth plugin methods with automatic header injection.
 * This provides a clean API for ORPC handlers that don't require manual header passing.
 */

// System registry and types
export * from './system';

// Admin permissions plugin
export { 
  AdminPermissionsPlugin, 
  type AdminPlugin,
  type AdminPluginInstance,
  type AuthWithAdminPlugin,
  type AdminPluginWrapperOptions,
  type ApiMethodsWithAdminPlugin,
} from './admin.permissions.plugin';

// Organizations permissions plugin  
export { 
  OrganizationsPermissionsPlugin, 
  type OrganizationsPlugin,
  type OrganizationPluginInstance,
  type AuthWithOrganizationPlugin,
  type OrganizationsPluginWrapperOptions,
  type ApiMethodsWithOrganizationPlugin,
} from './organizations.permissions.plugin';
