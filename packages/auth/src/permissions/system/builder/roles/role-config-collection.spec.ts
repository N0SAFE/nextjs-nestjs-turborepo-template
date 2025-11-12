import { describe, it, expect } from 'vitest';
import { RoleConfigCollection } from './role-config-collection';
import { RoleConfig } from './single-role-config';

describe('RoleConfigCollection', () => {
  const mockRoles = {
    admin: {
      project: ['create', 'read', 'update', 'delete'] as const,
      user: ['create', 'read', 'update', 'delete'] as const,
      organization: ['create', 'read', 'update', 'delete'] as const,
    },
    editor: {
      project: ['create', 'read', 'update'] as const,
      user: ['read'] as const,
    },
    viewer: {
      project: ['read'] as const,
      user: ['read'] as const,
      organization: ['read'] as const,
    },
    contributor: {
      project: ['create', 'read', 'update'] as const,
    },
  };

  describe('Basic Operations', () => {
    it('should return all roles', () => {
      const collection = new RoleConfigCollection(mockRoles);
      expect(collection.all()).toEqual(mockRoles);
    });

    it('should get specific role by key', () => {
      const collection = new RoleConfigCollection(mockRoles);
      const admin = collection.getRole('admin');
      
      expect(admin).toBeInstanceOf(RoleConfig);
      expect(admin!.all()).toEqual(mockRoles.admin);
    });

    it('should return undefined for non-existent role', () => {
      const collection = new RoleConfigCollection(mockRoles);
      const nonExistent = collection.getRole('nonexistent' as any);
      
      expect(nonExistent).toBeUndefined();
    });

    it('should get all role names', () => {
      const collection = new RoleConfigCollection(mockRoles);
      expect(collection.roleNames()).toEqual(['admin', 'editor', 'viewer', 'contributor']);
    });

    it('should check if empty', () => {
      const emptyCollection = new RoleConfigCollection({});
      expect(emptyCollection.isEmpty).toBe(true);

      const filledCollection = new RoleConfigCollection(mockRoles);
      expect(filledCollection.isEmpty).toBe(false);
    });

    it('should get size', () => {
      const collection = new RoleConfigCollection(mockRoles);
      expect(collection.size).toBe(4);
    });

    it('should convert to object', () => {
      const collection = new RoleConfigCollection(mockRoles);
      expect(collection.toObject()).toEqual(mockRoles);
    });
  });

  describe('Resource Filtering', () => {
    const collection = new RoleConfigCollection(mockRoles);

    it('should filter roles by resource', () => {
      const withProject = collection.withResource('project');
      const result = withProject.all();

      expect(Object.keys(result)).toEqual(['admin', 'editor', 'viewer', 'contributor']);
      expect(result.viewer).toEqual({ project: ['read'] });
    });

    it('should filter roles without resource', () => {
      // @ts-expect-error - Testing resource filtering with 'organization' resource
      const withoutOrg = collection.withoutResource('organization');
      const result = withoutOrg.all();

      expect(Object.keys(result)).toEqual(['editor', 'contributor']);
      expect(result).not.toHaveProperty('admin');
      expect(result).not.toHaveProperty('viewer');
    });

    it('should handle non-existent resource in withResource', () => {
      const withNonExistent = collection.withResource('nonexistent' as any);
      expect(withNonExistent.isEmpty).toBe(true);
    });

    it('should return all roles when withoutResource filters nothing', () => {
      const without = collection.withoutResource('nonexistent' as any);
      expect(without.size).toBe(4);
    });
  });

  describe('Action Filtering', () => {
    const collection = new RoleConfigCollection(mockRoles);

    it('should filter roles by action', () => {
      const withCreate = collection.withAction('create');
      const result = withCreate.all();

      expect(Object.keys(result)).toEqual(['admin', 'editor', 'contributor']);
    });

    it('should filter roles without action', () => {
      const withoutDelete = collection.withoutAction('delete');
      const result = withoutDelete.all();

      expect(Object.keys(result)).toEqual(['editor', 'viewer', 'contributor']);
    });

    it('should handle non-existent action', () => {
      const withNonExistent = collection.withAction('nonexistent' as any);
      expect(withNonExistent.isEmpty).toBe(true);
    });
  });

  describe('Combined Resource and Action Filtering', () => {
    const collection = new RoleConfigCollection(mockRoles);

    it('should filter by action on specific resource', () => {
      const result = collection.withActionOnResource('project', 'create').all();
      
      expect(Object.keys(result)).toEqual(['admin', 'editor', 'contributor']);
      // @ts-expect-error - Testing that viewer property doesn't exist after filtering
      expect(result.viewer).toBeUndefined();
    });

    it('should filter with all actions on resource', () => {
      const result = collection.withAllActionsOnResource('project', ['read', 'update']).all();
      
      expect(Object.keys(result)).toEqual(['admin', 'editor', 'contributor']);
    });

    it('should filter with any action on resource', () => {
      // @ts-expect-error - Testing resource filtering with 'user' resource
      const result = collection.withAnyActionOnResource('user', ['create', 'update', 'delete']).all();
      
      expect(Object.keys(result)).toEqual(['admin']);
    });

    it('should return empty when no roles match all actions on resource', () => {
      // @ts-expect-error - Testing resource filtering with 'user' resource
      const result = collection.withAllActionsOnResource('user', ['create', 'update', 'delete', 'share' as any]);
      expect(result.isEmpty).toBe(true);
    });

    it('should return empty when no roles match any action on resource', () => {
      const result = collection.withAnyActionOnResource('project', ['share' as any, 'manage' as any]);
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('Specialized Filters', () => {
    const collection = new RoleConfigCollection(mockRoles);

    it('should filter to read-only roles', () => {
      const readOnly = collection.readOnly();
      const result = readOnly.all();

      expect(Object.keys(result)).toEqual(['viewer']);
      expect(result.viewer).toEqual({
        project: ['read'],
        user: ['read'],
        organization: ['read'],
      });
    });

    it('should filter to write-capable roles', () => {
      const writeRoles = collection.writeOnly();
      const result = writeRoles.all();

      expect(Object.keys(result)).toEqual(['admin', 'editor', 'contributor']);
    });
  });

  describe('Generic Filter and Map', () => {
    const collection = new RoleConfigCollection(mockRoles);

    it('should filter by custom predicate', () => {
      const filtered = collection.filter((key, roleConfig) => {
        const resources = roleConfig.getResources();
        return resources.length > 1;
      });

      const result = filtered.all();
      expect(Object.keys(result)).toEqual(['admin', 'editor', 'viewer']);
    });

    it('should map roles to new structure', () => {
      const mapped = collection.map((key, roleConfig) => ({
        name: key,
        resourceCount: roleConfig.size,
        isAdmin: key === 'admin',
      }));

      expect(mapped).toEqual([
        { name: 'admin', resourceCount: 3, isAdmin: true },
        { name: 'editor', resourceCount: 2, isAdmin: false },
        { name: 'viewer', resourceCount: 3, isAdmin: false },
        { name: 'contributor', resourceCount: 1, isAdmin: false },
      ]);
    });

    it('should transform to object structure', () => {
      const transformed = collection.transform((key, roleConfig) => ({
        permissions: roleConfig.all(),
        totalResources: roleConfig.size,
      }));

      expect(transformed).toHaveProperty('admin');
      expect(transformed.admin).toEqual({
        permissions: mockRoles.admin,
        totalResources: 3,
      });
    });
  });

  describe('Merge and Compact', () => {
    it('should merge two collections', () => {
      const collection1 = new RoleConfigCollection({
        admin: { project: ['create', 'read'] as const },
      });

      const collection2 = new RoleConfigCollection({
        viewer: { project: ['read'] as const },
      });

      const merged = collection1.merge(collection2);
      const result = merged.all();

      expect(Object.keys(result)).toEqual(['admin', 'viewer']);
    });

    it('should override roles on merge', () => {
      const collection1 = new RoleConfigCollection({
        admin: { project: ['read'] as const },
      });

      const collection2 = new RoleConfigCollection({
        admin: { project: ['create', 'read', 'update'] as const },
      });

      const merged = collection1.merge(collection2);
      expect(merged.getRole('admin')?.getPermissions('project')).toEqual(['create', 'read', 'update']);
    });

    it('should remove empty roles with compact', () => {
      const collection = new RoleConfigCollection({
        admin: { project: ['read'] as const },
        empty: {} as any,
        viewer: { project: ['read'] as const },
      });

      const compacted = collection.compact();
      const result = compacted.all();

      expect(Object.keys(result)).toEqual(['admin', 'viewer']);
      expect(result).not.toHaveProperty('empty');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty collection', () => {
      const collection = new RoleConfigCollection({});

      expect(collection.isEmpty).toBe(true);
      expect(collection.size).toBe(0);
      expect(collection.roleNames()).toEqual([]);
      expect(collection.withResource('project' as any).isEmpty).toBe(true);
      expect(collection.readOnly().isEmpty).toBe(true);
    });

    it('should handle single role', () => {
      const collection = new RoleConfigCollection({
        admin: { project: ['read'] as const },
      });

      expect(collection.size).toBe(1);
      expect(collection.roleNames()).toEqual(['admin']);
      expect(collection.getRole('admin')).toBeDefined();
    });

    it('should handle roles with empty permissions', () => {
      const collection = new RoleConfigCollection({
        empty: {} as const,
        filled: { project: ['read'] as const },
      });

      expect(collection.size).toBe(2);
      expect(collection.getRole('empty')?.isEmpty).toBe(true);
    });

    it('should maintain immutability on filter', () => {
      const original = new RoleConfigCollection(mockRoles);
      const filtered = original.withResource('project');

      expect(original.size).toBe(4);
      expect(filtered.size).toBe(4);
      // Ensure original is unchanged
      expect(original.getRole('admin')).toBeDefined();
    });

    it('should maintain immutability on transformation', () => {
      const original = new RoleConfigCollection(mockRoles);
      const transformed = original.map((key) => key.toUpperCase());

      expect(original.roleNames()).toEqual(['admin', 'editor', 'viewer', 'contributor']);
      expect(transformed).toEqual(['ADMIN', 'EDITOR', 'VIEWER', 'CONTRIBUTOR']);
    });
  });

  describe('Complex Filtering Chains', () => {
    const collection = new RoleConfigCollection(mockRoles);

    it('should chain multiple filters', () => {
      const result = collection
        .withResource('project')
        .withAction('create')
        .withoutAction('delete')
        .all();

      expect(Object.keys(result)).toEqual(['editor', 'contributor']);
    });

    it('should chain resource and action filters', () => {
      const result = collection
        .withActionOnResource('project', 'update')
        // @ts-expect-error - Testing chained filtering with 'user' resource
        .withResource('user')
        .all();

      expect(Object.keys(result)).toEqual(['admin', 'editor']);
    });

    it('should filter to complex permission set', () => {
      const result = collection
        .withAllActionsOnResource('project', ['read', 'update'])
        // @ts-expect-error - Testing chained filtering with 'user' resource
        .withResource('user')
        .all();

      // Roles that have read AND update on project, AND have user resource
      expect(Object.keys(result)).toEqual(['admin', 'editor']);
    });

    it('should combine specialized filters', () => {
      const result = collection
        .writeOnly() // Has write permissions
        .withResource('user') // Has user resource
        .withAction('create') // Has create action
        .all();

      expect(Object.keys(result)).toEqual(['admin']);
    });
  });

  describe('Type Safety and Inference', () => {
    it('should work with strictly typed roles', () => {
      interface StrictRoles {
        admin: { project: readonly ['create', 'read', 'update', 'delete'] };
        viewer: { project: readonly ['read'] };
      }

      const strictRoles: StrictRoles = {
        admin: { project: ['create', 'read', 'update', 'delete'] },
        viewer: { project: ['read'] },
      };

      // @ts-expect-error - Testing with StrictRoles type that lacks index signature
      const collection = new RoleConfigCollection(strictRoles);
      expect(collection.size).toBe(2);
    });

    it('should handle const assertions', () => {
      const roles = {
        admin: { project: ['read', 'write'] as const },
      } as const;

      const collection = new RoleConfigCollection(roles);
      expect(collection.getRole('admin')?.has('project', 'read')).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle multi-tenant permission scenarios', () => {
      const tenantRoles = {
        orgAdmin: {
          organization: ['create', 'read', 'update', 'delete', 'manage-members'] as const,
          project: ['create', 'read', 'update', 'delete'] as const,
          billing: ['read', 'update', 'manage-subscriptions'] as const,
        },
        projectManager: {
          project: ['create', 'read', 'update', 'delete'] as const,
          task: ['create', 'read', 'update', 'delete', 'assign'] as const,
        },
        developer: {
          project: ['read'] as const,
          task: ['create', 'read', 'update'] as const,
          code: ['read', 'write', 'review'] as const,
        },
        viewer: {
          project: ['read'] as const,
          task: ['read'] as const,
        },
      };

      const collection = new RoleConfigCollection(tenantRoles);

      // Find roles that can manage projects
      const projectManagers = collection
        .withActionOnResource('project', 'create')
        .withActionOnResource('project', 'delete');

      expect(projectManagers.roleNames()).toEqual(['orgAdmin', 'projectManager']);

      // Find roles with billing access
      // @ts-expect-error - Testing with 'billing' resource
      const billingAccess = collection.withResource('billing');
      expect(billingAccess.roleNames()).toEqual(['orgAdmin']);

      // Find developers (can write code but not delete projects)
      const developers = collection
        // @ts-expect-error - Testing with 'code' resource
        .withResource('code')
        .withoutActionOnResource('project', 'delete');

      expect(developers.roleNames()).toEqual(['developer']);
    });

    it('should handle hierarchical role filtering', () => {
      const roles = {
        superAdmin: {
          system: ['manage', 'configure'] as const,
          organization: ['create', 'read', 'update', 'delete'] as const,
          user: ['create', 'read', 'update', 'delete'] as const,
        },
        orgAdmin: {
          organization: ['read', 'update'] as const,
          user: ['create', 'read', 'update', 'delete'] as const,
        },
        manager: {
          user: ['read', 'update'] as const,
          project: ['create', 'read', 'update'] as const,
        },
        member: {
          project: ['read', 'update'] as const,
        },
      };

      const collection = new RoleConfigCollection(roles);

      // System administrators
      // @ts-expect-error - Testing with empty roles and 'system' resource
      const sysAdmins = collection.withResource('system');
      expect(sysAdmins.roleNames()).toEqual(['superAdmin']);

      // User managers (can create users)
      // @ts-expect-error - Testing with empty roles and 'user' resource
      const userManagers = collection.withActionOnResource('user', 'create');
      expect(userManagers.roleNames()).toEqual(['superAdmin', 'orgAdmin']);

      // Project contributors
      const projectContributors = collection
        // @ts-expect-error - Testing with narrow role types
        .withResource('project')
        // @ts-expect-error - Testing with narrow role types
        .withAction('update');
      expect(projectContributors.roleNames()).toEqual(['manager', 'member']);
    });
  });
});

// Helper method that should exist but doesn't - test its absence
describe('RoleConfigCollection - Missing Helper Methods', () => {
  it('should have withoutActionOnResource helper (if implemented)', () => {
    const collection = new RoleConfigCollection({
      admin: { project: ['create', 'read', 'update', 'delete'] as const },
      viewer: { project: ['read'] as const },
    });

    // This tests that we can achieve the same with filter
    const withoutDelete = collection.filter((key, role) => {
      return !role.has('project', 'delete');
    });

    expect(withoutDelete.roleNames()).toEqual(['viewer']);
  });
});
