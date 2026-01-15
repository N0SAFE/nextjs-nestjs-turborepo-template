# Knip Dead Code Analysis Report

**Date**: January 15, 2026  
**Total Issues Found**: 384 items across 7 categories

---

## Part 1: Unused Files Analysis (67 files)

### Category 1A: Documentation Tooling (3 files) ✅ KEEP

**Files:**
- `.docs/bin/check-doc-links.ts`
- `.docs/bin/generate-doc-diagram.ts`
- `.docs/bin/link-utils.ts`

**Analysis:**
- These are CLI tools for documentation maintenance
- Not imported by any code (they're executables)
- Run directly via shebang: `#!/usr/bin/env bun`

**Why Knip flagged them:**
Knip doesn't detect files executed directly as scripts (not imported as modules)

**Recommendation:** ✅ **KEEP** - Add to knip.config.ts entry patterns:
```typescript
'.docs': {
  entry: ['.docs/bin/*.ts'],
  project: ['.docs/**/*.ts']
}
```

---

### Category 1B: Barrel Export Files (4 files) ❓ REVIEW

**Files:**
- `apps/api/src/cli/services/index.ts` - exports `cli-auth.service`
- `apps/api/src/modules/health/index.ts` - re-exports from `@repo/api-contracts`
- `apps/api/src/modules/user/index.ts` - (need to check)
- `apps/web/src/components/push-notifications/index.ts` - (need to check)

**Analysis for `apps/api/src/cli/services/index.ts`:**
```typescript
export * from './cli-auth.service';
```
This is a barrel export. The service is likely used but via the barrel.

**Analysis for `apps/api/src/modules/health/index.ts`:**
```typescript
export { healthContract } from '@repo/api-contracts';
export type { HealthContract } from '@repo/api-contracts';
```
This re-exports contracts for convenience but may not be used.

**Why Knip flagged them:**
Knip marks barrel files (index.ts) as unused if nothing imports from them

**Recommendation:** 
- ✅ **KEEP** if other code imports from these index files
- ❌ **DELETE** if they're truly unused (will verify in next step)
- Need to search for imports like `from '@/modules/health'` or `from '@/cli/services'`

---

### Category 1C: Unused Infrastructure (7 files) ❌ LIKELY SAFE TO DELETE

**Files:**
- `apps/api/src/core/core.module.ts`
- `apps/api/src/core/modules/events/base-event.service.ts`
- `apps/api/src/core/modules/events/event-contract.builder.ts`
- `apps/api/src/core/modules/events/events.module.ts`
- `apps/api/src/core/modules/events/index.ts`
- `apps/api/src/core/modules/push/index.ts`

**Analysis for `core.module.ts`:**
```typescript
@Module({
    imports: [],
    providers: [AuthModule, DatabaseModule, PushModule],
    exports: [AuthModule, DatabaseModule, PushModule],
})
export class CoreModule {}
```
Search shows: **NO imports of `CoreModule`** anywhere in the codebase.

**Analysis for `EventsModule`:**
```typescript
@Module({
  providers: [],
  exports: [],
})
export class EventsModule {}
```
Empty module with no providers or exports. **Never imported**.

**Why Knip flagged them:**
These modules were created but never integrated into the app

**Recommendation:** ❌ **SAFE TO DELETE**
- The core modules system is unused
- Individual modules (AuthModule, DatabaseModule) are imported directly
- Events infrastructure was planned but never implemented

---

### Status Summary for Part 1:
- ✅ **KEEP**: 3 files (documentation tools)
- ❓ **REVIEW**: 4 files (barrel exports - need import check)
- ❌ **DELETE**: 7 files (unused infrastructure)
- 🔄 **PENDING**: 53 files (to analyze in next parts)

---

**Next Step**: Continue with Category 1D (analyzing web app unused files)?
