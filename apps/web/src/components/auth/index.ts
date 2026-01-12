// Permission-aware components for the Permission System Showcase
// These components conditionally render children based on user permissions

// Platform Role component - checks user's global platform role
export {
  RequirePlatformRole,
  usePlatformRole,
  type RequirePlatformRoleProps,
} from './RequirePlatformRole'

// Organization Role component - checks user's role within an organization  
export {
  RequireOrganizationRole,
  RequireRole, // Alias for spec compatibility
  useOrganizationRole,
  useOrgRole, // Alias
  type RequireOrganizationRoleProps,
} from './RequireOrganizationRole'

