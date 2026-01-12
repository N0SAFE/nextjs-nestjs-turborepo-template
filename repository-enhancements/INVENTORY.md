# Complete Repository Inventory

> Detailed inventory of all packages, components, hooks, and files

---

## Apps Inventory

### apps/api (NestJS Backend)

**Core Structure:**
```
apps/api/src/
├── core/
│   ├── core.module.ts
│   ├── middlewares/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── decorators/
│   │   │   ├── definitions/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── middlewares/
│   │   │   ├── orpc/
│   │   │   ├── plugin-utils/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── database/
│   │   ├── events/
│   │   └── push/
│   └── utils/
├── auth.ts (main auth configuration)
└── main.ts (entry point)
```

**Key Files:**
- `auth.ts` - Better Auth configuration
- `core.module.ts` - Core NestJS module
- `drizzle.config.ts` - Database configuration

---

### apps/web (Next.js Frontend)

**Directory Structure:**
```
apps/web/src/
├── app/
│   ├── (app)/
│   ├── (internal)/
│   ├── api/
│   ├── auth/
│   ├── dashboard/
│   │   ├── admin/
│   │   │   └── users/
│   │   ├── demo/
│   │   ├── organizations/
│   │   └── profile/
│   ├── layout.tsx
│   ├── loading.tsx
│   └── not-found.tsx
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── dev/
│   ├── devtools/
│   ├── loading/
│   ├── navigation/
│   ├── permissions/
│   ├── push-notifications/
│   └── signout/
├── hooks/
├── lib/
│   ├── auth/
│   ├── debug/
│   ├── orpc/
│   ├── routes/
│   └── timing/
└── utils/
```

**Hooks Inventory (12 files):**
| File | Lines | Status | Purpose |
|------|-------|--------|---------|
| `useAdmin.ts` | 290 | ✅ Active | Admin user management |
| `useAuth.ts` | 150 | ✅ Active | Auth mutations |
| `useInvitation.ts` | 180 | ⚠️ Has TODOs | Invitation management |
| `useOrganization.ts` | 200 | ✅ Active | Organization management |
| `useOrganizationMembers.ts` | 190 | ✅ Active | Member management |
| `usePermissions.ts` | 270 | ✅ Active | Permission checking |
| `useSession.ts` | 80 | ✅ Active | Session management |
| `useUsers.ts` | 632 | 🔴 Deprecated | Legacy user hooks |
| `useUser.orpc-hooks.ts` | 200 | ✅ Active | Generated ORPC hooks |
| `index.ts` | 20 | ✅ Active | Exports |

---

### apps/doc (Documentation)

**Structure:**
```
apps/doc/
├── content/
│   └── docs/
├── src/
│   ├── app/
│   └── components/
├── source.config.ts
└── next.config.ts
```

---

## Packages Inventory

### tools/bin (CLI Utilities)

> **Note:** Currently at `packages/bin` - should be moved to `tools/bin`

**declarative-routing:**
- CLI for generating type-safe routes
- Config management
- Route info generation

**runthenkill:**
- Process management utility
- Used for dev server management

### tools/codegen (Code Generation)

> **Note:** Should be created at `tools/codegen/orpc-hooks`

**orpc-hooks:**
- ORPC hook generator
- Type-safe hook generation from contracts

---

### packages/configs (Shared Configurations)

| Package | Purpose | Files |
|---------|---------|-------|
| `@repo-configs/eslint` | ESLint configuration | eslint.config.ts |
| `@repo-configs/prettier` | Prettier configuration | prettier.config.ts |
| `@repo-configs/typescript` | TypeScript configs | base.json, react.json |
| `@repo-configs/vitest` | Vitest configuration | vitest.config.ts |
| `@repo-configs/tailwind` | Tailwind configuration | tailwind.config.ts |

---

### packages/contracts/api

**API Contracts:**
```
packages/contracts/api/
├── src/
│   ├── contracts/
│   │   ├── user.contract.ts
│   │   └── ...
│   ├── index.ts
│   └── schemas/
└── package.json
```

---

### packages/types

**Type Definitions:**
```
packages/types/
├── src/
│   ├── index.ts
│   └── utils.ts
└── __tests__/
```

---

### packages/ui/base

**Component Inventory:**

**ShadCN Components (28):**
```
packages/ui/base/src/components/shadcn/
├── alert.tsx
├── avatar.tsx
├── badge.tsx
├── breadcrumb.tsx
├── button.tsx
├── card.tsx
├── chart.tsx
├── command.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── form.tsx
├── input.tsx
├── label.tsx
├── mode-toggle.tsx
├── popover.tsx
├── progress.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── sidebar.tsx
├── skeleton.tsx
├── slider.tsx
├── sonner.tsx
├── switch.tsx
├── table.tsx
├── tabs.tsx
└── tooltip.tsx
```

**Atomic Components:**
```
packages/ui/base/src/components/atomics/
├── atoms/
│   ├── Icon.tsx
│   ├── ImageOrPlaceholder.tsx
│   ├── Loader.tsx
│   └── VideoOrPlaceholder.tsx
└── molecules/
    └── Card.tsx
```

**Theme:**
```
packages/ui/base/src/components/
└── theme-provider.tsx
```

---

### packages/utils

#### packages/utils/auth

**Structure:**
```
packages/utils/auth/src/
├── client/           # Client-side auth
├── permissions/      # Permission system
│   ├── access-control.ts
│   ├── common.ts
│   ├── config.ts (440 lines)
│   ├── docs/
│   ├── index.ts
│   ├── plugins/
│   ├── system/
│   └── utils.ts
├── react/            # React hooks
├── server/           # Server-side auth
├── index.ts
└── types.ts
```

**Permission Resources:**

Platform (9):
1. `user` - User management
2. `session` - Session management
3. `organization` - Organization management
4. `system` - System configuration
5. `setup` - Initial setup
6. `platformAnalytics` - Analytics
7. `platformLogs` - Logs
8. `traefik` - Reverse proxy
9. `platformDomain` - Domain management

Organization (17):
1. `orgSettings` - Organization settings
2. `orgMember` - Member management
3. `orgInvitation` - Invitations
4. `team` - Team management
5. `project` - Project management
6. `service` - Service management
7. `deployment` - Deployments
8. `environment` - Environments
9. `secret` - Secrets
10. `domain` - Domains
11. `webhook` - Webhooks
12. `apiKey` - API keys
13. `github` - GitHub integration
14. `analytics` - Analytics
15. `logs` - Logs
16. `healthCheck` - Health checks
17. `billing` - Billing

---

#### packages/utils/orpc

**Structure:**
```
packages/utils/orpc/src/
├── builder/
│   ├── index.ts
│   ├── mount-method.ts
│   └── route-builder.ts (1423 lines)
├── hooks/
│   ├── __tests__/
│   ├── composite-hooks.ts
│   ├── generate-hooks.ts (999 lines)
│   ├── index.ts
│   └── invalidation.ts
├── query/
├── standard/
│   └── standard-operations.ts (1697 lines)
├── utils/
└── index.ts
```

---

#### packages/utils/env

**Environment Utilities:**
- Type-safe environment variable handling
- Validation functions
- URL builders

---

#### packages/utils/declarative-routing

**Routing Utilities:**
- Type-safe route generation
- Route info helpers
- Link component wrappers

---

## Web Application Components

### apps/web/src/components/

**auth/ (Authentication Components):**
- `RequirePermission.tsx` (174 lines) - ⚠️ Duplicate
- `SessionHydration.tsx` - Session state management
- Additional auth components

**permissions/ (Permission Components):**
- `RequirePermission.tsx` (227 lines) - ⚠️ Duplicate
- Permission-related UI components

**dashboard/ (Dashboard Components):**
- Dashboard-specific components
- Admin panel components

**dev/ (Development Components):**
- Development-only components
- Debug tools

**devtools/ (DevTools):**
- React Query DevTools
- Debug panels

**loading/ (Loading States):**
- Loading spinners
- Skeleton components

**navigation/ (Navigation):**
- Header components
- Sidebar components
- Navigation menus

**push-notifications/ (PWA):**
- Push notification components
- Service worker integration

**signout/ (Sign Out):**
- Sign out components
- Session cleanup

---

## File Size Analysis

### Largest Files (Lines of Code)

| File | Lines | Package |
|------|-------|---------|
| `standard-operations.ts` | 1697 | @repo/orpc-utils |
| `route-builder.ts` | 1423 | @repo/orpc-utils |
| `generate-hooks.ts` | 999 | @repo/orpc-utils |
| `tanstack-query.ts` | 800+ | web |
| `useUsers.ts` | 632 | web (DEPRECATED) |
| `config.ts` | 440 | @repo/auth-utils |
| `useAdmin.ts` | 290 | web |
| `usePermissions.ts` | 270 | web |
| `RequirePermission.tsx` | 227 | web/permissions |
| `useUser.orpc-hooks.ts` | 200 | web |

---

## Test Files

### Test Location Summary

| Package | Test Directory | Status |
|---------|---------------|--------|
| `@repo/orpc-utils` | `src/hooks/__tests__/` | 🔴 45/54 failing |
| `@repo/types` | `__tests__/` | ✅ Passing |
| `web` | Various | ⚠️ Unknown |
| `api` | Various | ⚠️ Unknown |

---

## Configuration Files

### Root Level
- `turbo.json` - Turborepo configuration
- `package.json` - Root package.json
- `bunfig.toml` - Bun configuration
- `vitest.config.mts` - Root vitest config

### Per-App Configuration
Each app has:
- `package.json`
- `tsconfig.json`
- `eslint.config.ts`
- `vitest.config.mts` (if tests exist)

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Apps | 4 |
| Shared Packages | 15 |
| Config Packages | 5 |
| Utility Packages | 4 |
| ShadCN Components | 28 |
| Atomic Components | 5 |
| Web Hooks | 12 |
| Platform Resources | 9 |
| Organization Resources | 17 |
| Test Files | 5+ |
| Total TypeScript Files | 200+ |
