# Authentication (Better Auth)

Authentication uses Better Auth across API and Web.

## Key points

- Session management via Better Auth
- API exposes request-scoped auth access through `AuthService` (wrapping `AuthCoreService`)
- Web uses a session-aware auth client integrated with React Query cache
- Roles/permissions are enforced via auth middleware/guards in API handlers

## System boundaries

- **Auth package** (`@repo/auth`): shared auth primitives, adapters, client/server exports
- **API app** (`apps/api`): creates and wires auth instance, middleware, and request-scoped service
- **Web app** (`apps/web`): configures server wrappers and client hooks around session state

This split keeps auth logic centralized while preserving app-specific wiring.

## Where to look

- API instance bootstrap: `apps/api/src/auth.ts`
- API auth factory/config: `apps/api/src/config/auth/auth.ts`
- API request-scoped service: `apps/api/src/core/modules/auth/services/auth.service.ts`
- Web auth client: `apps/web/src/lib/auth/index.ts`
- Web server auth configuration: `apps/web/src/routes/configure-auth.ts`

## Request flow (high-level)

1. Incoming request carries auth cookie/token
2. API auth middleware resolves session and context
3. ORPC handlers enforce auth/permissions (`requireAuth`, checks, role/permission middleware)
4. Web client/session hooks consume session state through React Query-aware client helpers

## Common flows

- Read session on the server via cookie/session helpers and configured route wrappers
- Consume session in client components through auth hooks (`useSession`) and domain hooks
- Protect ORPC handlers with `requireAuth()` middleware and/or auth checks
- Configure providers/secrets via environment

## Security and DX notes

- Keep secrets server-only (no `NEXT_PUBLIC_` for private auth secrets)
- Prefer centralized permission checks over ad-hoc checks in handlers/components
- Use request-scoped auth service in API HTTP context and core service where request context is unavailable (e.g., CLI)

## Common pitfalls

- Mixing client-only and server-only auth helpers
- Assuming session exists in server components without checks
- Bypassing auth middleware in ORPC handlers

## See also

- Core concept: ../core-concepts/07-BETTER-AUTH-INTEGRATION.md
- Internal package model: ./internal-packages.md
- Tech stack: ../reference/TECH-STACK.md
- Environment: ../features/ENVIRONMENT-TEMPLATE-SYSTEM.md
