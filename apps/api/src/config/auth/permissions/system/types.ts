import type { createAccessControl } from 'better-auth/plugins/access';

export type AccessControlRoles = Record<
  string,
  ReturnType<ReturnType<typeof createAccessControl>['newRole']>
>;

export type Resource = string;

export type ResourceActions = {
  [K in Resource]: string[];
};

export type ActionsForResource<T extends Resource> = string;

export type Permission<T extends Resource = Resource> = {
  [K in T]?: string[];
};

export type RoleName = string;

export type AuthenticatedUserType = {
  id: string;
  email: string;
  role?: string;
  permissions?: Record<string, string[]>;
};

export type CommonPermissionPattern<T extends Resource = Resource> = Permission<T>;

export type StrictPermission<T extends Resource> = {
  [K in T]: string[];
};

export type RoleLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type AllRoleNames = string;

export type PermissionTypes = {
  Resource: Resource;
  Permission: Permission;
  RoleName: RoleName;
};

export type AccessControlInstance = ReturnType<typeof createAccessControl>;
