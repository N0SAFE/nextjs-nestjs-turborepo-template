import type { Resource, Permission, RoleName } from "./system/types";
import { permissionConfig } from "./config";

const statement = permissionConfig.statement;
const roles = permissionConfig.getRoles();

export class PermissionChecker {
  static validatePermission<T extends Resource>(
    permissions: Permission<T>
  ): boolean {
    for (const [resource, actions] of Object.entries(permissions)) {
      if (!(resource in statement)) {
        return false;
      }

      const validActions = statement[resource as keyof typeof statement];
      for (const action of actions as string[]) {
        if (!validActions.includes(action as never)) {
          return false;
        }
      }
    }

    return true;
  }

  static hasRole(userRoles: string | string[], roleName: string): boolean {
    if (typeof userRoles === "string") {
      return userRoles
        .split(",")
        .map((r) => r.trim())
        .includes(roleName);
    }
    return userRoles.includes(roleName);
  }

  static extractRoles(userRoles: string): RoleName[] {
    return userRoles
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r in roles);
  }

  static getUserRoles(userRoleString: string): RoleName[] {
    return this.extractRoles(userRoleString);
  }

  static isValidRoleName(role: string): role is RoleName {
    return Object.prototype.hasOwnProperty.call(roles, role);
  }

  static isValidResource(resource: string): resource is Resource {
    return Object.prototype.hasOwnProperty.call(statement, resource);
  }

  static isValidActionForResource(resource: keyof typeof statement, action: string): boolean {
    if (!this.isValidResource(resource)) return false;
    const resourceActions = statement[resource];
    return resourceActions.includes(action as never);
  }

  static getActionsForResource(resource: keyof typeof statement): readonly string[] {
    if (!this.isValidResource(resource)) return [];
    return statement[resource];
  }

  static getAllResources(): Resource[] {
    return Object.keys(statement);
  }

  static getAllRoles(): RoleName[] {
    return Object.keys(roles);
  }

   
   
  static hasHigherPrivilege(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userRole: RoleName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _requiredRole: RoleName
  ): boolean {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getRoleLevel(_role: RoleName): number {
    return 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userHasRole(_userId: string, _role: string): Promise<boolean> {
    throw new Error("Implement userHasRole based on your auth system");
  }

   
  userHasPermissions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    permissions: Record<string, string[]>
  ): Promise<boolean> {
    throw new Error("Implement userHasPermissions based on your auth system");
  }
}

export function createPermission<T extends Resource>(
  permissions: Permission<T>
): Permission<T> {
  if (!PermissionChecker.validatePermission(permissions)) {
    throw new Error("Invalid permission structure provided");
  }
  return permissions;
}
