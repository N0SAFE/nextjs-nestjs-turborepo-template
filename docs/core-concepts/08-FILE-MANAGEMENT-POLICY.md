📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > File Management Policy

# File Management Policy

> **Type**: Core Concept - Development Process  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-14

## Overview

**⚠️ NEVER delete or remove files without explicit user permission**

## Rules

### Before Deleting ANY File

1. **Always ask** before deleting any files
2. **Explain why** the file should be deleted
3. **Wait for approval** from the user
4. **Document the deletion** in commit messages

This applies to:
- Even if files appear redundant
- Even if files appear outdated
- Even if files appear unused
- Even if files appear duplicate

### When Reorganizing Code

1. **Preserve existing functionality** by migrating content properly
2. **Never use** `rm`, `git rm`, or file deletion commands without user approval
3. **Create replacement** files before suggesting deletion
4. **Test functionality** after reorganization

## ❌ WRONG: Deleting Without Permission

```typescript
// ❌ NEVER do this
await runCommand('rm apps/api/src/old-service.ts');
await runCommand('git rm apps/api/src/unused-module.ts');
```

## ✅ CORRECT: Request Permission

```
⚠️ File deletion request:

The following files appear to be unused after refactoring:
- apps/api/src/modules/old/old-service.ts
- apps/api/src/modules/old/old-adapter.ts

Reason: Functionality migrated to new service-adapter pattern.

May I delete these files?
```

## Exceptions

None. This rule has **NO EXCEPTIONS**.

Even seemingly trivial files may contain:
- Important comments or documentation
- Edge case handling
- Configuration that isn't obvious
- Code that is used but not easily detectable

## Enforcement

This policy is **MANDATORY**. Violations can result in loss of important code and project history.

## Related Core Concepts

- [Documentation-First Workflow](./01-DOCUMENTATION-FIRST-WORKFLOW.md)
- [Efficient Execution Protocol](./00-EFFICIENT-EXECUTION-PROTOCOL.md)
