📍 [Documentation Hub](../README.md) > [Deprecated](./README.md) > MCP Enhancements Idea

⚠️ **DEPRECATED**: This documentation is archived and no longer maintained. See [Deprecated README](./README.md) for alternatives.

# MCP Repo Manager Enhancements IDEA

## Introduction

This document provides an extremely detailed blueprint for enhancing the MCP Repo Manager (in `packages/mcp-repo-manager/`) to grant the LLM unprecedented access to the project's runtime, API, frontend state, database, and development artifacts. The goal is to empower the LLM as a full-stack coding agent capable of authenticated interactions, schema inspections, state simulations, and comprehensive querying of the monorepo's ecosystem.

These enhancements build on the existing MCP tools (e.g., `list-apps`, `add-dependency`, `run-script`) by adding specialized resources and tools for API testing, contract analysis, frontend devtools emulation, and more. They address the user's request for role-based API calls, schema access, ORPC contracts, TanStack Query insights, and brainstorm additional LLM-useful features.

The implementation prioritizes safety (read-only where possible, confirmations for mutations), efficiency (caching, parallel execution), and integration with the project's architecture (ORPC, Better Auth, Drizzle, declarative-routing, TanStack Query).

## Core Principles

- **Security**: All authenticated calls use temporary sessions or pre-seeded API keys. No persistent credentials exposed.
- **Isolation**: Tools run in dev mode or simulated environments to avoid affecting production.
- **Type Safety**: Leverage ORPC and Zod for typed inputs/outputs in tools.
- **Documentation**: Each new tool/resource includes JSDoc, examples, and updates to AGENTS.md.
- **Extensibility**: Use modular design so new features (e.g., new devtools) can be added easily.
- **Performance**: Cache schema/resources, use async/parallel for multi-target operations.

## 1. Role-Based Authenticated API Calls

### Problem & Motivation

The LLM needs to test API endpoints as different user roles (e.g., admin can delete users, moderator can approve posts, user can view own data) to verify RBAC, generate test cases, or debug permission issues. Currently, MCP has no runtime API interaction.

### Implementation Details

#### Step 1: Update Database Seed for Role-Based Users

- **File to Edit**: `apps/api/src/cli/commands/seed.command.ts`

- **Changes**:
  - Define roles array: `const roles = ['admin', 'moderator', 'user', 'guest'];`
  - For each role, create 2 users with role in `data.role`.
  - Use `this.auth.api.createUser` with body including name, email, password, and data: { role, emailVerified: true, ... }.
  - After creating users, generate API keys for each (assume Better Auth API key plugin is installed; if not, add custom api_keys table via Drizzle).
  - Store API keys in a new MCP resource `repo://api/keys` as JSON: { role: { userId, key, abilities: ['*'] } }.
  - Run seed with `bun run api -- db:seed` to populate.

- **Example Code Snippet for Seed**:
  ```typescript
  const roles = ['admin', 'moderator', 'user', 'guest'];
  const usersPerRole = 2;
  const seededUsers = [];
  for (const role of roles) {
    for (let i = 1; i <= usersPerRole; i++) {
      const email = `${role}${i}@test.com`;
      const password = 'password123';
      const userData = await this.auth.api.createUser({
        body: {
          name: `${role.charAt(0).toUpperCase() + role.slice(1)} User ${i}`,
          email,
          password,
          data: { role, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
        },
      });
      const user = userData.user;
      // Create API key
      const apiKey = await this.auth.api.createApiKey({
        body: { userId: user.id, name: `${role}-key-${i}`, key: nanoid(32), expiresAt: null, abilities: role === 'admin' ? ['*'] : ['read', 'write'] },
      });
      seededUsers.push({ role, userId: user.id, email, apiKey: apiKey.key });
    }
  }
  // Log or save to MCP config
  console.log('Seeded users:', seededUsers);
  ```

- **Migration if Needed**: Add `role: text("role").notNull().default('user')` to user table in schema if not present (run `bun run api -- db:generate && db:push`).

#### Step 2: Add MCP Tool for Authenticated Calls

- **File to Edit**: `packages/mcp-repo-manager/src/tools/repo.tools.ts`

- **New Tool**: `api-call-as-role`

  Parameters (Zod schema):
  - `role`: z.string() // e.g., 'admin'
  - `path`: z.string() // e.g., '/users'
  - `method`: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  - `body`: z.any().optional() // JSON body for POST/PUT
  - `query`: z.record(z.string(), z.any()).optional() // Query params
  - `timeoutMs`: z.number().default(5000)

  Implementation:
  - Inject the auth instance and DB from NestJS.
  - Query DB for a user with matching role (e.g., `db.select().from(user).where(eq(user.role, role)).limit(1)`).
  - If no user, error.
  - Create a session token: `const session = await auth.api.createSession({ body: { userId: user.id, expiresAt: new Date(Date.now() + 3600000) } });`
  - Use ORPC client or fetch to call `http://localhost:3001${path}` with Authorization: `Bearer ${session.token}`, method, body (JSON.stringify).
  - Handle errors, return { status, data, headers, error? }.

- **Example Tool Call**:
  ```typescript
  @Tool({ name: 'api-call-as-role', description: 'Make an authenticated API call as a user of the given role.' })
  async apiCallAsRole(params: { role: string; path: string; method: 'GET' | 'POST' | ...; body?: any; query?: Record<string, any> }) {
    // Implementation as above
    const response = await fetch(`http://localhost:3001${params.path}`, {
      method: params.method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: params.body ? JSON.stringify(params.body) : undefined,
    });
    return await response.json();
  }
  ```

- **New Resource**: `repo://api/roles/users`

  URI: repo://api/roles/users

  Returns JSON list of seeded users per role for quick reference.

#### Usage Examples

- **Basic GET**: Call tool with role='admin', path='/health', method='GET' -> Returns API health as admin.
- **POST with Body**: role='user', path='/posts', method='POST', body={title: 'Test Post'} -> Creates post as user, returns created data or 403 if unauthorized.
- **Error Handling**: If role invalid, returns { error: 'No user for role' }.
- **Chaining**: LLM can call multiple times to simulate workflow (login -> fetch data -> mutate).

#### Why Cool & Benefits

- **RBAC Testing**: LLM can verify permissions (e.g., "Does moderator see pending posts?") without manual setup.
- **Data-Driven Debugging**: Inspect responses to understand backend logic.
- **Test Generation**: LLM can generate integration tests based on successful/failed calls.
- **User Simulation**: Mimic real user journeys for UX/API validation.
- **Security Auditing**: Test for over-permissions or leaks across roles.
- **Cool Factor**: Turns LLM into an "API explorer" that can "impersonate" users, making it feel like a QA engineer.

## 2. API Schema Access by Route/List/All

### Problem & Motivation

The LLM needs to understand API structure (params, body, responses) to generate correct calls, docs, or tests. Current MCP has no schema access.

### Implementation Details

#### Step 1: Ensure OpenAPI Generation

- **File**: `apps/api/src/main.ts` or app.module.ts

- **Changes**: If not already, add ORPC OpenAPI middleware:
  ```typescript
  import { openapi } from '@orpc/openapi';
  app.use('/openapi.json', openapi(appContract)); // Expose schema at /openapi.json
  ```

- Run `bun run api -- dev` to verify /openapi.json returns the schema.

#### Step 2: Add MCP Resources for Schema

- **File to Edit**: `packages/mcp-repo-manager/src/tools/repo.tools.ts`

- **New Resources**:

  - `repo://api/schema/all`: Full OpenAPI JSON from http://localhost:3001/openapi.json (cache for 5min).

  Implementation:
  ```typescript
  @Resource({ name: 'api-schema-all', uri: 'repo://api/schema/all', mimeType: 'application/json' })
  async resourceApiSchemaAll() {
    const response = await fetch('http://localhost:3001/openapi.json');
    const schema = await response.json();
    return { contents: [{ uri: 'repo://api/schema/all', mimeType: 'application/json', text: JSON.stringify(schema, null, 2) }] };
  }
  ```

  - `repo://api/schema/{route}`: Extract path from OpenAPI.

  URI Template: repo://api/schema/{route}

  Implementation:
  ```typescript
  @ResourceTemplate({ name: 'api-schema-route', uriTemplate: 'repo://api/schema/{route}', mimeType: 'application/json' })
  async resourceApiSchemaRoute(params: { route: string }) {
    const schema = await this.getOpenApiSchema(); // Helper to fetch full
    const pathSchema = schema.paths[params.route];
    if (!pathSchema) return { isError: true, contents: [{ text: `Route not found: ${params.route}` }] };
    return { contents: [{ uri: `repo://api/schema/${params.route}`, text: JSON.stringify(pathSchema, null, 2) }] };
  }
  ```

  - `repo://api/routes`: List of paths with methods/summaries.

  Implementation: Parse OpenAPI paths, return array of { path, methods: string[], summary: string }.

- **Tool**: `api-schema-query`

  Parameters:
  - route: string (optional)
  - method: string (optional)
  - detail: 'full' | 'summary' (default 'summary')

  Returns schema snippet or full for the route/method.

#### Usage Examples

- **Full Schema**: Access repo://api/schema/all -> Complete OpenAPI spec for code gen or validation.
- **Specific Route**: repo://api/schema/users/profile -> { get: { parameters: [], responses: { 200: { schema: { type: 'object', properties: { id, name } } } } } }
- **List Routes**: repo://api/routes -> [ { path: '/users', methods: ['GET', 'POST'], summary: 'Manage users' }, ... ]
- **Tool Call**: api-schema-query { route: '/posts', method: 'POST' } -> Request body schema for post creation.

#### Why Cool & Benefits

- **Self-Documenting API**: LLM can "read" the API like a human, generating typed calls.
- **Validation Aid**: Check if a call matches schema before executing.
- **Refactoring Safety**: Inspect schema changes to update contracts/UI.
- **Client Generation**: LLM can generate fetch/ORPC code from schema.
- **Cool Factor**: LLM becomes an "API lawyer" ensuring compliance with contracts.

## 3. ORPC Contracts Schema Access

### Problem & Motivation

ORPC contracts define type-safe APIs; LLM needs to access their Zod schemas for input/output validation and code gen.

### Implementation Details

#### Step 1: Schema Extraction Helper

- **New Utility**: In mcp-repo-manager/src/utils/schema-extractor.ts

  - Dynamically import `@repo/api-contracts`.

  - For a contract, use Zod's `_def` or a library like @sinclair/typebox to convert to JSON schema.

  - Example:
    ```typescript
    import * as contracts from '@repo/api-contracts';
    function extractSchema(contract: any, route: string) {
      const routeDef = contract.routes[route];
      return {
        input: routeDef.input?._def.typeName === 'ZodObject' ? routeDef.input.shape : routeDef.input,
        output: routeDef.output?._def.typeName === 'ZodObject' ? routeDef.output.shape : routeDef.output,
      };
    }
    ```

#### Step 2: Add MCP Resources/Tools

- **File**: repo.tools.ts

- **Resources**:

  - `repo://orpc/contracts/all`: JSON of all contracts with route lists.

    Implementation:
    ```typescript
    @Resource({ uri: 'repo://orpc/contracts/all', mimeType: 'application/json' })
    async resourceOrpcAll() {
      const contracts = await import('@repo/api-contracts');
      const all = Object.keys(contracts).filter(k => k.endsWith('Contract')).map(k => ({
        name: k,
        routes: Object.keys(contracts[k as keyof typeof contracts].routes || {}),
      }));
      return { contents: [{ text: JSON.stringify(all, null, 2) }] };
    }
    ```

  - `repo://orpc/contract/{name}/{route}`: Schema for specific route in contract.

    URI Template: repo://orpc/contract/{contract}/{route}

    Implementation: Use extractor to get input/output schemas as JSON.

- **Tool**: `orpc-schema-get`

  Parameters:
  - contract: string (e.g., 'userContract')
  - route: string (e.g., 'getProfile')
  - type: 'input' | 'output' | 'both' (default 'both')

  Returns Zod schema as JSON or string representation.

#### Usage Examples

- **All Contracts**: repo://orpc/contracts/all -> [ { name: 'userContract', routes: ['getProfile', 'createUser'] }, ... ]
- **Specific Schema**: repo://orpc/contract/userContract/getProfile -> { input: {}, output: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } } }
- **Tool**: orpc-schema-get { contract: 'healthContract', route: 'check', type: 'output' } -> Response schema for health check.

#### Why Cool & Benefits

- **Type-Safe Generation**: LLM can create frontend hooks or backend implementations matching contracts.
- **Contract Validation**: Detect mismatches between implementation and contract.
- **Documentation Auto-Gen**: Generate Markdown docs from schemas.
- **Cool Factor**: LLM "understands" the type system, enabling precise code suggestions.

## 4. TanStack Query DevTools Access

### Problem & Motivation

TanStack Query manages frontend data fetching; LLM needs access to active queries, cache, errors to debug loading states, invalidations, or stale data.

### Implementation Details

#### Step 1: Add Dev Endpoint in Web App

- **File**: apps/web/src/app/api/devtools/route.ts (new file)

  - Create a server action or API route that exposes TanStack state (only in dev mode).

  - Use `useQueryClient` in a server component or global query client to dump state.

  - Example:
    ```typescript
    import { queryClient } from '@/lib/query-client';
    export async function GET() {
      if (process.env.NODE_ENV !== 'development') return new Response('Dev only', { status: 403 });
      const state = {
        activeQueries: queryClient.getQueryCache().getAll(),
        cache: queryClient.getQueryCache().findAll(),
        mutations: queryClient.getMutationCache().getAll(),
      };
      return Response.json(state);
    }
    ```

- Run `bun run web -- dr:build` to generate route.

#### Step 2: MCP Tools for TanStack

- **File**: repo.tools.ts

- **Tool**: `web-tanstack-state`

  Parameters:
  - action: 'get-active-queries' | 'get-cache' | 'simulate-query' | 'invalidate-queries'
  - queryKey: string[] (for specific)
  - page: string (optional, to navigate to page and fetch state)

  Implementation:
  - For get-active-queries: Fetch http://localhost:3000/api/devtools?state=queries, parse JSON.
  - For simulate-query: Use @tanstack/react-query in a test script to run a query and return result.
  - For invalidate: Call the endpoint to invalidate and refetch.

- **Resource**: `repo://web/tanstack/queries`

  List of known query keys from code search (grep for useQuery keys).

  Implementation: Use grep_search tool internally to find useQuery calls.

- **Resource**: `repo://web/routes/active`

  Current active routes from declarative-routing generated file.

#### Usage Examples

- **Active Queries**: web-tanstack-state { action: 'get-active-queries' } -> [ { queryKey: ['users'], state: 'success', data: [...] }, ... ]
- **Cache Dump**: { action: 'get-cache' } -> Full cache object for inspection.
- **Simulate**: { action: 'simulate-query', queryKey: ['posts', 1] } -> Fetches posts page 1, returns data/error.
- **Invalidate**: { action: 'invalidate-queries', queryKey: ['users'] } -> Triggers refetch, returns new state.

#### Why Cool & Benefits

- **Frontend Debugging**: LLM can see why data is stale or loading forever.
- **Optimization**: Analyze query overlaps or unnecessary refetches.
- **Test Data Gen**: Generate mock data based on real query responses.
- **Cool Factor**: LLM "sees" the browser devtools, enabling proactive frontend fixes.

## 5. Brainstorm: All Things LLM Can Request

Here, we expand to 20+ additional features, prioritized by usefulness (high to low). Each includes implementation sketch, usage, and benefits.

### High Priority (Core Dev Workflow)

1. **Database Query Execution (Read-Only)**

   - Tool: `db-execute-query`

     Params: sql: string (validated SELECT only), params: array

     Impl: Use Drizzle in MCP to run query on dev DB, return rows.

     Usage: "Show all users with role 'admin'." -> db-execute-query { sql: "SELECT * FROM user WHERE role = ?", params: ['admin'] }

     Why: Inspect data without studio UI; generate reports.

2. **Test Execution and Coverage**

   - Tool: `run-tests`

     Params: filter: string, coverage: boolean

     Impl: Use run-script on targets, collect output/coverage, return JSON report.

     Resource: `repo://tests/results/latest` -> Last test run summary.

     Usage: "Run tests for UI package and show coverage." -> { filter: '@repo/ui', coverage: true }

     Why: LLM can validate changes, suggest missing tests.

3. **Build Metrics and Bundle Analysis**

   - Tool: `measure-build`

     Params: target: string, mode: 'dev' | 'prod'

     Impl: Time the build script, parse output for sizes (use webpack-bundle-analyzer if configured).

     Resource: `repo://build/metrics/{target}` -> Timings, sizes.

     Usage: "How long does web build take?" -> Returns 2.5s, bundle 1.2MB.

     Why: Optimize monorepo performance; identify slow targets.

4. **Git History and Blame**

   - Tool: `git-history`

     Params: path: string, since: date, limit: number

     Impl: Run git log --oneline --since, return commits.

     Resource: `repo://git/blame/{file}:{line}` -> Author/date for line.

     Usage: "Who last changed the auth config?" -> git-history { path: 'src/auth.ts' }

     Why: Credit attribution, revert guidance.

5. **Docker Logs and Health**

   - Tool: `docker-logs-tail`

     Params: service: string, lines: number

     Impl: docker compose logs --tail, parse.

     Tool: `check-health` -> Ping /health on services.

     Usage: "Show recent API errors." -> docker-logs-tail { service: 'api', lines: 50 }

     Why: Quick runtime debugging without terminal.

### Medium Priority (Analysis & Optimization)

6. **Dependency Vulnerability Scan**

   - Tool: `scan-vulns`

     Impl: Run bun audit or npm audit, return high/medium issues.

     Usage: "Are there security issues in deps?" -> List with fixes.

     Why: Proactive security.

7. **Circular Dependency Detection**

   - Tool: `detect-cycles`

     Impl: Use madge or custom graph walker on deps.

     Usage: "Find circular deps in packages."

     Why: Refactor suggestions.

8. **Code Search and Metrics**

   - Tool: `code-search`

     Params: query: string, path: string

     Impl: Use grep_search or ripgrep.

     Resource: `repo://code/metrics` -> LOC, complexity per file.

     Usage: "Find all useQuery calls."

     Why: Locate code quickly.

9. **Performance Profiling**

   - Tool: `profile-endpoint`

     Params: path: string, iterations: number

     Impl: Use autocannon or similar to load test API route.

     Usage: "Benchmark /users endpoint."

     Why: Identify slow endpoints.

10. **Environment Config Validation**

    - Tool: `validate-env`

      Impl: Check .env against template, flag missing vars.

      Usage: "Are all env vars set for prod?"

      Why: Prevent deployment errors.

### Low Priority (Advanced/Experimental)

11. **AI-Generated Test Cases**

    - Tool: `generate-tests`

      Params: file: string, coverageGoal: number

      Impl: Use LLM (self) to generate Vitest tests based on code analysis.

      Why: Auto-fill test gaps.

12. **Refactor Suggestion Engine**

    - Tool: `suggest-refactor`

      Params: file: string, issue: string

      Impl: Analyze code, suggest improvements.

      Why: Code quality boosts.

13. **Deployment Preview**

    - Tool: `preview-deploy`

      Impl: Run docker build, show changes in image.

      Usage: "What would prod build look like?"

      Why: Safe deployment testing.

14. **User Feedback Simulation**

    - Tool: `simulate-feedback`

      Params: scenario: string

      Impl: Generate mock user interactions based on routes.

      Why: UX testing ideas.

15. **Cost Estimation**

    - Tool: `estimate-costs`

      Impl: Calculate Render/Vercel costs based on usage.

      Why: Budget planning.

16. **Documentation Gap Analysis**

    - Tool: `doc-gaps`

      Impl: Compare code comments/docs to best practices.

      Why: Improve docs.

17. **Accessibility Audit**

    - Tool: `audit-a11y`

      Impl: Run axe-core on web app pages.

      Usage: "Check a11y on login page."

      Why: Inclusive design.

18. **SEO Analysis**

    - Tool: `analyze-seo`

      Impl: Lighthouse on web routes.

      Why: Marketing optimization.

19. **Bundle Duplicate Detection**

    - Tool: `find-duplicates`

      Impl: Analyze webpack bundles for dupes.

      Why: Reduce size.

20. **Migration Assistant**

    - Tool: `plan-migration`

      Params: fromLib: string, toLib: string

      Impl: Suggest code changes for lib upgrade.

      Why: Smooth upgrades.

## Implementation Roadmap & Challenges

### Phases

1. **Week 1: Foundation (Seed, Auth, Schema)**

   - Update seed and add API keys.

   - Implement API schema resources/tools.

   - Test with role calls.

2. **Week 2: ORPC & Frontend**

   - Extract ORPC schemas.

   - Add TanStack simulation/dev endpoint.

3. **Week 3: Additional Features**

   - Implement top 5 additional tools (db-query, tests, git, logs, deps).

   - Add caching with TTL for resources.

4. **Week 4: Polish & Expand**

   - Add 5 more medium priority.

   - Integration tests for new tools.

   - Update docs/AGENTS.md with new capabilities.

### Challenges & Mitigations

- **Auth Security**: Use short-lived tokens; never expose passwords. Mitigation: API keys with scopes.

- **Runtime Dependencies**: Tools assume dev stack running (docker-up). Mitigation: Auto-start if not running.

- **Schema Parsing**: Zod to JSON conversion. Mitigation: Use zod-to-json-schema library.

- **State Simulation**: TanStack needs React context. Mitigation: Use @tanstack/react-query in non-React test env.

- **Performance**: Heavy tools (builds, tests). Mitigation: Async, progress reports, optional dry-run.

- **Error Handling**: Failed calls (service down). Mitigation: Retry logic, fallback messages.

### Metrics for Success

- LLM can successfully call 5 API endpoints as different roles without errors.

- Schema access returns valid JSON for 100% of routes/contracts.

- TanStack tool simulates 80% of real queries accurately.

- Additional tools cover 90% of common dev queries (e.g., "run tests", "check logs").

## Why These Enhancements Are Cool

- **Autonomous Agent**: LLM becomes a self-sufficient dev team member, querying/running the stack independently.

- **Reduced Friction**: No more "run this command manually" – LLM does it.

- **Insightful Debugging**: Combine data from API, DB, frontend for holistic views (e.g., "Why is this query failing for users?").

- **Innovation Enablement**: LLM can experiment with features (e.g., simulate new query, test role perms).

- **Scalability**: As project grows, MCP centralizes access, preventing tool sprawl.

- **Fun Factor**: Imagine LLM saying, "I logged in as admin, called /delete-user, got 200 – but as user, 403. Fixed the guard!"

This IDEA transforms MCP from a static manager to a dynamic, LLM-empowered orchestrator, revolutionizing AI-assisted development in this monorepo.