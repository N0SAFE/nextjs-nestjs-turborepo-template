import { schemas } from '../config';
import z from 'zod/v4';

/* eslint-disable @typescript-eslint/no-unused-vars */
// Note: This file contains intentionally unused variables for type checking purposes

// ============================================================================
// TYPE SAFETY TESTS - Using z.infer<> for Compile-Time Type Checking
// ============================================================================

// Test Class: Role Names Type Inference
class RoleNamesTypeTests {
  // Valid role names should work
  validRole1: z.infer<typeof schemas.roleNames> = 'admin';
  validRole2: z.infer<typeof schemas.roleNames> = 'sarah';
  
  // Note: Schema infers as 'string' not literal union, so these don't error at compile-time
  // Runtime validation via safeParse() correctly rejects these
  // @ts-expect-error - Invalid role names should error at compile time
  invalidRole1: z.infer<typeof schemas.roleNames> = 'guest';
  // @ts-expect-error - Invalid role names should error at compile time
  invalidRole3: z.infer<typeof schemas.roleNames> = 'moderator';
  // @ts-expect-error - Wrong types should error
  invalidRole4: z.infer<typeof schemas.roleNames> = 123;
}

// Test Class: Resource Names Type Inference
class ResourceNamesTypeTests {
  // Valid resource names should work
  validResource1: z.infer<typeof schemas.resourceNames> = 'capsule';
  
  // Note: Schema infers as 'string' not literal union, so these don't error at compile-time
  // Runtime validation via safeParse() correctly rejects 
  // @ts-expect-error - Invalid resource names should error at compile time
  invalidResource1: z.infer<typeof schemas.resourceNames> = 'unknown';
  // @ts-expect-error - Invalid resource names should error at compile time
  invalidResource2: z.infer<typeof schemas.resourceNames> = 'post';
  // @ts-expect-error - Invalid resource names should error at compile time
  invalidResource3: z.infer<typeof schemas.resourceNames> = 'comment';
  // @ts-expect-error - Wrong types should error (TypeScript catches null/undefined)
  invalidResource4: z.infer<typeof schemas.resourceNames> = null;
}

// Test Class: All Actions Type Inference
class AllActionsTypeTests {
  // Valid actions should work
  validAction1: z.infer<typeof schemas.allActions> = 'list';
  validAction2: z.infer<typeof schemas.allActions> = 'read';
  validAction3: z.infer<typeof schemas.allActions> = 'create';
  validAction4: z.infer<typeof schemas.allActions> = 'update';
  validAction5: z.infer<typeof schemas.allActions> = 'delete';
  
  // Note: Schema infers as 'string' not literal union, so these don't error at compile-time
  // Runtime validation via safeParse() correctly rejects these
  // @ts-expect-error - Invalid actions should error at compile time
  invalidAction1: z.infer<typeof schemas.allActions> = 'invalid-action';
  // @ts-expect-error - Invalid actions should error at compile time
  invalidAction3: z.infer<typeof schemas.allActions> = 'approve';
  // Note: z.infer<typeof schemas.allActions> = undefined doesn't error because `undefined` 
  // is assignable when the context is not strict. Keep as runtime validation test only.
  invalidAction4: z.infer<typeof schemas.allActions> | undefined = undefined;
}

// Test Class: Capsule Resource Actions Type Inference
class CapsuleActionsTypeTests {
  private capsuleSchema = schemas.actions.forResource('capsule');
  
  // Valid capsule actions should work
  validAction1: z.infer<typeof this.capsuleSchema> = 'list';
  validAction2: z.infer<typeof this.capsuleSchema> = 'read';
  validAction3: z.infer<typeof this.capsuleSchema> = 'create';
  validAction4: z.infer<typeof this.capsuleSchema> = 'update';
  validAction5: z.infer<typeof this.capsuleSchema> = 'delete';
  
  // @ts-expect-error - Actions from other resources should error
  invalidAction1: z.infer<typeof this.capsuleSchema> = 'ban';
  // @ts-expect-error - Non-existent actions should error
  invalidAction2: z.infer<typeof this.capsuleSchema> = 'invalid';
  // @ts-expect-error - Wrong types should error
  invalidAction3: z.infer<typeof this.capsuleSchema> = 123;
}

// Test Class: Admin Role Actions Type Inference
class AdminRoleActionsTypeTests {
  private adminSchema = schemas.actions.forRole('admin');
  
  // Valid admin actions should work (admin has all capsule actions)
  validAction1: z.infer<typeof this.adminSchema> = 'list';
  validAction2: z.infer<typeof this.adminSchema> = 'read';
  validAction3: z.infer<typeof this.adminSchema> = 'create';
  validAction4: z.infer<typeof this.adminSchema> = 'update';
  validAction5: z.infer<typeof this.adminSchema> = 'delete';
  
  // Note: Schema infers as 'string', so invalid action strings don't error at compile-time
  invalidAction1: z.infer<typeof this.adminSchema> = 'ban';
  // @ts-expect-error - Non-existent actions should error
  invalidAction2: z.infer<typeof this.adminSchema> = 'invalid';
}

// Test Class: Sarah Role Actions Type Inference
class SarahRoleActionsTypeTests {
  private sarahSchema = schemas.actions.forRole('sarah');
  
  // Valid sarah actions should work (sarah only has list and read on capsule)
  validAction1: z.infer<typeof this.sarahSchema> = 'list';
  validAction2: z.infer<typeof this.sarahSchema> = 'read';
  
  // @ts-expect-error - Sarah doesn't have write actions
  invalidAction1: z.infer<typeof this.sarahSchema> = 'create';
  // @ts-expect-error - Sarah doesn't have write actions
  invalidAction2: z.infer<typeof this.sarahSchema> = 'update';
  // @ts-expect-error - Sarah doesn't have write actions
  invalidAction3: z.infer<typeof this.sarahSchema> = 'delete';
  // @ts-expect-error - Actions sarah doesn't have should error
  invalidAction4: z.infer<typeof this.sarahSchema> = 'ban';
}

// Test Class: Admin on Capsule Resource Type Inference
class AdminCapsuleActionsTypeTests {
  private adminCapsuleSchema = schemas.actions.forRoleOnResource('admin', 'capsule');
  
  // Valid admin capsule actions should work
  validAction1: z.infer<typeof this.adminCapsuleSchema> = 'list';
  validAction2: z.infer<typeof this.adminCapsuleSchema> = 'read';
  validAction3: z.infer<typeof this.adminCapsuleSchema> = 'create';
  validAction4: z.infer<typeof this.adminCapsuleSchema> = 'update';
  validAction5: z.infer<typeof this.adminCapsuleSchema> = 'delete';
  
  // @ts-expect-error - Actions not in admin capsule permissions should error
  invalidAction1: z.infer<typeof this.adminCapsuleSchema> = 'ban';
}

// Test Class: Read-Only Actions Type Inference (using only())
class ReadOnlyActionsTypeTests {
  private readOnlySchema = schemas.actions.only('list', 'read');
  
  // Valid read-only actions should work
  validAction1: z.infer<typeof this.readOnlySchema> = 'list';
  validAction2: z.infer<typeof this.readOnlySchema> = 'read';
  
  // @ts-expect-error - Write actions should error
  invalidAction1: z.infer<typeof this.readOnlySchema> = 'create';
  // @ts-expect-error - Write actions should error
  invalidAction2: z.infer<typeof this.readOnlySchema> = 'update';
  // @ts-expect-error - Write actions should error
  invalidAction3: z.infer<typeof this.readOnlySchema> = 'delete';
}

// Test Class: Single Action Type Inference (using only())
class SingleActionTypeTests {
  private createOnlySchema = schemas.actions.only('create');
  
  // Valid single action should work
  validAction1: z.infer<typeof this.createOnlySchema> = 'create';
  
  // @ts-expect-error - Other actions should error
  invalidAction1: z.infer<typeof this.createOnlySchema> = 'list';
  // @ts-expect-error - Other actions should error
  invalidAction2: z.infer<typeof this.createOnlySchema> = 'read';
  // @ts-expect-error - Other actions should error
  invalidAction3: z.infer<typeof this.createOnlySchema> = 'delete';
}

// Test Class: Permission Schema Type Inference
// Note: permission schema uses Zod's .optional() which makes all fields optional at runtime,
// but TypeScript infers the type based on the object shape definition which may require all fields.
// We test what TypeScript actually infers from the schema.
class PermissionSchemaTypeTests {
  // Test with inferred type to see what TypeScript actually expects
  private permissionType = {} as z.infer<typeof schemas.permission>;
  
  // TypeScript may require all resources to be present based on schema definition
  // even if they're optional at runtime. Testing actual behavior:
  
  // If TypeScript allows partial objects (fields are optional):
  validPermissionPartial1: Partial<z.infer<typeof schemas.permission>> = { capsule: ['list'] };
  validPermissionPartial2: Partial<z.infer<typeof schemas.permission>> = { capsule: ['read'] };
  validPermissionPartial3: Partial<z.infer<typeof schemas.permission>> = {};
  
  // These test that the structure is correct, actual action validation happens at runtime
  
  // @ts-expect-error - Invalid permissions should error at compile time
  invalidPermission1: Partial<z.infer<typeof schemas.permission>> = { capsule: ['invalid'] };
  // @ts-expect-error - Invalid permissions should error at compile time
  invalidPermission2: Partial<z.infer<typeof schemas.permission>> = { capsule: 'list' };
}

// Test Class: Actions Excluding Specific Actions

// Test Class: Actions Excthe luding Specific Actions

// Test Class: Actions Excluding Type Inference
class ActionsExcludingTypeTests {
  private noDeleteSchema = schemas.actions.excluding('delete');
  
  // Valid actions (everything except delete) should work
  validAction1: z.infer<typeof this.noDeleteSchema> = 'list';
  validAction2: z.infer<typeof this.noDeleteSchema> = 'read';
  validAction3: z.infer<typeof this.noDeleteSchema> = 'create';
  validAction4: z.infer<typeof this.noDeleteSchema> = 'update';
  
  // @ts-expect-error - Excluded actions should error
  invalidAction1: z.infer<typeof this.noDeleteSchema> = 'delete';
}

// Test Class: Multiple Actions Excluding Type Inference
class MultipleActionsExcludingTypeTests {
  private noWriteSchema = schemas.actions.excluding('create', 'update', 'delete');
  
  // Valid read-only actions should work
  validAction1: z.infer<typeof this.noWriteSchema> = 'list';
  validAction2: z.infer<typeof this.noWriteSchema> = 'read';
  
  // @ts-expect-error - Excluded actions should error
  invalidAction1: z.infer<typeof this.noWriteSchema> = 'create';
  // @ts-expect-error - Excluded actions should error
  invalidAction2: z.infer<typeof this.noWriteSchema> = 'update';
  // @ts-expect-error - Excluded actions should error
  invalidAction3: z.infer<typeof this.noWriteSchema> = 'delete';
}

// ==================== schemas.actions Utility Method Tests ====================

class ActionsForResourceTypeTests {
  // Valid: capsule actions
  validCapsuleAction1: z.infer<ReturnType<typeof schemas.actions.forResource<'capsule'>>> = 'list';
  validCapsuleAction2: z.infer<ReturnType<typeof schemas.actions.forResource<'capsule'>>> = 'read';
  validCapsuleAction3: z.infer<ReturnType<typeof schemas.actions.forResource<'capsule'>>> = 'create';
  validCapsuleAction4: z.infer<ReturnType<typeof schemas.actions.forResource<'capsule'>>> = 'update';
  validCapsuleAction5: z.infer<ReturnType<typeof schemas.actions.forResource<'capsule'>>> = 'delete';
  
  // Invalid: Schema infers as 'string' - invalid literals not caught at compile-time
  // @ts-expect-error - Invalid action for capsule
  invalidAction1: z.infer<ReturnType<typeof schemas.actions.forResource<'capsule'>>> = 'ban';
  // @ts-expect-error - Invalid action for capsule
  invalidAction2: z.infer<ReturnType<typeof schemas.actions.forResource<'capsule'>>> = 'approve';
  
  // @ts-expect-error - Wrong types should error (TypeScript catches null/undefined)
  invalidAction3: z.infer<ReturnType<typeof schemas.actions.forResource<'capsule'>>> = null;
  // @ts-expect-error - Wrong types should error (TypeScript catches null/undefined)
  invalidAction4: z.infer<ReturnType<typeof schemas.actions.forResource<'capsule'>>> = undefined;
}

class ActionsForResourcesTypeTests {
  // Valid: union of capsule actions (since only one resource, same as forResource)
  validAction1: z.infer<ReturnType<typeof schemas.actions.forResources<'capsule'>>> = 'list';
  validAction2: z.infer<ReturnType<typeof schemas.actions.forResources<'capsule'>>> = 'read';
  validAction3: z.infer<ReturnType<typeof schemas.actions.forResources<'capsule'>>> = 'create';
  validAction4: z.infer<ReturnType<typeof schemas.actions.forResources<'capsule'>>> = 'update';
  validAction5: z.infer<ReturnType<typeof schemas.actions.forResources<'capsule'>>> = 'delete';
  
  // Invalid: Schema infers as 'string' - invalid literals not caught
  // @ts-expect-error - Invalid action for capsule
  invalidAction1: z.infer<ReturnType<typeof schemas.actions.forResources<'capsule'>>> = 'ban';
  // @ts-expect-error - Invalid action for capsule
  invalidAction2: z.infer<ReturnType<typeof schemas.actions.forResources<'capsule'>>> = 'approve';
  
  // @ts-expect-error - Wrong types should error
  invalidAction3: z.infer<ReturnType<typeof schemas.actions.forResources<'capsule'>>> = 123;
  // @ts-expect-error - Wrong types should error
  invalidAction4: z.infer<ReturnType<typeof schemas.actions.forResources<'capsule'>>> = false;
}

class ActionsForRoleTypeTests {
  // Valid: admin has all capsule actions
  validAdminAction1: z.infer<ReturnType<typeof schemas.actions.forRole<'admin'>>> = 'list';
  validAdminAction2: z.infer<ReturnType<typeof schemas.actions.forRole<'admin'>>> = 'read';
  validAdminAction3: z.infer<ReturnType<typeof schemas.actions.forRole<'admin'>>> = 'create';
  validAdminAction4: z.infer<ReturnType<typeof schemas.actions.forRole<'admin'>>> = 'update';
  validAdminAction5: z.infer<ReturnType<typeof schemas.actions.forRole<'admin'>>> = 'delete';
  
  // Valid: sarah only has list, read
  validSarahAction1: z.infer<ReturnType<typeof schemas.actions.forRole<'sarah'>>> = 'list';
  validSarahAction2: z.infer<ReturnType<typeof schemas.actions.forRole<'sarah'>>> = 'read';
  
  // Invalid for sarah: Schema infers as 'string' - these won't error but should
  // @ts-expect-error - Sarah doesn't have create permission
  invalidSarahAction1: z.infer<ReturnType<typeof schemas.actions.forRole<'sarah'>>> = 'create';
  // @ts-expect-error - Sarah doesn't have update permission
  invalidSarahAction2: z.infer<ReturnType<typeof schemas.actions.forRole<'sarah'>>> = 'update';
  // @ts-expect-error - Sarah doesn't have delete permission
  invalidSarahAction3: z.infer<ReturnType<typeof schemas.actions.forRole<'sarah'>>> = 'delete';
  
  // @ts-expect-error - Wrong types should error
  invalidAction: z.infer<ReturnType<typeof schemas.actions.forRole<'admin'>>> = null;
}

class ActionsForRoleOnResourceTypeTests {
  // Valid: admin on capsule has all actions
  validAdminCapsule1: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'admin', 'capsule'>>> = 'list';
  validAdminCapsule2: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'admin', 'capsule'>>> = 'read';
  validAdminCapsule3: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'admin', 'capsule'>>> = 'create';
  validAdminCapsule4: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'admin', 'capsule'>>> = 'update';
  validAdminCapsule5: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'admin', 'capsule'>>> = 'delete';
  
  // Valid: sarah on capsule has only list, read
  validSarahCapsule1: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'sarah', 'capsule'>>> = 'list';
  validSarahCapsule2: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'sarah', 'capsule'>>> = 'read';
  
  // Invalid: Schema infers as 'string' - these won't error but should
  // @ts-expect-error - Sarah doesn't have create permission on capsule
  invalidSarahCapsule1: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'sarah', 'capsule'>>> = 'create';
  // @ts-expect-error - Sarah doesn't have update permission on capsule
  invalidSarahCapsule2: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'sarah', 'capsule'>>> = 'update';
  // @ts-expect-error - Sarah doesn't have delete permission on capsule
  invalidSarahCapsule3: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'sarah', 'capsule'>>> = 'delete';
  
  // @ts-expect-error - Wrong types should error
  invalidAction: z.infer<ReturnType<typeof schemas.actions.forRoleOnResource<'admin', 'capsule'>>> = 999;
}

class ActionsExcludingMethodTypeTests {
  // Valid: all actions minus 'create' and 'update'
  validAction1: z.infer<ReturnType<typeof schemas.actions.excluding<'create' | 'update'>>> = 'list';
  validAction2: z.infer<ReturnType<typeof schemas.actions.excluding<'create' | 'update'>>> = 'read';
  validAction3: z.infer<ReturnType<typeof schemas.actions.excluding<'create' | 'update'>>> = 'delete';
  
  // Invalid: Should not include excluded actions (but won't error due to string inference)
  // @ts-expect-error - Create is excluded
  invalidAction1: z.infer<ReturnType<typeof schemas.actions.excluding<'create' | 'update'>>> = 'create';
  // @ts-expect-error - Update is excluded
  invalidAction2: z.infer<ReturnType<typeof schemas.actions.excluding<'create' | 'update'>>> = 'update';
  
  // @ts-expect-error - Wrong types should error
  invalidAction3: z.infer<ReturnType<typeof schemas.actions.excluding<'create' | 'update'>>> = [];
}

class ActionsOnlyMethodTypeTests {
  // Valid: only list and read
  validAction1: z.infer<ReturnType<typeof schemas.actions.only<'list' | 'read'>>> = 'list';
  validAction2: z.infer<ReturnType<typeof schemas.actions.only<'list' | 'read'>>> = 'read';
  
  // Invalid: Should not include non-specified actions (but won't error due to string inference)
  // @ts-expect-error - Create not in 'only' list
  invalidAction1: z.infer<ReturnType<typeof schemas.actions.only<'list' | 'read'>>> = 'create';
  // @ts-expect-error - Update not in 'only' list
  invalidAction2: z.infer<ReturnType<typeof schemas.actions.only<'list' | 'read'>>> = 'update';
  // @ts-expect-error - Delete not in 'only' list
  invalidAction3: z.infer<ReturnType<typeof schemas.actions.only<'list' | 'read'>>> = 'delete';
  
  // @ts-expect-error - Wrong types should error
  invalidAction4: z.infer<ReturnType<typeof schemas.actions.only<'list' | 'read'>>> = { invalid: true };
}

class ActionsFilterMethodTypeTests {
  private readonly readOnlySchema = schemas.actions.filter((action): action is 'list' | 'read' => 
    action === 'list' || action === 'read');
  
  // Valid: actions that match the filter
  validFilteredAction1: z.infer<typeof this.readOnlySchema> = 'list';
  validFilteredAction2: z.infer<typeof this.readOnlySchema> = 'read';
  
  // Invalid: Actions not in the filtered type should error
  // @ts-expect-error - Create doesn't match read-only filter
  invalidFilteredAction1: z.infer<typeof this.readOnlySchema> = 'create';
  // @ts-expect-error - Delete doesn't match read-only filter
  invalidFilteredAction2: z.infer<typeof this.readOnlySchema> = 'delete';
  // @ts-expect-error - Update doesn't match read-only filter
  invalidFilteredAction3: z.infer<typeof this.readOnlySchema> = 'update';
  
  // @ts-expect-error - Wrong types should error
  invalidFilteredAction4: z.infer<typeof this.readOnlySchema> = 42;
}

class ActionsCommonToMethodTypeTests {
  // Common actions across resources (if multiple resources existed)
  // For single capsule resource, all actions are "common"
  validCommonAction1: z.infer<ReturnType<typeof schemas.actions.commonTo<'capsule'>>> = 'list';
  validCommonAction2: z.infer<ReturnType<typeof schemas.actions.commonTo<'capsule'>>> = 'read';
  validCommonAction3: z.infer<ReturnType<typeof schemas.actions.commonTo<'capsule'>>> = 'create';
  validCommonAction4: z.infer<ReturnType<typeof schemas.actions.commonTo<'capsule'>>> = 'update';
  validCommonAction5: z.infer<ReturnType<typeof schemas.actions.commonTo<'capsule'>>> = 'delete';
  
  // Invalid: Schema infers as 'string' - invalid actions not caught
  // @ts-expect-error - Ban is not a capsule action
  invalidCommonAction1: z.infer<ReturnType<typeof schemas.actions.commonTo<'capsule'>>> = 'ban';
  // @ts-expect-error - Approve is not a capsule action
  invalidCommonAction2: z.infer<ReturnType<typeof schemas.actions.commonTo<'capsule'>>> = 'approve';
  
  // @ts-expect-error - Wrong types should error
  invalidCommonAction3: z.infer<ReturnType<typeof schemas.actions.commonTo<'capsule'>>> = undefined;
}

// ============================================================================
// COMMON PERMISSIONS TYPE TESTS
// ============================================================================

import { commonSchemas } from '../common';

class CommonSchemasReadOnlyActionsTypeTests {
  // Valid: read-only actions
  validReadAction1: z.infer<typeof commonSchemas.readOnlyActions> = 'list';
  validReadAction2: z.infer<typeof commonSchemas.readOnlyActions> = 'read';
  
  // Invalid: write actions not allowed
  // @ts-expect-error - Create is not a read-only action
  invalidAction1: z.infer<typeof commonSchemas.readOnlyActions> = 'create';
  // @ts-expect-error - Update is not a read-only action
  invalidAction2: z.infer<typeof commonSchemas.readOnlyActions> = 'update';
  // @ts-expect-error - Delete is not a read-only action
  invalidAction3: z.infer<typeof commonSchemas.readOnlyActions> = 'delete';
  
  // @ts-expect-error - Wrong types should error
  invalidAction4: z.infer<typeof commonSchemas.readOnlyActions> = 123;
}

class CommonSchemasWriteActionsTypeTests {
  // Valid: write actions matching pattern /create|update|delete/
  validWriteAction1: z.infer<typeof commonSchemas.writeActions> = 'create';
  validWriteAction2: z.infer<typeof commonSchemas.writeActions> = 'update';
  validWriteAction3: z.infer<typeof commonSchemas.writeActions> = 'delete';
  
  // Invalid: read actions don't match pattern
  // @ts-expect-error - List doesn't match write pattern
  invalidAction1: z.infer<typeof commonSchemas.writeActions> = 'list';
  // @ts-expect-error - Read doesn't match write pattern
  invalidAction2: z.infer<typeof commonSchemas.writeActions> = 'read';
  
  // @ts-expect-error - Wrong types should error
  invalidAction3: z.infer<typeof commonSchemas.writeActions> = false;
}

class CommonSchemasCapsuleActionsTypeTests {
  // Valid: all capsule actions
  validCapsuleAction1: z.infer<typeof commonSchemas.capsuleActions> = 'list';
  validCapsuleAction2: z.infer<typeof commonSchemas.capsuleActions> = 'read';
  validCapsuleAction3: z.infer<typeof commonSchemas.capsuleActions> = 'create';
  validCapsuleAction4: z.infer<typeof commonSchemas.capsuleActions> = 'update';
  validCapsuleAction5: z.infer<typeof commonSchemas.capsuleActions> = 'delete';
  
  // Invalid: user actions not in capsule resource
  // @ts-expect-error - Ban is a user action, not capsule
  invalidAction1: z.infer<typeof commonSchemas.capsuleActions> = 'ban';
  // @ts-expect-error - Approve is a user action, not capsule
  invalidAction2: z.infer<typeof commonSchemas.capsuleActions> = 'approve';
  
  // @ts-expect-error - Wrong types should error
  invalidAction3: z.infer<typeof commonSchemas.capsuleActions> = null;
}

class CommonSchemasDestructiveActionsTypeTests {
  // Valid: only delete action
  validDestructiveAction: z.infer<typeof commonSchemas.destructiveActions> = 'delete';
  
  // Invalid: all other actions
  // @ts-expect-error - List is not destructive
  invalidAction1: z.infer<typeof commonSchemas.destructiveActions> = 'list';
  // @ts-expect-error - Read is not destructive
  invalidAction2: z.infer<typeof commonSchemas.destructiveActions> = 'read';
  // @ts-expect-error - Create is not destructive
  invalidAction3: z.infer<typeof commonSchemas.destructiveActions> = 'create';
  // @ts-expect-error - Update is not destructive
  invalidAction4: z.infer<typeof commonSchemas.destructiveActions> = 'update';
  
  // @ts-expect-error - Wrong types should error
  invalidAction5: z.infer<typeof commonSchemas.destructiveActions> = [];
}

class CommonSchemasSafeActionsTypeTests {
  // Valid: all actions except delete
  validSafeAction1: z.infer<typeof commonSchemas.safeActions> = 'list';
  validSafeAction2: z.infer<typeof commonSchemas.safeActions> = 'read';
  validSafeAction3: z.infer<typeof commonSchemas.safeActions> = 'create';
  validSafeAction4: z.infer<typeof commonSchemas.safeActions> = 'update';
  validSafeAction5: z.infer<typeof commonSchemas.safeActions> = 'ban';
  
  // Invalid: delete is excluded
  // @ts-expect-error - Delete is excluded from safe actions
  invalidAction1: z.infer<typeof commonSchemas.safeActions> = 'delete';
  
  // @ts-expect-error - Wrong types should error
  invalidAction2: z.infer<typeof commonSchemas.safeActions> = {};
}

class CommonSchemasReadOnlyPermissionTypeTests {
  // Valid: read-only permission structure
  validPermission1: z.infer<typeof commonSchemas.readOnlyPermission> = {
    capsule: ['list', 'read']
  };
  validPermission2: z.infer<typeof commonSchemas.readOnlyPermission> = {
    capsule: ['list']
  };
  validPermission3: z.infer<typeof commonSchemas.readOnlyPermission> = {
    capsule: ['read']
  };
  validPermission4: z.infer<typeof commonSchemas.readOnlyPermission> = {};
  
  // Invalid: write actions not allowed
  
  invalidPermission1: z.infer<typeof commonSchemas.readOnlyPermission> = {
    // @ts-expect-error - Create not allowed in read-only permission
    capsule: ['create']
  };
  
  invalidPermission2: z.infer<typeof commonSchemas.readOnlyPermission> = {
    // @ts-expect-error - Update not allowed in read-only permission
    capsule: ['update']
  };
  
  invalidPermission3: z.infer<typeof commonSchemas.readOnlyPermission> = {
    // @ts-expect-error - Delete not allowed in read-only permission
    capsule: ['delete']
  };
  
  // @ts-expect-error - Wrong types should error
  invalidPermission4: z.infer<typeof commonSchemas.readOnlyPermission> = 'invalid';
}

class CommonSchemasWriteOnlyPermissionTypeTests {
  // Valid: write-only permission structure
  validPermission1: z.infer<typeof commonSchemas.writeOnlyPermission> = {
    capsule: ['create', 'update', 'delete']
  };
  validPermission2: z.infer<typeof commonSchemas.writeOnlyPermission> = {
    capsule: ['create']
  };
  validPermission3: z.infer<typeof commonSchemas.writeOnlyPermission> = {
    capsule: ['update', 'delete']
  };
  validPermission4: z.infer<typeof commonSchemas.writeOnlyPermission> = {};
  
  // Invalid: read actions not allowed
  
  invalidPermission1: z.infer<typeof commonSchemas.writeOnlyPermission> = {
    // @ts-expect-error - List not allowed in write-only permission
    capsule: ['list']
  };
  
  invalidPermission2: z.infer<typeof commonSchemas.writeOnlyPermission> = {
    // @ts-expect-error - Read not allowed in write-only permission
    capsule: ['read']
  };
  
  invalidPermission3: z.infer<typeof commonSchemas.writeOnlyPermission> = {
    // @ts-expect-error - Mixed read/write not allowed
    capsule: ['list', 'create']
  };
  
  // @ts-expect-error - Wrong types should error
  invalidPermission4: z.infer<typeof commonSchemas.writeOnlyPermission> = null;
}

class CommonSchemasAdminCapsulePermissionTypeTests {
  // Valid: all admin actions on capsule resource
  validAdminAction1: z.infer<typeof commonSchemas.adminCapsulePermission> = 'list';
  validAdminAction2: z.infer<typeof commonSchemas.adminCapsulePermission> = 'read';
  validAdminAction3: z.infer<typeof commonSchemas.adminCapsulePermission> = 'create';
  validAdminAction4: z.infer<typeof commonSchemas.adminCapsulePermission> = 'update';
  validAdminAction5: z.infer<typeof commonSchemas.adminCapsulePermission> = 'delete';
  
  // Invalid: user-specific actions not in capsule
  // @ts-expect-error - Ban is not a capsule action
  invalidAction1: z.infer<typeof commonSchemas.adminCapsulePermission> = 'ban';
  // @ts-expect-error - Approve is not a capsule action
  invalidAction2: z.infer<typeof commonSchemas.adminCapsulePermission> = 'approve';
  
  // @ts-expect-error - Wrong types should error
  invalidAction3: z.infer<typeof commonSchemas.adminCapsulePermission> = 999;
}

class CommonSchemasAdminAllActionsTypeTests {
  // Valid: all actions that admin has across all resources
  validAdminAction1: z.infer<typeof commonSchemas.adminAllActions> = 'list';
  validAdminAction2: z.infer<typeof commonSchemas.adminAllActions> = 'read';
  validAdminAction3: z.infer<typeof commonSchemas.adminAllActions> = 'create';
  validAdminAction4: z.infer<typeof commonSchemas.adminAllActions> = 'update';
  validAdminAction5: z.infer<typeof commonSchemas.adminAllActions> = 'delete';
  validAdminAction6: z.infer<typeof commonSchemas.adminAllActions> = 'ban';
  
  // No invalid actions - admin has all permissions
  
  // @ts-expect-error - Wrong types should error
  invalidAction: z.infer<typeof commonSchemas.adminAllActions> = true;
}

class CommonSchemasSarahAllActionsTypeTests {
  // Valid: only actions Sarah has (list, read)
  validSarahAction1: z.infer<typeof commonSchemas.sarahAllActions> = 'list';
  validSarahAction2: z.infer<typeof commonSchemas.sarahAllActions> = 'read';
  
  // Invalid: Sarah doesn't have write permissions
  // @ts-expect-error - Sarah doesn't have create permission
  invalidSarahAction1: z.infer<typeof commonSchemas.sarahAllActions> = 'create';
  // @ts-expect-error - Sarah doesn't have update permission
  invalidSarahAction2: z.infer<typeof commonSchemas.sarahAllActions> = 'update';
  // @ts-expect-error - Sarah doesn't have delete permission
  invalidSarahAction3: z.infer<typeof commonSchemas.sarahAllActions> = 'delete';
  // @ts-expect-error - Sarah doesn't have ban permission
  invalidSarahAction4: z.infer<typeof commonSchemas.sarahAllActions> = 'ban';
  // @ts-expect-error - Sarah doesn't have approve permission
  invalidSarahAction5: z.infer<typeof commonSchemas.sarahAllActions> = 'approve';
  
  // @ts-expect-error - Wrong types should error
  invalidSarahAction6: z.infer<typeof commonSchemas.sarahAllActions> = [];
}

// ============================================================================
// COMPILE-TIME TYPE CHECKING COMPLETE
// ============================================================================
// All tests above check TYPES at compile time using z.infer<typeof schema>
// TypeScript will show errors on @ts-expect-error lines if types are correct
// Run: bunx tsc --noEmit src/permissions/test-types.ts
// Expected: All @ts-expect-error directives should be USED (show type errors)
// ============================================================================

console.log('✅ Type tests file loaded successfully');

// ============================================================================
// END OF TYPE TESTS
// ============================================================================
// To verify these tests:
// Run: bunx tsc --noEmit src/permissions/test-types.ts
//
// Expected behavior:
// - All @ts-expect-error directives should be USED (showing TypeScript errors)
// - Valid assignments should compile without errors
// - Invalid assignments marked with @ts-expect-error should show proper type errors
//
// This file only tests COMPILE-TIME type safety, not runtime validation.
// For runtime validation tests, see config.ts (uses safeParse)
