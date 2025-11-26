import { describe, it, expect } from 'vitest';
import { StatementConfigCollection } from './statement-config-collection';
import { StatementConfig } from './single-statement-config';

describe('StatementConfigCollection', () => {
  const mockStatements = {
    project: ['create', 'read', 'update', 'delete', 'share'] as const,
    user: ['create', 'read', 'update', 'delete'] as const,
    organization: ['read', 'update'] as const,
    billing: ['read'] as const,
  };

  describe('Basic Operations', () => {
    it('should return all statements', () => {
      const collection = new StatementConfigCollection(mockStatements);
      expect(collection.all()).toEqual(mockStatements);
    });

    it('should get all resource names', () => {
      const collection = new StatementConfigCollection(mockStatements);
      expect(collection.resources()).toEqual(['project', 'user', 'organization', 'billing']);
    });

    it('should get specific resource by key', () => {
      const collection = new StatementConfigCollection(mockStatements);
      const project = collection.getResource('project');
      
      expect(project).toBeInstanceOf(StatementConfig);
      expect(project?.all()).toEqual(['create', 'read', 'update', 'delete', 'share']);
    });

    it('should return undefined for non-existent resource', () => {
      const collection = new StatementConfigCollection(mockStatements);
      const nonExistent = collection.getResource('nonexistent' as any);
      
      expect(nonExistent).toBeUndefined();
    });

    it('should check if empty', () => {
      const emptyCollection = new StatementConfigCollection({});
      expect(emptyCollection.isEmpty).toBe(true);

      const filledCollection = new StatementConfigCollection(mockStatements);
      expect(filledCollection.isEmpty).toBe(false);
    });

    it('should get size', () => {
      const collection = new StatementConfigCollection(mockStatements);
      expect(collection.size).toBe(4);
    });

    it('should convert to object', () => {
      const collection = new StatementConfigCollection(mockStatements);
      expect(collection.toObject()).toEqual(mockStatements);
    });
  });

  describe('Pick Operations', () => {
    const collection = new StatementConfigCollection(mockStatements);

    it('should pick specific actions from all resources', () => {
      const picked = collection.pick(['read', 'update']);
      const result = picked.all();

      expect(result.project).toEqual(['read', 'update']);
      expect(result.user).toEqual(['read', 'update']);
      expect(result.organization).toEqual(['read', 'update']);
      expect(result.billing).toEqual(['read']);
    });

    it('should pick single action', () => {
      const picked = collection.pick(['read']);
      const result = picked.all();

      expect(result.project).toEqual(['read']);
      expect(result.user).toEqual(['read']);
      expect(result.organization).toEqual(['read']);
      expect(result.billing).toEqual(['read']);
    });

    it('should return empty arrays for non-matching actions', () => {
      const picked = collection.pick(['share']);
      const result = picked.all();

      expect(result.project).toEqual(['share']);
      // @ts-expect-error - Testing properties after filtering, type doesn't include all resources
      expect(result.user).toEqual([]);
      // @ts-expect-error - Testing properties after filtering, type doesn't include all resources
      expect(result.organization).toEqual([]);
      // @ts-expect-error - Testing properties after filtering, type doesn't include all resources
      expect(result.billing).toEqual([]);
    });
  });

  describe('Omit Operations', () => {
    const collection = new StatementConfigCollection(mockStatements);

    it('should omit specific actions from all resources', () => {
      const omitted = collection.omit(['create', 'delete']);
      const result = omitted.all();

      expect(result.project).toEqual(['read', 'update', 'share']);
      expect(result.user).toEqual(['read', 'update']);
      expect(result.organization).toEqual(['read', 'update']);
      expect(result.billing).toEqual(['read']);
    });

    it('should omit single action', () => {
      const omitted = collection.omit(['read']);
      const result = omitted.all();

      expect(result.project).toEqual(['create', 'update', 'delete', 'share']);
      expect(result.user).toEqual(['create', 'update', 'delete']);
      expect(result.organization).toEqual(['update']);
      // @ts-expect-error - Testing property after filtering operation
      expect(result.billing).toEqual([]);
    });

    it('should return all actions when omitting non-existent action', () => {
      const omitted = collection.omit(['nonexistent' as any]);
      expect(omitted.all()).toEqual(mockStatements);
    });
  });

  describe('Specialized Filters', () => {
    const collection = new StatementConfigCollection(mockStatements);

    it('should return read-only permissions', () => {
      const readOnly = collection.readOnly();
      const result = readOnly.all();

      expect(result.project).toEqual(['read']);
      expect(result.user).toEqual(['read']);
      expect(result.organization).toEqual(['read']);
      expect(result.billing).toEqual(['read']);
    });

    it('should return write-only permissions', () => {
      const writeOnly = collection.writeOnly();
      const result = writeOnly.all();

      expect(result.project).toEqual(['create', 'update', 'delete']);
      expect(result.user).toEqual(['create', 'update', 'delete']);
      expect(result.organization).toEqual(['update']);
      // @ts-expect-error - Testing property after filtering operation
      expect(result.billing).toEqual([]);
    });

    it('should return CRUD-only permissions', () => {
      const crudOnly = collection.crudOnly();
      const result = crudOnly.all();

      expect(result.project).toEqual(['create', 'read', 'update', 'delete']);
      expect(result.user).toEqual(['create', 'read', 'update', 'delete']);
      expect(result.organization).toEqual(['read', 'update']);
      expect(result.billing).toEqual(['read']);
    });
  });

  describe('Action Filtering', () => {
    const collection = new StatementConfigCollection(mockStatements);

    it('should filter resources with specific action', () => {
      const withCreate = collection.withAction('create');
      const result = withCreate.all();

      expect(Object.keys(result)).toEqual(['project', 'user']);
      expect(result.project).toEqual(['create', 'read', 'update', 'delete', 'share']);
    });

    it('should filter resources with all specified actions', () => {
      const withAll = collection.withAllActions(['read', 'update']);
      const result = withAll.all();

      expect(Object.keys(result)).toEqual(['project', 'user', 'organization']);
    });

    it('should filter resources with any of specified actions', () => {
      const withAny = collection.withAnyAction(['create', 'share']);
      const result = withAny.all();

      expect(Object.keys(result)).toEqual(['project', 'user']);
    });

    it('should filter resources without specific action', () => {
      const withoutDelete = collection.withoutAction('delete');
      const result = withoutDelete.all();

      expect(Object.keys(result)).toEqual(['organization', 'billing']);
    });

    it('should return empty when no resources match action', () => {
      const withNonExistent = collection.withAction('nonexistent' as any);
      expect(withNonExistent.isEmpty).toBe(true);
    });

    it('should return empty when withAllActions has impossible combination', () => {
      const impossible = collection.withAllActions(['create', 'nonexistent' as any]);
      expect(impossible.isEmpty).toBe(true);
    });
  });

  describe('Generic Filter and Map', () => {
    const collection = new StatementConfigCollection(mockStatements);

    it('should filter by custom predicate', () => {
      const filtered = collection.filter((resource, config) => {
        return config.length > 2;
      });

      const result = filtered.all();
      expect(Object.keys(result)).toEqual(['project', 'user']);
    });

    it('should map to new structure', () => {
      const mapped = collection.map((resource, config) => ({
        resource,
        actionCount: config.length,
        hasCreate: config.has('create'),
      }));

      expect(mapped).toEqual([
        { resource: 'project', actionCount: 5, hasCreate: true },
        { resource: 'user', actionCount: 4, hasCreate: true },
        { resource: 'organization', actionCount: 2, hasCreate: false },
        { resource: 'billing', actionCount: 1, hasCreate: false },
      ]);
    });

    it('should transform to object structure', () => {
      const transformed = collection.transform((resource, config) => ({
        actions: config.all(),
        count: config.length,
      }));

      expect(transformed).toHaveProperty('project');
      expect(transformed.project).toEqual({
        actions: ['create', 'read', 'update', 'delete', 'share'],
        count: 5,
      });
    });
  });

  describe('Merge and Compact', () => {
    it('should merge two collections', () => {
      const collection1 = new StatementConfigCollection({
        project: ['create', 'read'] as const,
      });

      const collection2 = new StatementConfigCollection({
        user: ['read'] as const,
      });

      const merged = collection1.merge(collection2);
      const result = merged.all();

      expect(Object.keys(result)).toEqual(['project', 'user']);
    });

    it('should override resources on merge', () => {
      const collection1 = new StatementConfigCollection({
        project: ['read'] as const,
      });

      const collection2 = new StatementConfigCollection({
        project: ['create', 'read', 'update'] as const,
      });

      const merged = collection1.merge(collection2);
      expect(merged.getResource('project')?.all()).toEqual(['create', 'read', 'update']);
    });

    it('should remove empty resources with compact', () => {
      const collection = new StatementConfigCollection({
        project: ['read'] as const,
        empty: [] as const,
        user: ['read'] as const,
      });

      const compacted = collection.compact();
      const result = compacted.all();

      expect(Object.keys(result)).toEqual(['project', 'user']);
      expect(result).not.toHaveProperty('empty');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty collection', () => {
      const collection = new StatementConfigCollection({});

      expect(collection.isEmpty).toBe(true);
      expect(collection.size).toBe(0);
      expect(collection.resources()).toEqual([]);
      // @ts-expect-error - Testing with empty collection
      expect(collection.withAction('read' as any).isEmpty).toBe(true);
      expect(collection.readOnly().isEmpty).toBe(true);
    });

    it('should handle single resource', () => {
      const collection = new StatementConfigCollection({
        project: ['read'] as const,
      });

      expect(collection.size).toBe(1);
      expect(collection.resources()).toEqual(['project']);
      expect(collection.getResource('project')).toBeDefined();
    });

    it('should handle resource with empty actions', () => {
      const collection = new StatementConfigCollection({
        empty: [] as const,
        filled: ['read'] as const,
      });

      expect(collection.size).toBe(2);
      expect(collection.getResource('empty')?.isEmpty).toBe(true);
    });

    it('should maintain immutability on pick', () => {
      const original = new StatementConfigCollection(mockStatements);
      const picked = original.pick(['read']);

      expect(original.getResource('project')?.all()).toEqual(['create', 'read', 'update', 'delete', 'share']);
      expect(picked.getResource('project')?.all()).toEqual(['read']);
    });

    it('should maintain immutability on omit', () => {
      const original = new StatementConfigCollection(mockStatements);
      const omitted = original.omit(['create', 'delete']);

      expect(original.getResource('project')?.all()).toEqual(['create', 'read', 'update', 'delete', 'share']);
      expect(omitted.getResource('project')?.all()).toEqual(['read', 'update', 'share']);
    });

    it('should maintain immutability on filter', () => {
      const original = new StatementConfigCollection(mockStatements);
      const filtered = original.withAction('create');

      expect(original.size).toBe(4);
      expect(filtered.size).toBe(2);
    });
  });

  describe('Complex Filtering Chains', () => {
    const collection = new StatementConfigCollection(mockStatements);

    it('should chain pick and specialized filters', () => {
      const result = collection
        .pick(['create', 'read', 'update', 'delete'])
        .crudOnly()
        .withAction('create')
        .all();

      expect(Object.keys(result)).toEqual(['project', 'user']);
    });

    it('should chain omit and action filters', () => {
      const result = collection
        .omit(['delete'])
        .withoutAction('share')
        .all();

      expect(Object.keys(result)).toEqual(['user', 'organization', 'billing']);
    });

    it('should combine multiple action filters', () => {
      const result = collection
        .withAction('update')
        .withAction('read')
        .all();

      expect(Object.keys(result)).toEqual(['project', 'user', 'organization']);
    });

    it('should filter to specific permission patterns', () => {
      const result = collection
        .writeOnly()
        .withAllActions(['create', 'update'])
        .all();

      // Resources with create AND update in write-only mode
      expect(Object.keys(result)).toEqual(['project', 'user']);
    });
  });

  describe('Type Safety and Inference', () => {
    it('should work with strictly typed statements', () => {
      interface StrictStatements {
        project: readonly ['create', 'read', 'update', 'delete'];
        user: readonly ['read'];
      }

      const strictStatements: StrictStatements = {
        project: ['create', 'read', 'update', 'delete'],
        user: ['read'],
      };

      // @ts-expect-error - Testing with StrictStatements type that lacks index signature
      const collection = new StatementConfigCollection(strictStatements);
      expect(collection.size).toBe(2);
    });

    it('should handle const assertions', () => {
      const statements = {
        project: ['read', 'write'] as const,
      } as const;

      const collection = new StatementConfigCollection(statements);
      expect(collection.getResource('project')?.has('read')).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle complex permission system', () => {
      const system = {
        project: ['create', 'read', 'update', 'delete', 'share', 'archive'] as const,
        task: ['create', 'read', 'update', 'delete', 'assign', 'complete'] as const,
        comment: ['create', 'read', 'update', 'delete', 'react'] as const,
        file: ['upload', 'download', 'delete', 'share'] as const,
        user: ['read', 'invite'] as const,
      };

      const collection = new StatementConfigCollection(system);

      // Get all resources with standard CRUD
      const standardCrud = collection
        .crudOnly()
        .withAllActions(['create', 'read', 'update', 'delete']);

      expect(standardCrud.resources()).toEqual(['project', 'task', 'comment']);

      // Get sharing-capable resources
      const shareable = collection.withAction('share');
      expect(shareable.resources()).toEqual(['project', 'file']);

      // Get file operations only
      const fileOps = collection.pick(['upload', 'download', 'delete', 'share']);
      expect(Object.keys(fileOps.all())).toEqual(['project', 'task', 'comment', 'file', 'user']);
      // Resources with matching actions should have those actions
      const fileOpsResult = fileOps.all();
      expect(fileOpsResult.file).toContain('upload');
      expect(fileOpsResult.file).toContain('download');
      // project has 'delete' and 'share' which are in the pick list
      expect(fileOpsResult.project).toEqual(['delete', 'share']);
      expect(fileOpsResult.task).toEqual(['delete']);
      expect(fileOpsResult.comment).toEqual(['delete']);
      // @ts-expect-error - Testing property after filtering operation
      expect(fileOpsResult.user).toEqual([]);
    });

    it('should build role-specific permissions', () => {
      const allStatements = {
        project: ['create', 'read', 'update', 'delete', 'archive'] as const,
        task: ['create', 'read', 'update', 'delete', 'assign'] as const,
        comment: ['create', 'read', 'update', 'delete'] as const,
        user: ['read', 'invite', 'remove'] as const,
      };

      const collection = new StatementConfigCollection(allStatements);

      // Admin permissions - everything
      const adminPerms = collection.all();
      expect(Object.keys(adminPerms)).toHaveLength(4);

      // Manager permissions - no delete/remove
      const managerPerms = collection
        .omit(['delete', 'remove'])
        .all();

      expect(managerPerms.project).not.toContain('delete');
      expect(managerPerms.user).not.toContain('remove');

      // Contributor permissions - CRUD minus delete
      const contributorPerms = collection
        .crudOnly()
        .omit(['delete'])
        .all();

      expect(contributorPerms.project).toEqual(['create', 'read', 'update']);
      expect(contributorPerms.task).toEqual(['create', 'read', 'update']);

      // Viewer permissions - read only
      const viewerPerms = collection.readOnly().all();

      expect(viewerPerms.project).toEqual(['read']);
      expect(viewerPerms.task).toEqual(['read']);
    });

    it('should support granular permission building', () => {
      const statements = {
        document: ['create', 'read', 'update', 'delete', 'publish', 'archive'] as const,
        media: ['upload', 'read', 'delete', 'organize'] as const,
        analytics: ['read', 'export'] as const,
        settings: ['read', 'update'] as const,
      };

      const collection = new StatementConfigCollection(statements);

      // Content editor - can work with documents and media, no analytics
      const contentEditor = collection
        .pick(['create', 'read', 'update', 'upload', 'delete', 'organize'])
        .omit(['delete']) // Remove delete from previous pick
        .all();

      expect(contentEditor.document).toContain('create');
      expect(contentEditor.document).not.toContain('delete');
      expect(contentEditor.media).toContain('upload');

      // Publisher - can manage publishing workflow
      const publisher = collection
        .withAnyAction(['publish', 'archive', 'update'])
        .all();

      expect(Object.keys(publisher)).toContain('document');
      expect(Object.keys(publisher)).toContain('settings');

      // Analyst - read-only analytics and export
      // Note: .readOnly() transforms all resources, so using pick() instead

      // Better approach for analyst
      const analystPerms = collection
        .pick(['read', 'export'])
        .all();

      expect(analystPerms.analytics).toEqual(['read', 'export']);
      expect(analystPerms.document).toEqual(['read']);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large statement collections efficiently', () => {
      const largeStatements: Record<string, readonly string[]> = {};
      
      // Generate 100 resources with various actions
      for (let i = 0; i < 100; i++) {
        largeStatements[`resource${String(i)}`] = ['create', 'read', 'update', 'delete'] as const;
      }

      const collection = new StatementConfigCollection(largeStatements);

      expect(collection.size).toBe(100);
      expect(collection.resources()).toHaveLength(100);

      // Filter should work efficiently
      const filtered = collection.withAction('create');
      expect(filtered.size).toBe(100);
    });

    it('should handle complex action arrays', () => {
      const complex = {
        api: ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const,
        websocket: ['connect', 'disconnect', 'send', 'receive', 'broadcast'] as const,
        grpc: ['call', 'stream', 'cancel'] as const,
      };

      const collection = new StatementConfigCollection(complex);

      // Pick REST-like actions
      const restActions = collection.pick(['get', 'post', 'put', 'patch', 'delete']);
      expect(restActions.getResource('api')?.all()).toEqual(['get', 'post', 'put', 'patch', 'delete']);
      // @ts-expect-error - Testing with 'websocket' resource that doesn't exist in filtered type
      expect(restActions.getResource('websocket')?.all()).toEqual([]);
    });
  });
});
