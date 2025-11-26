import { describe, it, expect, vi } from 'vitest';
import { PermissionBuilder, ResourceBuilder, RoleBuilder, createPermissionBuilder, createPermissionBuilderWithDefaults } from './builder';
import { StatementsConfig } from './statements/statements-config';
import { RolesConfig } from './roles/roles-config';

// Mock Better Auth's createAccessControl
vi.mock('better-auth/plugins/access', () => ({
  createAccessControl: vi.fn((statement) => ({
    newRole: vi.fn((permissions) => ({
      authorize: vi.fn(() => ({ success: true })),
      statements: permissions,
    })),
    statements: statement,
  })),
}));

describe('PermissionBuilder', () => {
  describe('Basic Builder Construction', () => {
    it('should create a new builder instance', () => {
      const builder = new PermissionBuilder();
      expect(builder).toBeInstanceOf(PermissionBuilder);
    });

    it('should start with empty statement and roles', () => {
      const builder = new PermissionBuilder();
      expect(builder.getStatement()).toEqual({});
      expect(builder.getRoles()).toEqual({});
    });

    it('should create builder with factory function', () => {
      const builder = createPermissionBuilder();
      expect(builder).toBeInstanceOf(PermissionBuilder);
    });
  });

  describe('ResourceBuilder - Single Resource', () => {
    it('should add a resource with actions', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read', 'update', 'delete']);

      const statement = builder.getStatement();
      expect(statement.project).toEqual(['create', 'read', 'update', 'delete']);
    });

    it('should add multiple resources via chaining', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read'])
        .resource('user')
        .actions(['read', 'update']);

      const statement = builder.getStatement();
      expect(statement.project).toEqual(['create', 'read']);
      expect(statement.user).toEqual(['read', 'update']);
    });

    it('should support const assertions for actions', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read'] as const);

      expect(builder.getStatement().project).toEqual(['create', 'read']);
    });

    it('should return ResourceBuilder instance', () => {
      const builder = new PermissionBuilder();
      const resourceBuilder = builder.resource('project');
      
      expect(resourceBuilder).toBeInstanceOf(ResourceBuilder);
    });
  });

  describe('Bulk Resources', () => {
    it('should add multiple resources at once', () => {
      const builder = new PermissionBuilder().resources(({ actions }) => ({
        project: actions(['create', 'read', 'update', 'delete'] as const),
        user: actions(['read', 'update'] as const),
        organization: actions(['read'] as const),
      }));

      const statement = builder.getStatement();
      expect(statement.project).toEqual(['create', 'read', 'update', 'delete']);
      expect(statement.user).toEqual(['read', 'update']);
      expect(statement.organization).toEqual(['read']);
    });

    it('should merge bulk resources with individual resources', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read'])
        .resources(({ actions }) => ({
          user: actions(['read'] as const),
          organization: actions(['read', 'update'] as const),
        }));

      const statement = builder.getStatement();
      expect(statement.project).toEqual(['create', 'read']);
      expect(statement.user).toEqual(['read']);
      expect(statement.organization).toEqual(['read', 'update']);
    });

    it('should override existing resources when using bulk', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['read'])
        .resources(({ actions }) => ({
          project: actions(['create', 'read', 'update', 'delete'] as const),
        }));

      expect(builder.getStatement().project).toEqual(['create', 'read', 'update', 'delete']);
    });
  });

  describe('RoleBuilder - Single Role', () => {
    it('should add a role with permissions', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read', 'update', 'delete'])
        .role('admin')
        .allPermissions();

      const roles = builder.getRoles();
      expect(roles.admin).toBeDefined();
    });

    it('should add role with partial permissions', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read', 'update', 'delete'])
        .resource('user')
        .actions(['read', 'update'])
        .role('editor')
        .permissions({
          project: ['read', 'update'],
        });

      const roles = builder.getRoles();
      expect(roles.editor).toBeDefined();
      // Role objects have statements property containing the permissions
      expect(roles.editor.statements.project).toEqual(['read', 'update']);
    });

    it('should support multiple roles', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read', 'update', 'delete'])
        .role('admin')
        .allPermissions()
        .role('viewer')
        .permissions({
          project: ['read'],
        });

      const roles = builder.getRoles();
      expect(roles.admin).toBeDefined();
      expect(roles.viewer).toBeDefined();
    });

    it('should return RoleBuilder instance', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['read']);
      
      const roleBuilder = builder.role('admin');
      expect(roleBuilder).toBeInstanceOf(RoleBuilder);
    });
  });

  describe('Bulk Roles', () => {
    it('should add multiple roles at once with factory', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          project: actions(['create', 'read', 'update', 'delete'] as const),
          user: actions(['read', 'update'] as const),
        }))
        .roles(({ permissions }) => ({
          admin: permissions({
            project: ['create', 'read', 'update', 'delete'],
            user: ['read', 'update'],
          }),
          viewer: permissions({
            project: ['read'],
            user: ['read'],
          }),
        }));

      const roles = builder.getRoles();
      expect(roles.admin).toBeDefined();
      expect(roles.viewer).toBeDefined();
    });

    it('should combine individual and bulk roles', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read'])
        .role('admin')
        .allPermissions()
        .roles(({ permissions }) => ({
          viewer: permissions({ project: ['read'] }),
        }));

      const roles = builder.getRoles();
      expect(roles.admin).toBeDefined();
      expect(roles.viewer).toBeDefined();
    });
  });

  describe('Build Method', () => {
    it('should build and return complete configuration', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read'])
        .role('admin')
        .allPermissions();

      const result = builder.build();

      expect(result.statement).toBeDefined();
      expect(result.ac).toBeDefined();
      expect(result.roles).toBeDefined();
      expect(result.statementsConfig).toBeInstanceOf(StatementsConfig);
      expect(result.rolesConfig).toBeInstanceOf(RolesConfig);
    });

    it('should create access control instance on build', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['read']);

      const result = builder.build();
      expect(result.ac).toBeDefined();
      expect(result.ac.statements).toEqual({ project: ['read'] });
    });

    it('should create configs on build', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          project: actions(['read'] as const),
        }))
        .role('viewer')
        .permissions({ project: ['read'] });

      const result = builder.build();
      
      expect(result.statementsConfig).toBeInstanceOf(StatementsConfig);
      expect(result.rolesConfig).toBeInstanceOf(RolesConfig);
      expect(result.statementsConfig.get('project')).toBeDefined();
    });
  });

  describe('Getter Methods', () => {
    it('should get statements config before build', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['read']);

      const statementsConfig = builder.getStatementsConfig();
      expect(statementsConfig).toBeInstanceOf(StatementsConfig);
    });

    it('should get roles config before build', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['read'])
        .role('admin')
        .allPermissions();

      const rolesConfig = builder.getRolesConfig();
      expect(rolesConfig).toBeInstanceOf(RolesConfig);
    });

    it('should get access control instance lazily', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['read']);

      const ac = builder.getAc();
      expect(ac).toBeDefined();
      expect(ac.statements).toEqual({ project: ['read'] });
    });

    it('should get statement directly', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          project: actions(['read'] as const),
          user: actions(['read', 'update'] as const),
        }));

      expect(builder.statement).toEqual({
        project: ['read'],
        user: ['read', 'update'],
      });
    });
  });

  describe('createPermission Method', () => {
    it('should create permission from object', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          project: actions(['create', 'read', 'update', 'delete'] as const),
        }));

      const permission = builder.createPermission({
        project: ['read', 'update'] as const,
      });

      expect(permission.project).toEqual(['read', 'update']);
    });

    it('should create permission from factory function', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          project: actions(['create', 'read', 'update', 'delete'] as const),
          user: actions(['read', 'update'] as const),
        }));

      const permission = builder.createPermission(({ statementsConfig }) => ({
        project: statementsConfig.get('project').pick(['read', 'update']).build(),
        user: statementsConfig.get('user').readOnly(),
      }));

      expect(permission.project).toEqual(['read', 'update']);
      expect(permission.user).toEqual(['read']);
    });

    it('should provide access to configs in factory', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          project: actions(['read', 'write'] as const),
        }))
        .role('admin')
        .allPermissions();

      builder.createPermission(({ statementsConfig, rolesConfig, ac }) => {
        expect(statementsConfig).toBeInstanceOf(StatementsConfig);
        expect(rolesConfig).toBeInstanceOf(RolesConfig);
        expect(ac).toBeDefined();
        return { project: ['read'] as const };
      });
    });
  });

  describe('Static withDefaults Method', () => {
    it('should create builder with default statements from Better Auth roles', () => {
      // Better Auth roles have { statements: { resource: [...] } } structure
      const defaults = {
        user: { statements: { user: ['create', 'read', 'update', 'delete'] as const } },
        admin: { statements: { organization: ['read', 'update'] as const } },
      };

      const builder = PermissionBuilder.withDefaults(defaults);
      
      // withDefaults merges all statements from all roles
      // At runtime, all statements are merged into one object
      const rawStatement: unknown = builder.getStatement();
      const statement = rawStatement as { user: readonly string[]; organization: readonly string[] };
      expect(statement.user).toEqual(['create', 'read', 'update', 'delete']);
      expect(statement.organization).toEqual(['read', 'update']);
    });

    it('should merge defaults with additional resources', () => {
      const defaults = {
        basicRole: { statements: { user: ['read'] as const } },
      };

      const builder = PermissionBuilder.withDefaults(defaults)
        .resource('project')
        .actions(['create', 'read']);

      const statement = builder.getStatement();
      expect(statement.user).toEqual(['read']);
      expect(statement.project).toEqual(['create', 'read']);
    });

    it('should use factory helper', () => {
      const defaults = {
        basicRole: { statements: { user: ['read'] as const } },
      };

      const builder = createPermissionBuilderWithDefaults(defaults);
      expect(builder.getStatement().user).toEqual(['read']);
    });
  });

  describe('Complex Builder Chains', () => {
    it('should handle complex multi-resource, multi-role setup', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read', 'update', 'delete', 'share', 'archive'])
        .resource('task')
        .actions(['create', 'read', 'update', 'delete', 'assign', 'complete'])
        .resource('comment')
        .actions(['create', 'read', 'update', 'delete'])
        .resource('user')
        .actions(['read', 'invite', 'remove'])
        .role('admin')
        .allPermissions()
        .role('manager')
        .permissions({
          project: ['read', 'update', 'share'],
          task: ['create', 'read', 'update', 'assign'],
          comment: ['create', 'read', 'update'],
        })
        .role('contributor')
        .permissions({
          task: ['create', 'read', 'update'],
          comment: ['create', 'read', 'update'],
        })
        .role('viewer')
        .permissions({
          project: ['read'],
          task: ['read'],
          comment: ['read'],
        });

      const result = builder.build();

      // Verify statement
      expect(result.statement.project).toHaveLength(6);
      expect(result.statement.task).toHaveLength(6);

      // Verify roles
      expect(result.roles.admin).toBeDefined();
      expect(result.roles.manager).toBeDefined();
      expect(result.roles.contributor).toBeDefined();
      expect(result.roles.viewer).toBeDefined();

      // Verify configs
      expect(result.statementsConfig.size).toBe(4);
      expect(result.rolesConfig.size).toBe(4);
    });

    it('should support mixed resource and role definition styles', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          project: actions(['create', 'read', 'update', 'delete'] as const),
          user: actions(['read', 'update'] as const),
        }))
        .resource('organization')
        .actions(['read', 'manage-members'])
        .role('admin')
        .allPermissions()
        .roles(({ permissions }) => ({
          editor: permissions({
            project: ['read', 'update'],
            user: ['read'],
          }),
          viewer: permissions({
            project: ['read'],
            user: ['read'],
            organization: ['read'],
          }),
        }));

      const result = builder.build();

      expect(result.statement.project).toEqual(['create', 'read', 'update', 'delete']);
      expect(result.statement.organization).toEqual(['read', 'manage-members']);
      expect(result.roles.admin).toBeDefined();
      expect(result.roles.editor).toBeDefined();
      expect(result.roles.viewer).toBeDefined();
    });
  });

  describe('Real-World Usage Patterns', () => {
    it('should build multi-tenant SaaS permissions', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          // Workspace resources
          workspace: actions(['create', 'read', 'update', 'delete', 'manage-members'] as const),
          project: actions(['create', 'read', 'update', 'delete', 'archive'] as const),
          task: actions(['create', 'read', 'update', 'delete', 'assign'] as const),
          
          // User resources
          user: actions(['read', 'invite', 'remove'] as const),
          
          // Billing resources
          billing: actions(['read', 'update', 'manage-subscriptions'] as const),
        }))
        .role('workspace-owner')
        .allPermissions()
        .role('workspace-admin')
        .permissions({
          workspace: ['read', 'update', 'manage-members'],
          project: ['create', 'read', 'update', 'delete', 'archive'],
          task: ['create', 'read', 'update', 'delete', 'assign'],
          user: ['read', 'invite'],
          billing: ['read'],
        })
        .role('project-manager')
        .permissions({
          project: ['read', 'update'],
          task: ['create', 'read', 'update', 'delete', 'assign'],
        })
        .role('contributor')
        .permissions({
          project: ['read'],
          task: ['create', 'read', 'update'],
        })
        .role('guest')
        .permissions({
          project: ['read'],
          task: ['read'],
        });

      const result = builder.build();

      // Workspace owner has everything
      expect(result.roles['workspace-owner']).toBeDefined();
      
      // Workspace admin has most things except full billing control
      expect(result.roles['workspace-admin'].statements.billing).toEqual(['read']);
      
      // Project manager focused on project/task management
      expect(result.roles['project-manager'].statements.project).toEqual(['read', 'update']);
      
      // Contributor has limited write access
      expect(result.roles.contributor.statements.task).toEqual(['create', 'read', 'update']);
      
      // Guest has read-only access
      expect(result.roles.guest.statements.project).toEqual(['read']);
    });

    it('should build CMS permissions with content workflow', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          // Content resources
          article: actions(['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive'] as const),
          media: actions(['upload', 'read', 'update', 'delete', 'organize'] as const),
          
          // Management resources
          category: actions(['create', 'read', 'update', 'delete'] as const),
          tag: actions(['create', 'read', 'update', 'delete'] as const),
          
          // Analytics
          analytics: actions(['read', 'export'] as const),
          
          // System
          settings: actions(['read', 'update'] as const),
        }))
        .role('administrator')
        .allPermissions()
        .role('editor')
        .permissions({
          article: ['create', 'read', 'update', 'delete'],
          media: ['upload', 'read', 'update', 'organize'],
          category: ['read', 'update'],
          tag: ['create', 'read', 'update'],
          analytics: ['read'],
        })
        .role('author')
        .permissions({
          article: ['create', 'read', 'update'],
          media: ['upload', 'read'],
          category: ['read'],
          tag: ['read'],
        })
        .role('publisher')
        .permissions({
          article: ['read', 'publish', 'unpublish', 'archive'],
          analytics: ['read', 'export'],
        });

      const result = builder.build();

      // Administrator has full control
      expect(result.roles.administrator.statements.settings).toEqual(['read', 'update']);
      
      // Editor manages content but can't publish
      expect(result.roles.editor.statements.article).not.toContain('publish');
      
      // Author creates content
      expect(result.roles.author.statements.article).toEqual(['create', 'read', 'update']);
      
      // Publisher controls publication workflow
      expect(result.roles.publisher.statements.article).toEqual(['read', 'publish', 'unpublish', 'archive']);
    });

    it('should support permission derivation with createPermission', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          project: actions(['create', 'read', 'update', 'delete', 'share', 'export'] as const),
          report: actions(['create', 'read', 'update', 'delete', 'generate', 'schedule'] as const),
        }));

      // Create read-only permission set
      const readOnlyPermission = builder.createPermission(({ statementsConfig }) => ({
        project: statementsConfig.get('project').readOnly(),
        report: statementsConfig.get('report').readOnly(),
      }));

      expect(readOnlyPermission.project).toEqual(['read']);
      expect(readOnlyPermission.report).toEqual(['read']);

      // Create CRUD-only permission set (no special actions)
      const crudPermission = builder.createPermission(({ statementsConfig }) => ({
        project: statementsConfig.get('project').crudOnly(),
        report: statementsConfig.get('report').crudOnly(),
      }));

      expect(crudPermission.project).toEqual(['create', 'read', 'update', 'delete']);
      expect(crudPermission.report).toEqual(['create', 'read', 'update', 'delete']);
    });
  });

  describe('Type Safety and Inference', () => {
    it('should maintain type safety through chaining', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read'] as const)
        .resource('user')
        .actions(['read'] as const);

      const statement = builder.getStatement();
      
      // TypeScript should infer exact types
      expect(statement.project).toEqual(['create', 'read']);
      expect(statement.user).toEqual(['read']);
    });

    it('should work with resources factory function', () => {
      const builder = new PermissionBuilder().resources(({ actions }) => ({
        project: actions(['read', 'write'] as const),
        user: actions(['read'] as const),
      }));
      
      expect(builder.getStatement()).toEqual({
        project: ['read', 'write'],
        user: ['read'],
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty builder', () => {
      const builder = new PermissionBuilder();
      const result = builder.build();

      expect(result.statement).toEqual({});
      expect(result.roles).toEqual({});
    });

    it('should handle resource without actions', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions([]);

      expect(builder.getStatement().project).toEqual([]);
    });

    it('should handle role without resources', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['read'])
        .role('empty')
        .permissions({});

      // Role with empty permissions still gets created as a Role object
      expect(builder.getRoles().empty).toBeDefined();
    });

    it('should allow overwriting resources', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['read'])
        .resource('project')
        .actions(['create', 'read', 'update']);

      expect(builder.getStatement().project).toEqual(['create', 'read', 'update']);
    });

    it('should allow overwriting roles', () => {
      const builder = new PermissionBuilder()
        .resource('project')
        .actions(['create', 'read', 'update', 'delete'])
        .role('admin')
        .permissions({ project: ['read'] })
        .role('admin')
        .allPermissions();

      // Second definition should override
      const roles = builder.getRoles();
      expect(roles.admin.statements.project).toEqual(['create', 'read', 'update', 'delete']);
    });
  });

  describe('Integration with Better Auth', () => {
    it('should create compatible access control structure', () => {
      const builder = new PermissionBuilder()
        .resources(({ actions }) => ({
          user: actions(['create', 'read', 'update', 'delete'] as const),
          organization: actions(['read', 'update'] as const),
        }));

      const result = builder.build();

      // Should have Better Auth compatible structure
      expect(result.statement).toBeDefined();
      expect(result.ac).toBeDefined();
      expect(result.ac.newRole).toBeDefined();
    });

    it('should support Better Auth default roles', () => {
      // Better Auth roles have { statements: { resource: [...] } } structure
      const betterAuthDefaults = {
        user: { statements: { user: ['create', 'read', 'update', 'delete'] as const } },
        session: { statements: { session: ['create', 'read', 'delete'] as const } },
      };

      const builder = PermissionBuilder.withDefaults(betterAuthDefaults)
        .resource('project')
        .actions(['create', 'read', 'update', 'delete']);

      const result = builder.build();

      // At runtime, all statements are merged into one object
      const rawStatement: unknown = result.statement;
      const statement = rawStatement as { user: readonly string[]; session: readonly string[]; project: readonly string[] };
      expect(statement.user).toEqual(['create', 'read', 'update', 'delete']);
      expect(statement.session).toEqual(['create', 'read', 'delete']);
      expect(statement.project).toEqual(['create', 'read', 'update', 'delete']);
    });
  });
});
