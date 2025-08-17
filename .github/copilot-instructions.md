# AI Coding Agent Instructions

This Next.js + NestJS turborepo uses modern patterns and conventions that require specific knowledge for effective development.

## Architecture Overview

**Monorepo Structure**: Turborepo with apps (`web/`, `api/`) and shared packages (`ui/`, `api-contracts/`, etc.)
- Frontend: Next.js 15.4 with App Router, React 19, Tailwind CSS, Shadcn UI
- Backend: NestJS with ORPC, Drizzle ORM, Better Auth, PostgreSQL
- Type Safety: End-to-end with shared contracts and declarative routing

## Critical Development Patterns

### 1. Docker-First Development
**Always use Docker commands for development:**
```bash
bun run dev              # Full stack (API + Web + DB + Redis)
bun run dev:api          # API only with database
bun run dev:web          # Web only (requires running API)
```
Never run `next dev` or `nest start` directly - services are containerized with proper networking.

### 2. Declarative Routing System
**Routes are type-safe and generated**, not manually written:
- Route definitions: `apps/web/src/app/**/page.info.ts`
- Generate routes: `bun run web -- dr:build` (required after route changes)
- Usage: `import { Home, ApiAuth } from '@/routes'` then `<Home.Link>` or `ApiAuth.fetch()`
- **Never** use raw `href` strings or manual `fetch()` calls

### 3. API Contracts with ORPC
**Shared type-safe contracts between frontend/backend:**
- Contracts: `packages/api-contracts/index.ts`
- API implementation: `apps/api/src/` using ORPC decorators
- Client usage: Generated hooks via `@orpc/tanstack-query`
- Changes require rebuilding web app: `bun run web -- generate`

### 4. Shared Package System
**Internal packages use workspace references:**
```json
"@repo/ui": "*"           // Not published packages
"@repo/api-contracts": "*" // Shared between apps
```
Import like: `import { Button } from '@repo/ui'`

### 5. Environment Configuration
**Multi-environment setup with Docker:**
- Development: `.env` file with Docker service URLs
- API URL patterns: `http://api:3001` (internal) vs `http://localhost:3001` (external)
- Use `envcli` for environment variable interpolation in scripts

## Key Commands & Workflows

### Development
```bash
bun run dev                    # Start full development stack
bun run web -- dr:build:watch # Watch mode for route generation
bun run api -- db:studio      # Database admin UI
```

### Building & Testing
```bash
bun run build                  # Build all apps and packages
bun run test                   # Run all tests
bun run test:coverage          # Coverage across monorepo
```

### Database Operations
```bash
bun run api -- db:generate    # Generate migrations
bun run api -- db:push        # Push schema changes
bun run api -- db:migrate     # Run migrations
bun run api -- db:seed        # Seed development data
```

## File Organization Patterns

### Next.js App (apps/web/)
- **App Router**: `src/app/*/page.tsx` with co-located `page.info.ts`
- **Components**: `src/components/` for app-specific, `packages/ui/` for shared
- **State**: Zustand stores in `src/state/`
- **API Client**: Generated ORPC hooks in `src/lib/api.ts`

### NestJS API (apps/api/)
- **Modules**: Feature-based modules with ORPC contracts
- **Database**: Drizzle schema in `src/db/drizzle/schema/`
- **Auth**: Better Auth configuration in `src/auth.ts`

### Shared Packages
- **UI**: Shadcn components with Tailwind in `packages/ui/`
- **Contracts**: ORPC procedures in `packages/api-contracts/`
- **Config**: Shared ESLint, Prettier, Tailwind configs

## Common Gotchas

1. **Route Changes**: Always run `bun run web -- dr:build` after modifying route structure
2. **Docker Networking**: Use container names (`api:3001`) for server-side, localhost for client-side
3. **Type Generation**: API contract changes require `bun run web -- generate`
4. **Hot Reloading**: Files are mounted in Docker - changes should reflect immediately
5. **Database**: PostgreSQL runs in Docker - connection strings use container networking

## Testing Strategy

- **Unit Tests**: Vitest with coverage thresholds (75%)
- **Integration**: ORPC contracts ensure API compatibility
- **E2E**: Via declarative routes for type-safe navigation

## Debugging Tips

```bash
bun run dev:api:logs          # View API container logs
bun run dev:web:logs          # View web container logs
docker exec -it [container] sh # Shell into containers
```

When making changes, follow this order: API contracts → API implementation → route generation → frontend implementation.

## Documentation References

For detailed information on specific topics, reference these documentation files:

### 🚀 **Getting Started & Setup**
- **Initial Setup**: [`docs/GETTING-STARTED.md`](../docs/GETTING-STARTED.md) - Complete setup guide with prerequisites and environment configuration
- **Project Architecture**: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) - System design, component relationships, and data flows
- **Technology Stack**: [`docs/TECH-STACK.md`](../docs/TECH-STACK.md) - Detailed technology choices and version information

### 🛠️ **Development Workflows**
- **Daily Development**: [`docs/DEVELOPMENT-WORKFLOW.md`](../docs/DEVELOPMENT-WORKFLOW.md) - Day-to-day development tasks and best practices
- **API Contracts**: [`docs/ORPC-TYPE-CONTRACTS.md`](../docs/ORPC-TYPE-CONTRACTS.md) - ORPC type-safe API development and usage patterns
- **Declarative Routing**: [`apps/web/src/routes/README.md`](../apps/web/src/routes/README.md) - Type-safe routing system usage and examples

### 🐳 **Docker & Deployment**
- **Docker Strategies**: [`docs/DOCKER-BUILD-STRATEGIES.md`](../docs/DOCKER-BUILD-STRATEGIES.md) - Development vs production Docker configurations
- **Production Deployment**: [`docs/PRODUCTION-DEPLOYMENT.md`](../docs/PRODUCTION-DEPLOYMENT.md) - Production environment setup and deployment strategies
- **Render Deployment**: [`docs/RENDER-DEPLOYMENT.md`](../docs/RENDER-DEPLOYMENT.md) - Platform-specific deployment guide for Render
- **Project Isolation**: [`docs/PROJECT-ISOLATION.md`](../docs/PROJECT-ISOLATION.md) - Running multiple project instances without conflicts

### ⚙️ **Configuration & Environment**
- **Environment Variables**: [`docs/ENVIRONMENT-TEMPLATE-SYSTEM.md`](../docs/ENVIRONMENT-TEMPLATE-SYSTEM.md) - Environment configuration and template system
- **GitHub Copilot Setup**: [`docs/COPILOT-SETUP.md`](../docs/COPILOT-SETUP.md) - AI development environment configuration

### 🧪 **Testing & Quality**
- **Testing Guide**: [`docs/TESTING.md`](../docs/TESTING.md) - Testing strategies and test execution
- **Testing Implementation**: [`docs/TESTING-IMPLEMENTATION-SUMMARY.md`](../docs/TESTING-IMPLEMENTATION-SUMMARY.md) - Comprehensive testing setup details

### 📂 **Quick Reference for Common Tasks**

| Task | Documentation File | Key Section |
|------|-------------------|-------------|
| Setting up development environment | `docs/GETTING-STARTED.md` | Quick Start |
| Creating API endpoints | `docs/ORPC-TYPE-CONTRACTS.md` | API Implementation |
| Adding new pages | `apps/web/src/routes/README.md` | Using the routes |
| Database operations | `docs/DEVELOPMENT-WORKFLOW.md` | Working with Database |
| Docker issues | `docs/DOCKER-BUILD-STRATEGIES.md` | Troubleshooting |
| Production deployment | `docs/PRODUCTION-DEPLOYMENT.md` | Production Environment Variables |
| Environment configuration | `docs/ENVIRONMENT-TEMPLATE-SYSTEM.md` | Template System |
| Testing setup | `docs/TESTING.md` | Running Tests |

**Note**: Always check these documentation files for the most up-to-date and detailed information before implementing features or resolving issues.

## Documentation Maintenance

**IMPORTANT**: As an AI coding agent, you have a responsibility to keep documentation accurate and up-to-date. 

### When to Update Documentation

Update relevant documentation whenever you:

1. **Add/Modify API Endpoints**: Update `docs/ORPC-TYPE-CONTRACTS.md` and `docs/DEVELOPMENT-WORKFLOW.md`
2. **Change Environment Variables**: Update `docs/GETTING-STARTED.md`, `docs/ENVIRONMENT-TEMPLATE-SYSTEM.md`, and relevant deployment docs
3. **Modify Docker Configuration**: Update `docs/DOCKER-BUILD-STRATEGIES.md` and deployment guides
4. **Update Dependencies**: Update `docs/TECH-STACK.md` with new versions and rationale
5. **Change Database Schema**: Update `docs/DEVELOPMENT-WORKFLOW.md` database sections
6. **Add/Remove Routes**: Update `apps/web/src/routes/README.md` and routing documentation
7. **Modify Authentication Flow**: Update `docs/ARCHITECTURE.md` and setup guides
8. **Change Testing Setup**: Update `docs/TESTING.md` and testing documentation
9. **Alter Deployment Procedures**: Update production and platform-specific deployment guides
10. **Add New Features**: Create or update relevant documentation sections

### Documentation Update Process

1. **Identify Impact**: Determine which documentation files are affected by your changes
2. **Update Content**: Modify the documentation to reflect new reality
3. **Verify Accuracy**: Ensure examples, commands, and procedures are correct
4. **Check Cross-References**: Update any links or references in other documentation files
5. **Test Instructions**: Verify that documented procedures actually work

### Documentation Quality Standards

- **Be Specific**: Include exact commands, file paths, and code examples
- **Stay Current**: Remove deprecated information and update version numbers
- **Cross-Reference**: Link related documentation sections appropriately
- **Include Context**: Explain not just what to do, but why and when
- **Test Examples**: Ensure all code examples and commands actually work

**Remember**: Documentation is code. Treat it with the same care and attention as you would application code. Outdated documentation can be worse than no documentation at all.

## New Concept Documentation Protocol

**CRITICAL**: When you introduce ANY new concept, pattern, technology, or significant implementation approach to this project, you MUST create comprehensive documentation to ensure knowledge preservation and team alignment.

### What Constitutes a "New Concept"

Document whenever you add or implement:

1. **New Technologies or Libraries**: Any new dependency, framework, or tool
2. **New Design Patterns**: Architectural patterns, coding conventions, or structural approaches
3. **New Development Workflows**: Build processes, deployment strategies, or development procedures
4. **New API Patterns**: Endpoint structures, authentication methods, or data handling approaches
5. **New UI/UX Patterns**: Component structures, styling approaches, or interaction patterns
6. **New Configuration Systems**: Environment setups, build configurations, or deployment configs
7. **New Testing Approaches**: Testing strategies, tools, or methodologies
8. **New Performance Optimizations**: Caching strategies, bundling approaches, or optimization techniques
9. **New Security Implementations**: Authentication flows, authorization patterns, or security measures
10. **New Integration Methods**: Third-party service integrations or inter-service communication patterns

### Documentation Creation Process

#### 1. **Determine Documentation Scope**
- **Minor Enhancement**: Update existing documentation section
- **Major Feature**: Create dedicated documentation file in `docs/` directory
- **Cross-cutting Concern**: Update multiple related documentation files

#### 2. **Create/Update Documentation**

**For New Documentation Files:**
- Use clear, descriptive naming: `docs/NEW-CONCEPT-NAME.md`
- Follow the established documentation structure and tone
- Include practical examples and code snippets
- Provide troubleshooting guidance
- Link to related documentation

**Documentation Template for New Concepts:**
```markdown
# [Concept Name]

## Overview
Brief description of what this concept is and why it was added.

## Implementation
How it's implemented in this project.

## Usage Examples
Practical examples with code snippets.

## Configuration
Any configuration required.

## Best Practices
Recommended approaches and patterns.

## Troubleshooting
Common issues and solutions.

## Related Documentation
Links to related concepts and documentation.
```

#### 3. **Update Reference Systems**

**ALWAYS update these files when adding new concepts:**

1. **This Copilot Instructions File** (`copilot-instructions.md`)
   - Add to Documentation References section under appropriate category
   - Update Quick Reference table if applicable
   - Add to Development Patterns section if it introduces new workflows

2. **Project README** (if user-facing)
   - Update feature lists or technology mentions

3. **Architecture Documentation** (`docs/ARCHITECTURE.md`)
   - Update if it affects system architecture

4. **Tech Stack Documentation** (`docs/TECH-STACK.md`)
   - Add new technologies with version information and rationale

### Copilot Instructions File Maintenance

**⚠️ EXTREME CAUTION REQUIRED**: This file (`copilot-instructions.md`) is the **FOUNDATION** of all AI development work on this project. It must be maintained with exceptional care and precision.

#### Why This File is Critical

This file serves as:
- **Primary Knowledge Base**: The source of truth for all development patterns and practices
- **AI Decision Framework**: Guides all AI coding decisions and implementations
- **Team Alignment Tool**: Ensures consistent approaches across all contributors
- **Project Documentation Hub**: Central reference point for all documentation

#### Rules for Modifying This File

1. **Think Before You Act**: 
   - Spend significant time analyzing the impact of any change
   - Consider how the change affects existing patterns and workflows
   - Ensure changes align with the overall project philosophy

2. **Maintain Structural Integrity**:
   - Preserve the existing section hierarchy and organization
   - Keep the logical flow from basic concepts to advanced topics
   - Maintain consistency in formatting and style

3. **Comprehensive Review Process**:
   - Read the entire file before making changes
   - Verify that new content doesn't contradict existing information
   - Ensure all cross-references remain accurate
   - Test that all code examples and commands work correctly

4. **Documentation Standards**:
   - Be extremely precise with technical details
   - Include complete context, not just the change
   - Use consistent terminology throughout
   - Provide clear examples and rationale

5. **Impact Assessment**:
   - Consider how changes affect new developer onboarding
   - Evaluate impact on existing development workflows
   - Ensure changes support the project's scalability goals

#### Modification Checklist

Before modifying this file, complete this checklist:

- [ ] **Purpose Clear**: Is the reason for the change clearly defined and necessary?
- [ ] **Impact Understood**: Do I understand how this change affects the entire development ecosystem?
- [ ] **Structure Maintained**: Does the change preserve the file's logical organization?
- [ ] **Cross-References Updated**: Are all related references updated consistently?
- [ ] **Examples Tested**: Do all code examples and commands work correctly?
- [ ] **Consistency Verified**: Is the new content consistent with existing style and terminology?
- [ ] **Completeness Ensured**: Is the documentation complete and self-contained?
- [ ] **Future-Proofed**: Will this change remain relevant and accurate over time?

#### Emergency Protocol

If you realize you've made an error in this file:
1. **Stop immediately** and assess the full impact
2. **Review the entire file** to understand what was changed
3. **Test all examples** and verify all commands work
4. **Fix inconsistencies** throughout the file, not just the immediate change
5. **Document the correction** in commit messages with clear explanation

**Remember**: This file is not just documentation—it's the intelligence that guides all future development. Every change ripples through the entire project ecosystem. Treat it with the reverence it deserves.