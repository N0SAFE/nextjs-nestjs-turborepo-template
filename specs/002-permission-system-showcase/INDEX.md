# 002 - Permission System Showcase

> Comprehensive demonstration of Better Auth integration with Organization management, Admin panel, and ORPC middleware patterns.

## Quick Links

| Document | Description |
|----------|-------------|
| [spec.md](./spec.md) | Full specification with architecture, features, and implementation phases |

## Status

- **Planning**: ✅ Complete
- **Phase 1 - API Foundation**: ⏳ Not Started
- **Phase 2 - Web App Structure**: ⏳ Not Started
- **Phase 3 - Permission Components**: ⏳ Not Started
- **Phase 4 - Admin Panel**: ⏳ Not Started
- **Phase 5 - Integration**: ⏳ Not Started

## Overview

This spec defines the implementation of a **Permission System Showcase** that demonstrates:

1. **Better Auth Plugins**
   - Organization Plugin (multi-tenant orgs)
   - Admin Plugin (platform administration)
   - Master Token Plugin (dev auth)
   - Login As Plugin (impersonation)

2. **Dual-Layer Permissions**
   - Platform roles: `superAdmin > admin > user`
   - Organization roles: `owner > admin > member`

3. **ORPC Middleware Patterns**
   - Static permission checks
   - `.forInput()` + mapInput (recommended)
   - Generic resolvers for multi-param methods
   - Composite checks

4. **Type-Safe Routing**
   - Declarative routing with `page.info.ts`
   - Typed params, search params, and navigation

## Key Files

### API
- `packages/contracts/api/modules/organization/` - ORPC contracts
- `apps/api/src/modules/organization/` - NestJS module

### Web
- `apps/web/src/app/(app)/dashboard/` - Dashboard pages
- `apps/web/src/components/auth/` - Permission components
- `apps/web/src/hooks/useOrganization*.ts` - Organization hooks

### Shared
- `packages/utils/auth/src/permissions/` - Permission system

## Implementation Order

1. **Phase 1**: API contracts & organization module (4-6h)
2. **Phase 2**: Web app structure with routing (4-6h)
3. **Phase 3**: Permission-aware components (2-3h)
4. **Phase 4**: Admin panel (3-4h)
5. **Phase 5**: Hooks & integration (2-3h)

**Total Estimated**: 15-22 hours

## Related

- PR #136: Better Auth Plugin Integration
- `.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md`
- `apps/api/src/modules/test/controllers/test.controller.ts` (middleware pattern reference)
