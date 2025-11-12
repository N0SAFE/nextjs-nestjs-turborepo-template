import { describe, it, expect } from 'vitest';
import { RoleConfig } from './single-role-config';

describe('RoleConfig', () => {
  describe('Basic Operations', () => {
    const roleData = {
      project: ['create', 'read', 'update'] as const,
      user: ['read'] as const,
      organization: ['read', 'update'] as const,
    };

    it('should return all role data', () => {
      const config = new RoleConfig(roleData);
      expect(config.all()).toEqual(roleData);
    });

    it('should build role data (same as all)', () => {
      const config = new RoleConfig(roleData);
      expect(config.build()).toEqual(roleData);
    });

    it('should convert to object', () => {
      const config = new RoleConfig(roleData);
      expect(config.toObject()).toEqual(roleData);
    });

    it('should access raw property', () => {
      const config = new RoleConfig(roleData);
      expect(config.raw).toEqual(roleData);
    });

    it('should get size', () => {
      const config = new RoleConfig(roleData);
      expect(config.size).toBe(3); // 3 resources
    });

    it('should check if empty', () => {
      const emptyConfig = new RoleConfig({});
      expect(emptyConfig.isEmpty).toBe(true);

      const filledConfig = new RoleConfig(roleData);
      expect(filledConfig.isEmpty).toBe(false);
    });
  });

  describe('Permission Checking', () => {
    const roleData = {
      project: ['create', 'read', 'update', 'delete'] as const,
      user: ['read'] as const,
      organization: ['read', 'update'] as const,
    };
    const config = new RoleConfig(roleData);

    it('should check if has resource', () => {
      expect(config.has('project')).toBe(true);
      expect(config.has('nonexistent' as any)).toBe(false);
    });

    it('should check if has specific action on resource', () => {
      expect(config.has('project', 'read')).toBe(true);
      expect(config.has('project', 'share' as any)).toBe(false);
      expect(config.has('nonexistent' as any, 'read')).toBe(false);
    });

    it('should check if has all permissions', () => {
      expect(config.hasAll([
        { resource: 'project', action: 'read' },
        { resource: 'user', action: 'read' },
      ])).toBe(true);

      expect(config.hasAll([
        { resource: 'project', action: 'read' },
        { resource: 'project', action: 'share' as any },
      ])).toBe(false);

      expect(config.hasAll([])).toBe(true);
    });

    it('should check if has any permissions', () => {
      expect(config.hasAny([
        { resource: 'project', action: 'read' },
        { resource: 'project', action: 'share' as any },
      ])).toBe(true);

      expect(config.hasAny([
        { resource: 'nonexistent' as any, action: 'read' },
        { resource: 'project', action: 'share' as any },
      ])).toBe(false);

      expect(config.hasAny([])).toBe(false);
    });

    it('should check can (alias for has)', () => {
      expect(config.can('project', 'read')).toBe(true);
      expect(config.can('project', 'share' as any)).toBe(false);
    });

    it('should check cannot (inverse of can)', () => {
      expect(config.cannot('project', 'share' as any)).toBe(true);
      expect(config.cannot('project', 'read')).toBe(false);
    });
  });

  describe('Resource Queries', () => {
    const roleData = {
      project: ['create', 'read', 'update', 'delete'] as const,
      user: ['read'] as const,
      organization: ['read', 'update'] as const,
    };
    const config = new RoleConfig(roleData);

    it('should get permissions for resource', () => {
      expect(config.getPermissions('project')).toEqual(['create', 'read', 'update', 'delete']);
      expect(config.getPermissions('user')).toEqual(['read']);
      expect(config.getPermissions('nonexistent' as any)).toEqual([]);
    });

    it('should get all resources', () => {
      const resources = config.getResources();
      expect(resources).toEqual(['project', 'user', 'organization']);
    });
  });

  describe('Filtering Operations', () => {
    const roleData = {
      project: ['create', 'read', 'update', 'delete'] as const,
      user: ['read'] as const,
      organization: ['read', 'update'] as const,
      billing: ['create', 'read', 'update'] as const,
    };
    const config = new RoleConfig(roleData);

    it('should filter resources by predicate', () => {
      const filtered = config.filter((resource, actions) => 
        actions.includes('create')
      );

      expect(filtered.all()).toEqual({
        project: ['create', 'read', 'update', 'delete'],
        billing: ['create', 'read', 'update'],
      });
    });

    it('should filter to only read-only resources', () => {
      const readOnly = config.readOnly();
      expect(readOnly.all()).toEqual({
        user: ['read'],
      });
    });

    it('should filter to only write resources', () => {
      const writeOnly = config.writeOnly();
      expect(writeOnly.all()).toEqual({
        project: ['create', 'read', 'update', 'delete'],
        organization: ['read', 'update'],
        billing: ['create', 'read', 'update'],
      });
    });

    it('should return original when no filter matches readOnly', () => {
      const noReadOnly = new RoleConfig({
        project: ['create', 'update'] as const,
      });
      const filtered = noReadOnly.readOnly();
      expect(filtered.all()).toEqual({});
    });
  });

  describe('Map Operations', () => {
    const roleData = {
      project: ['create', 'read'] as const,
      user: ['read'] as const,
    };
    const config = new RoleConfig(roleData);

    it('should map to new structure', () => {
      const mapped = config.map((resource, actions) => ({
        name: resource,
        actionCount: actions.length,
      }));

      expect(mapped).toEqual([
        { name: 'project', actionCount: 2 },
        { name: 'user', actionCount: 1 },
      ]);
    });

    it('should map and extract specific values', () => {
      const resourceNames = config.map((resource) => resource.toUpperCase());
      expect(resourceNames).toEqual(['PROJECT', 'USER']);
    });
  });

  describe('Equality Checking', () => {
    const roleData1 = {
      project: ['create', 'read'] as const,
      user: ['read'] as const,
    };

    const roleData2 = {
      project: ['create', 'read'] as const,
      user: ['read'] as const,
    };

    const roleData3 = {
      project: ['create', 'read', 'update'] as const,
      user: ['read'] as const,
    };

    const roleData4 = {
      project: ['create', 'read'] as const,
    };

    it('should return true for equal configs', () => {
      const config1 = new RoleConfig(roleData1);
      const config2 = new RoleConfig(roleData2);
      expect(config1.equals(config2)).toBe(true);
    });

    it('should return false for different action counts', () => {
      const config1 = new RoleConfig(roleData1);
      const config3 = new RoleConfig(roleData3);
      // @ts-expect-error - Testing equality with incompatible types (different action counts)
      expect(config1.equals(config3)).toBe(false);
    });

    it('should return false for different resource counts', () => {
      const config1 = new RoleConfig(roleData1);
      const config4 = new RoleConfig(roleData4);
      // @ts-expect-error - Testing equality with incompatible types (different resource counts)
      expect(config1.equals(config4)).toBe(false);
    });

    it('should handle empty configs', () => {
      const empty1 = new RoleConfig({});
      const empty2 = new RoleConfig({});
      expect(empty1.equals(empty2)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty role data', () => {
      const config = new RoleConfig({});
      
      expect(config.all()).toEqual({});
      expect(config.isEmpty).toBe(true);
      expect(config.size).toBe(0);
      expect(config.getResources()).toEqual([]);
      // @ts-expect-error - Testing has() with non-existent resource
      expect(config.has('anything' as any)).toBe(false);
    });

    it('should handle single resource', () => {
      const config = new RoleConfig({
        project: ['read'] as const,
      });

      expect(config.size).toBe(1);
      expect(config.has('project')).toBe(true);
      expect(config.getPermissions('project')).toEqual(['read']);
    });

    it('should handle resource with empty actions', () => {
      const config = new RoleConfig({
        project: [] as const,
      });

      expect(config.has('project')).toBe(true);
      expect(config.has('project', 'read')).toBe(false);
      expect(config.getPermissions('project')).toEqual([]);
    });

    it('should handle undefined/null in permission checks', () => {
      const config = new RoleConfig({
        project: ['read'] as const,
      });

      expect(config.has('project', undefined as any)).toBe(false);
    });

    it('should maintain immutability in filter operations', () => {
      const original = new RoleConfig({
        project: ['create', 'read'] as const,
        user: ['read'] as const,
      });

      const filtered = original.filter((_, actions) => actions.length > 1);

      expect(original.size).toBe(2);
      expect(filtered.size).toBe(1);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple resource types with varied permissions', () => {
      const config = new RoleConfig({
        project: ['create', 'read', 'update', 'delete', 'share'] as const,
        user: ['read'] as const,
        organization: ['read', 'update'] as const,
        billing: ['read'] as const,
        settings: ['read', 'update'] as const,
      });

      // Check complex permissions
      expect(config.hasAll([
        { resource: 'project', action: 'create' },
        { resource: 'user', action: 'read' },
        { resource: 'billing', action: 'read' },
      ])).toBe(true);

      // Filter to write-capable resources
      const writeCapable = config.filter((_, actions) => 
        actions.some(a => ['create', 'update', 'delete'].includes(a))
      );

      expect(writeCapable.size).toBe(3); // project, organization, settings
    });

    it('should chain operations correctly', () => {
      const config = new RoleConfig({
        project: ['create', 'read', 'update', 'delete'] as const,
        user: ['read'] as const,
        organization: ['read', 'update'] as const,
        billing: ['create', 'update'] as const,
      });

      // Chain filter and map
      const result = config
        .filter((_, actions) => actions.includes('create'))
        .map((resource) => resource.toUpperCase());

      expect(result).toEqual(['PROJECT', 'BILLING']);
    });
  });
});
