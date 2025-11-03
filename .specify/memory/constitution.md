<!-- 
Sync Impact Report (v1.0.0)
================================
Version Change: NEW → 1.0.0 (Initial Constitution)
Ratification Date: 2025-10-16
Principles Established: 7 core principles for Docker-first, type-safe SaaS development
Foundation Documents: Core concepts in /docs/core-concepts/ are mandatory reference material
Key Sections: Monorepo Architecture, End-to-End Type Safety, Docker-First Development
-->

# Next.js + NestJS Monorepo Constitution

A living charter governing development practices for the Next.js + NestJS Docker-first SaaS template.
This constitution enforces the architectural patterns, design principles, and quality standards that
make this monorepo maintainable, scalable, and type-safe across full-stack development.

## Core Principles

### I. End-to-End Type Safety via ORPC (NON-NEGOTIABLE)

All API communication MUST use ORPC contracts as the single source of truth for types. Contracts
are defined in `packages/api-contracts/index.ts`, implemented in `apps/api/src/`, and consumed as
generated React Query hooks in `apps/web/src/`.

**Rules:**
- ✅ All endpoints MUST define ORPC contracts before implementation
- ✅ API implementation MUST satisfy contract types
- ❌ NO traditional REST decorators or manual fetch calls in frontend code
- ✅ Contract changes propagate automatically to frontend via code generation (`bun run web -- generate`)
- ✅ Type mismatches caught at compile-time, never at runtime

**Rationale:** Eliminates category of bugs where frontend/backend types drift; ensures all API
changes are immediately reflected in TypeScript inference; provides auto-completion and refactoring safety.

---

### II. Monorepo Discipline via Turborepo & Workspace References

All dependencies between packages and apps MUST flow through Turborepo workspace references (`"*"`),
with clear separation of concerns: shared packages (`packages/`) provide reusable infrastructure;
feature modules live in `apps/api/src/modules/`; frontend lives in `apps/web/`.

**Rules:**
- ✅ Internal packages referenced as workspace `"*"` in `package.json`
- ✅ Core modules in `apps/api/src/core/modules/` export services ONLY (no HTTP endpoints)
- ✅ Feature modules in `apps/api/src/modules/` implement HTTP endpoints + domain logic
- ✅ Core modules CANNOT import feature modules (dependency inversion enforced)
- ✅ Shared UI components live in `packages/ui/` as Shadcn components
- ✅ All test configurations inherit from `@repo-configs/vitest`

**Rationale:** Clear boundaries prevent circular dependencies; workspace references force explicit
versioning; Turborepo caching accelerates builds and tests; shared packages unify patterns.

---

### III. Docker-First Development & Deployment

Development and deployment MUST use Docker containers exclusively for consistency and reproducibility.
Local machine scripts exist only for necessary build/generation steps that don't require running services.

**Rules:**
- ✅ Full stack development: `bun run dev` (runs all services in Docker)
- ✅ API development: `bun run dev:api` (includes PostgreSQL + Redis)
- ✅ Web development: `bun run dev:web` (connects to external API)
- ✅ Database operations (seed, migrate) run INSIDE dev containers via `bun run api -- db:seed`
- ✅ Build-time compilation preferred for production (Dockerfile.*.build-time.prod)
- ✅ Environment configuration via `.env` template system

**Rationale:** Docker eliminates "works on my machine"; enforces consistency across team;
simplifies deployment to Render and other platforms; isolates service dependencies.

---

### IV. Centralized Testing via Vitest & Unified Coverage

All tests MUST use Vitest with configurations inherited from `@repo-configs/vitest`. Test files
colocate with source (`__tests__/` directories), and coverage is merged centrally.

**Rules:**
- ✅ All unit/integration tests use Vitest across packages and apps
- ✅ Test config per-package inherits from `@repo-configs/vitest`
- ✅ Coverage reports merged centrally: `bun run test:coverage`
- ✅ Minimum coverage enforced in critical packages (API, UI, contracts)
- ✅ Contract changes require tests proving both API + frontend integration

**Rationale:** Unified testing framework ensures consistency; centralized coverage prevents gaps;
colocated tests reduce cognitive load; ORPC contract tests validate both ends of communication.

---

### V. Declarative Routing & Type-Safe Navigation

Frontend routing MUST use the declarative routing system with `page.info.ts` metadata. Routes
are generated as type-safe Link components and fetch functions, eliminating manual href strings.

**Rules:**
- ✅ Every page/API route has `page.info.ts` with metadata (or `route.info.ts` for API routes)
- ✅ Routes regenerated after structural changes: `bun run web -- dr:build`
- ✅ All navigation uses `<Route.Link>` components, never raw `<a href>` tags
- ✅ API calls use generated fetch functions with typed parameters, never manual `fetch()`
- ✅ Routes provide type-safe params via `useParams()` and `useSearchParams()` hooks

**Rationale:** Eliminates broken links and 404 errors; type-safe params prevent runtime errors;
automatic generation ensures no manual URL maintenance; refactoring routes updates all usages.

---

### VI. Shared UI Component Library with Shadcn

All reusable UI components MUST be added to `packages/ui/` as Shadcn components. Component selection
follows Shadcn's curated library; styling uses Tailwind CSS from shared config.

**Rules:**
- ✅ Reusable components added via `bun run ui:add [component-name]`
- ✅ All components built on Radix UI primitives + Tailwind
- ✅ Tailwind config shared from `packages/tailwind-config/`
- ✅ Theme configuration centralized in UI package
- ✅ App-specific overrides allowed in `apps/web/components/` or `apps/api/public/`

**Rationale:** Shadcn components provide accessibility baseline; Tailwind ensures visual consistency;
shared config prevents style drift; component reuse reduces bundle size and maintenance burden.

---

### VII. Documentation-First Workflow (MANDATORY)

All development MUST follow the documentation-first workflow: read relevant documentation in
`docs/` and `docs/core-concepts/` BEFORE implementing changes. Core concepts in
`docs/core-concepts/` are non-negotiable reference material.

**Rules:**
- ✅ Read `docs/core-concepts/*.md` at start of every session
- ✅ Read `docs/README.md` to navigate documentation hub
- ✅ Implementation MUST follow architectural patterns documented in core concepts
- ✅ New concepts/patterns documented in `docs/core-concepts/` before merging
- ✅ Documentation updated whenever code patterns change

**Rationale:** Documentation captures institutional knowledge; prevents reinvention; ensures
consistency across contributors; serves as source of truth for architecture decisions.

---

## Technology Stack & Mandatory Standards

**Frontend:** Next.js 15.x + React 19 + TypeScript + Tailwind CSS + Shadcn UI
- ✅ App Router (not Pages Router)
- ✅ Server Components by default, Client Components only when interactive
- ✅ Declarative Routing for type-safe navigation
- ✅ ORPC client with React Query for data fetching
- ✅ Better Auth for authentication

**Backend:** NestJS 10.x + ORPC + Better Auth + Drizzle ORM + PostgreSQL
- ✅ Core vs Feature architecture (core modules non-negotiable)
- ✅ ORPC contracts for all endpoints
- ✅ Drizzle ORM for type-safe database access
- ✅ Better Auth for user/session management
- ✅ No manual REST decorators

**Shared Infrastructure:** Turborepo + Docker + Bun + TypeScript + Vitest
- ✅ Workspace-based monorepo with `packages/` and `apps/`
- ✅ All environments run in Docker containers
- ✅ Bun as primary package manager and runtime
- ✅ TypeScript 5.x for type safety everywhere
- ✅ Vitest with centralized coverage

**Database & Cache:** PostgreSQL 16 + Redis 8 + Drizzle ORM
- ✅ Database migrations via Drizzle (`bun run api -- db:generate/push/migrate`)
- ✅ Type-safe queries from schema
- ✅ Redis for caching and session management

**Configuration & Environment:** Environment template system + ESLint + Prettier
- ✅ `.env.template` with interactive initialization (`bun run init`)
- ✅ Shared ESLint config enforced across all packages
- ✅ Shared Prettier config for consistent formatting
- ✅ Shared TypeScript config (base + app-specific extends)

---

## Development Workflow Standards

### Code Quality Gates (MANDATORY BEFORE COMMIT)

All commits MUST pass:
1. Type-checking: `bun run type-check` (no TypeScript errors)
2. Linting: `bun run lint` (must pass ESLint)
3. Testing: `bun run test` (all tests green)
4. Build: `bun run build` (all packages build successfully)

**Rationale:** Prevents broken code from reaching main; catches errors early; ensures consistency.

---

### Git & Commit Discipline

- ✅ Use conventional commit format: `type(scope): description`
- ✅ Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`
- ✅ Scopes: feature area or package name
- ✅ Examples: `feat(orpc-contracts): Add user auth endpoints`, `fix(ui): Resolve dark mode theming`
- ✅ Keep commits focused and logically grouped
- ✅ Reference issue/ticket numbers when applicable

**Rationale:** Conventional commits enable automated changelog generation; clear scopes aid navigation;
focused commits simplify history review and reverting if needed.

---

### Deployment Consistency

- ✅ Development: Docker Compose with full stack (API + Web + Database + Redis)
- ✅ Production: Separate Docker Compose files for API and Web services (independent scaling)
- ✅ Build Strategy: Build-time compilation for Web app (prevents Render timeouts)
- ✅ Environment Variables: Managed via `.env` template system with validation
- ✅ Database Migrations: Applied automatically on container startup

**Rationale:** Docker Compose enforces reproducibility; separate services enable scaling;
build-time compilation prevents startup timeouts; auto-migrations reduce manual steps.

---

## Governance

### Constitution as Law

This constitution is the **source of truth** for development practices. All architectural decisions,
code reviews, and technology choices MUST align with these principles. Conflicts are resolved by
consulting this document first, then relevant documentation in `docs/` and `docs/core-concepts/`.

### Amendment Process

Amendments to this constitution require:
1. **Proposal**: Clear justification for change (new pattern observed, principle conflict, obsolete rule)
2. **Documentation**: Updated or new documentation in `docs/` or `docs/core-concepts/`
3. **Version Bump**: Semantic versioning applied (MAJOR: principle removal, MINOR: new principle, PATCH: clarification)
4. **Communication**: Changelog entry explaining change for team awareness
5. **Propagation**: Updates to dependent templates (spec-template.md, plan-template.md, etc.)

### Review & Compliance

- All pull requests MUST verify adherence to core principles before merge
- Complex changes warrant explicit constitution review comment
- Core concepts (from `docs/core-concepts/`) are **non-negotiable** reference material
- Runtime development guidance in `.github/copilot-instructions.md` supplements this constitution

### Version & Dates

**Version**: 1.0.0 | **Ratified**: 2025-10-16 | **Last Amended**: 2025-10-16
