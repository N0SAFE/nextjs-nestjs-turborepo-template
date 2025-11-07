# 🎯 AI Coding Agent Instructions

## 🔴 DOCUMENTATION AWARENESS - KNOW WHAT'S AVAILABLE

**CRITICAL**: You must be AWARE of the project's documentation structure and read relevant files as needed:

1. **Know the Documentation Hub exists** at `.docs/README.md` - the central navigation point
2. **Know the Core Concepts directory** at `.docs/core-concepts/` - fundamental patterns and rules
3. **Read relevant documentation BEFORE implementing** - don't guess patterns
4. **Don't read everything upfront** - be selective and efficient
5. **Use the Documentation Hub** to discover what's available and navigate to what you need

### When to Read Documentation

- **Before ANY implementation**: Check if relevant docs exist for the task
- **When encountering new concepts**: Read the specific core concept or guide
- **When uncertain about patterns**: Navigate via `.docs/README.md` to find the right guide
- **NOT every single time**: Don't re-read familiar patterns you've already applied

### Documentation Discovery Pattern

1. **Start at `.docs/README.md`**: Understand what documentation categories exist
2. **Check Core Concepts Index** at `.docs/core-concepts/README.md`: See what fundamental rules exist
3. **Navigate to relevant files**: Read only what's needed for your current task
4. **Keep key patterns in context**: Remember Service-Adapter, ORPC Client Hooks, etc.
5. **Re-read when needed**: If a pattern is unfamiliar or you're unsure, read the docs again

---

## ⚡ EFFICIENCY PRINCIPLES

### 1. Batch Tool Calls Whenever Possible

**CRITICAL**: Always analyze your task and identify opportunities to execute multiple independent operations in parallel. This significantly improves performance and reduces user wait time.

#### When to Batch

Batch tool calls when operations are **independent** (no data dependencies between them):

✅ **GOOD - Parallel Execution**:
```typescript
// Reading multiple unrelated files
read_file({ filePath: 'apps/api/src/auth.ts' })
read_file({ filePath: 'apps/web/src/lib/api.ts' })
read_file({ filePath: 'packages/api-contracts/index.ts' })

// Creating multiple independent files
create_file({ filePath: 'components/Header.tsx', content: '...' })
create_file({ filePath: 'components/Footer.tsx', content: '...' })
create_file({ filePath: 'components/Sidebar.tsx', content: '...' })

// Multiple independent edits to different files
replace_string_in_file({ filePath: 'file1.ts', ... })
replace_string_in_file({ filePath: 'file2.ts', ... })
replace_string_in_file({ filePath: 'file3.ts', ... })
```

❌ **BAD - Sequential When Unnecessary**:
```typescript
// Don't do this if operations are independent
await read_file({ filePath: 'apps/api/src/auth.ts' })
// wait...
await read_file({ filePath: 'apps/web/src/lib/api.ts' })
// wait...
await read_file({ filePath: 'packages/api-contracts/index.ts' })
```

#### When NOT to Batch

Execute sequentially when operations have **dependencies**:

```typescript
// Must read file first to know what to edit
1. read_file({ filePath: 'config.ts' })
// analyze content...
2. replace_string_in_file({ filePath: 'config.ts', ... })

// Must get list before processing items
1. list_dir({ path: 'src/components' })
// analyze structure...
2. create_file({ filePath: 'src/components/NewComponent.tsx', ... })
```

#### Use multi_replace_string_in_file for Multiple Edits

When editing multiple parts of the same file or multiple files, use `multi_replace_string_in_file`:

```typescript
// Instead of multiple sequential edits
multi_replace_string_in_file({
  explanation: 'Update imports and add new function across multiple files',
  replacements: [
    { filePath: 'file1.ts', oldString: '...', newString: '...', explanation: '...' },
    { filePath: 'file2.ts', oldString: '...', newString: '...', explanation: '...' },
    { filePath: 'file3.ts', oldString: '...', newString: '...', explanation: '...' }
  ]
})
```

#### Efficiency Checklist

Before executing tools, ask yourself:
- [ ] Can these operations run in parallel?
- [ ] Are there any data dependencies between them?
- [ ] Am I making multiple edits that could use `multi_replace_string_in_file`?
- [ ] Would batching reduce total execution time?

**Remember**: Batching is not just about speed—it improves user experience by reducing back-and-forth and shows professional-grade code organization.

### 2. Minimize runSubagent Usage for Better Context Management

**IMPORTANT**: While `runSubagent` is a powerful tool, it should be used **sparingly and strategically**. Overuse leads to context fragmentation, increased latency, and reduced efficiency.

#### When runSubagent is Appropriate

✅ **Use runSubagent for**:

1. **Large-scale codebase searches** where you need to find patterns across many files:
   ```typescript
   runSubagent({
     description: 'Find all ORPC violations',
     prompt: 'Search entire codebase for direct ORPC usage in React components (files in apps/web/src/). Report file paths and line numbers of violations.'
   })
   ```

2. **Complex research requiring multiple discovery steps**:
   ```typescript
   runSubagent({
     description: 'Research authentication patterns',
     prompt: 'Investigate how authentication works: 1) Find Better Auth config, 2) Trace AuthService usage, 3) Document the flow. Return comprehensive summary.'
   })
   ```

3. **Self-contained feature implementations** where isolation is beneficial:
   ```typescript
   runSubagent({
     description: 'Implement user settings API',
     prompt: 'Create complete user settings feature: ORPC contract, NestJS controller with Service-Adapter pattern, client hooks. Follow all core concepts.'
   })
   ```

4. **Tasks requiring specialized context** that would pollute your current context:
   ```typescript
   runSubagent({
     description: 'Analyze test coverage gaps',
     prompt: 'Review all test files and identify modules without adequate test coverage. Return prioritized list with file paths.'
   })
   ```

#### When NOT to Use runSubagent

❌ **Avoid runSubagent for**:

1. **Simple, well-defined tasks** you can handle directly:
   ```typescript
   // Don't use subagent for this
   ❌ runSubagent({ description: 'Read auth config', prompt: 'Read apps/api/src/auth.ts' })
   
   // Just do it directly
   ✅ read_file({ filePath: 'apps/api/src/auth.ts' })
   ```

2. **Tasks where you already have the context loaded**:
   ```typescript
   // You just read the file, don't delegate the edit
   ❌ const content = await read_file(...)
      runSubagent({ prompt: 'Edit this file...' })
   
   // Edit it yourself
   ✅ const content = await read_file(...)
      replace_string_in_file(...)
   ```

3. **Sequential steps in a single workflow**:
   ```typescript
   // Don't break up a coherent workflow
   ❌ runSubagent({ prompt: 'Create ORPC contract' })
      runSubagent({ prompt: 'Create controller for that contract' })
      runSubagent({ prompt: 'Create client hooks' })
   
   // Handle the complete workflow yourself
   ✅ // Create contract, controller, and hooks in sequence
   ```

4. **Quick clarifications or information retrieval**:
   ```typescript
   // Don't use subagent for simple searches
   ❌ runSubagent({ prompt: 'What files are in src/components?' })
   
   // Use direct tools
   ✅ list_dir({ path: 'src/components' })
   ```

#### Context Management Best Practices

**Why minimize runSubagent?**
- **Context continuity**: Keep related work in the same execution context
- **Reduced latency**: Direct tool calls are faster than spawning subagents
- **Better error handling**: Immediate access to results and errors
- **Token efficiency**: Avoid context duplication between agents
- **Clearer responsibility**: You maintain full control and understanding

**Decision Framework**:
```
Is the task...
├─ Complex multi-step research? → Consider runSubagent
├─ Large codebase search (100+ files)? → Consider runSubagent
├─ Self-contained feature implementation? → Consider runSubagent
├─ Something you can handle with direct tools? → Use direct tools ✅
├─ Part of your current workflow? → Handle it yourself ✅
└─ Simple read/edit/create operation? → Use direct tools ✅
```

**Golden Rule**: Default to direct tool usage. Only delegate to `runSubagent` when the task genuinely benefits from isolation or specialized context that would be inefficient to load yourself.

---

## IMPORTANT STARTUP CHECKLIST

Before doing anything, you MUST use the MCP Repo Manager and AGENTS.md files to load context and rules.

Required first steps for every task:
1. Fetch repo overview via MCP resources:
   - `repo://summary`, `repo://apps`, `repo://packages`
2. Fetch the agents index: `repo://agents` and open relevant AGENTS.md
   - Root: `repo://agent/root`
   - Scoped: `repo://agent/apps/<name>` or `repo://agent/packages/<name>`
3. Use MCP tools to inspect and act (do not directly edit unless unavoidable):
   - Inspect: `show-app-dependencies`, `show-package-dependencies`, `list-internal-dependencies`
   - Change: `add-dependency`, `remove-dependency`, `add-script`, `bump-version`, `create-app`, `create-package`
   - Run: `run-script`

Error handling protocol (CRITICAL):
- When an MCP repo management action returns an error, you must attempt to fix it immediately, then retry.
- Prefer the smallest corrective action first. Examples:
   - Missing script: add it via `add-script` and retry
   - Missing dependency: add via `add-dependency` (use internal workspace version `*` when applicable) and retry
   - Service not available: start required stack using root scripts (`bun run dev`, `bun run dev:api`, or `bun run dev:web`) with the appropriate compose file
   - Inconsistent graph: inspect with `repo://graph/uses/{name}` and `repo://graph/used-by/{name}` then adjust
- **Use direct tools for fixes** - Don't delegate simple corrections to runSubagent
- **Batch multiple fixes** when possible (e.g., adding multiple missing dependencies in parallel)
- Retry up to two times before escalating; surface the exact tool call, parameters, and error message.
- Validate readiness with `repo://commit/plan` or the `commit-plan` prompt before finalizing changes.


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
Prefer Docker-first via these root scripts; local app-level scripts exist for host-mode development when appropriate.

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
- Client usage: Custom React Query hooks wrapping ORPC (see ORPC Client Hooks Pattern)
- Changes require rebuilding web app: `bun run web -- generate`
- **Important**: Always create custom hooks instead of using ORPC directly in components

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

**Efficiency Note**: Use `run_in_terminal` directly for these commands. Only use runSubagent for complex multi-step workflows that require research or exploration.

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

**Tip**: When running multiple commands in sequence, consider if they can be batched or run in parallel (e.g., starting multiple services).

## File Organization Patterns

**Efficiency Tip**: When exploring file structure, batch `read_file` calls for related files instead of sequential reads. Use `list_dir` first to understand structure, then read needed files in parallel.

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
   - Use direct `run_in_terminal` tool - don't delegate to runSubagent
2. **Docker Networking**: Use container names (`api:3001`) for server-side, localhost for client-side
3. **Type Generation**: API contract changes require `bun run web -- generate`
   - Batch this with other build commands when possible
4. **Hot Reloading**: Files are mounted in Docker - changes should reflect immediately
5. **Database**: PostgreSQL runs in Docker - connection strings use container networking
   - Use direct MCP tools for database operations, not subagents

## Testing Strategy

- Unit tests: Vitest across apps/packages
- Integration: ORPC contracts ensure API compatibility

## Debugging Tips

```bash
bun run dev:api:logs          # View API container logs
bun run dev:web:logs          # View web container logs
docker exec -it [container] sh # Shell into containers
```

**Efficiency Note**: When debugging multiple services, use `run_in_terminal` in parallel to check logs simultaneously. Don't delegate simple log viewing to runSubagent.

When making changes, follow this order: API contracts → API implementation → route generation → frontend implementation.

## Documentation References

For detailed information on specific topics, reference these documentation files:

### 🚀 **Getting Started & Setup**
- **Initial Setup**: [`.docs/guides/GETTING-STARTED.md`](../.docs/guides/GETTING-STARTED.md) - Complete setup guide with prerequisites and environment configuration
- **Project Architecture**: [`.docs/reference/ARCHITECTURE.md`](../.docs/reference/ARCHITECTURE.md) - System design, component relationships, and data flows
- **Technology Stack**: [`.docs/reference/TECH-STACK.md`](../.docs/reference/TECH-STACK.md) - Detailed technology choices and version information

### 🛠️ **Development Workflows**
- **Daily Development**: [`.docs/guides/DEVELOPMENT-WORKFLOW.md`](../.docs/guides/DEVELOPMENT-WORKFLOW.md) - Day-to-day development tasks and best practices
- **API Contracts**: [`.docs/features/ORPC-TYPE-CONTRACTS.md`](../.docs/features/ORPC-TYPE-CONTRACTS.md) - ORPC type-safe API development and usage patterns
- **API Client Hooks**: [`.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md`](../.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md) - Creating hooks for ORPC consumption in components
- **Declarative Routing**: [`apps/web/src/routes/README.md`](../apps/web/src/routes/README.md) - Type-safe routing system usage and examples

### 🐳 **Docker & Deployment**
- **Docker Strategies**: [`.docs/guides/DOCKER-BUILD-STRATEGIES.md`](../.docs/guides/DOCKER-BUILD-STRATEGIES.md) - Development vs production Docker configurations
- **Production Deployment**: [`.docs/guides/PRODUCTION-DEPLOYMENT.md`](../.docs/guides/PRODUCTION-DEPLOYMENT.md) - Production environment setup and deployment strategies
- **Render Deployment**: [`.docs/guides/RENDER-DEPLOYMENT.md`](../.docs/guides/RENDER-DEPLOYMENT.md) - Platform-specific deployment guide for Render
- **Project Isolation**: [`.docs/planning/PROJECT-ISOLATION.md`](../.docs/planning/PROJECT-ISOLATION.md) - Running multiple project instances without conflicts

### ⚙️ **Configuration & Environment**
- **Environment Variables**: [`.docs/features/ENVIRONMENT-TEMPLATE-SYSTEM.md`](../.docs/features/ENVIRONMENT-TEMPLATE-SYSTEM.md) - Environment configuration and template system
- **GitHub Copilot Setup**: [`.docs/features/COPILOT-SETUP.md`](../.docs/features/COPILOT-SETUP.md) - AI development environment configuration

### 🧪 **Testing & Quality**
- **Testing Guide**: [`.docs/features/TESTING.md`](../.docs/features/TESTING.md) - Testing strategies and test execution
- **Testing Implementation**: [`.docs/deprecated/TESTING-IMPLEMENTATION-SUMMARY.md`](../.docs/deprecated/TESTING-IMPLEMENTATION-SUMMARY.md) - Comprehensive testing setup details

### 📂 **Quick Reference for Common Tasks**

| Task | Documentation File | Key Section |
|------|-------------------|-------------|
| Setting up development environment | `.docs/guides/GETTING-STARTED.md` | Quick Start |
| Creating API endpoints | `.docs/features/ORPC-TYPE-CONTRACTS.md` | API Implementation |
| Creating client hooks for ORPC | `.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md` | Hook Organization |
| Adding new pages | `apps/web/src/routes/README.md` | Using the routes |
| Database operations | `.docs/guides/DEVELOPMENT-WORKFLOW.md` | Working with Database |
| Docker issues | `.docs/guides/DOCKER-BUILD-STRATEGIES.md` | Troubleshooting |
| Production deployment | `.docs/guides/PRODUCTION-DEPLOYMENT.md` | Production Environment Variables |
| Environment configuration | `.docs/features/ENVIRONMENT-TEMPLATE-SYSTEM.md` | Template System |
| Testing setup | `.docs/features/TESTING.md` | Running Tests |
| GitHub project management | See memory bank | `github-project-management-workflow.md` |

**Note**: Always check these documentation files for the most up-to-date and detailed information before implementing features or resolving issues.

## Documentation Maintenance

**IMPORTANT**: As an AI coding agent, you have a responsibility to keep documentation accurate and up-to-date.

### When to Update Documentation

Update relevant documentation whenever you:

1. **Add/Modify API Endpoints**: Update `.docs/ORPC-TYPE-CONTRACTS.md` and `.docs/DEVELOPMENT-WORKFLOW.md`
2. **Change Environment Variables**: Update `.docs/GETTING-STARTED.md`, `.docs/ENVIRONMENT-TEMPLATE-SYSTEM.md`, and relevant deployment docs
3. **Modify Docker Configuration**: Update `.docs/DOCKER-BUILD-STRATEGIES.md` and deployment guides
4. **Update Dependencies**: Update `.docs/TECH-STACK.md` with new versions and rationale
5. **Change Database Schema**: Update `.docs/DEVELOPMENT-WORKFLOW.md` database sections
6. **Add/Remove Routes**: Update `apps/web/src/routes/README.md` and routing documentation
7. **Modify Authentication Flow**: Update `.docs/ARCHITECTURE.md` and setup guides
8. **Change Testing Setup**: Update `.docs/TESTING.md` and testing documentation
9. **Alter Deployment Procedures**: Update production and platform-specific deployment guides
10. **Add New Features**: Create or update relevant documentation sections

### Documentation Update Process

1. **Identify Impact**: Determine which documentation files are affected by your changes
2. **Update Content**: Modify the documentation to reflect new reality
   - **Batch edits**: Use `multi_replace_string_in_file` when updating multiple documentation files
3. **Verify Accuracy**: Ensure examples, commands, and procedures are correct
4. **Check Cross-References**: Update any links or references in other documentation files
   - **Parallel reads**: Load all related docs simultaneously to verify cross-references
5. **Test Instructions**: Verify that documented procedures actually work
   - Use direct tools to test commands, not runSubagent

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
- **Major Feature**: Create dedicated documentation file in `.docs/` directory
- **Cross-cutting Concern**: Update multiple related documentation files

#### 2. **Create/Update Documentation**

**For New Documentation Files:**
- Use clear, descriptive naming: `.docs/NEW-CONCEPT-NAME.md`
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

3. **Architecture Documentation** (`.docs/ARCHITECTURE.md`)
   - Update if it affects system architecture

4. **Tech Stack Documentation** (`.docs/TECH-STACK.md`)
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

---

## GitHub Project Management Integration

### Creating and Managing GitHub Issues with Projects V2

This project uses GitHub Projects V2 for task tracking. Follow this workflow when creating issues that need project board integration.

#### Essential Workflow Steps

1. **Create GitHub Issue**: Use `mcp_github_github_issue_write` with comprehensive description, labels, and metadata
2. **Find Project**: Use `mcp_github_github_list_projects` with `owner_type: 'user'` for personal projects
3. **Link Issue**: Use `mcp_github_github_add_project_item` with issue's **internal ID** (not issue number)
4. **Discover Fields**: Use `mcp_github_github_list_project_fields` to get field IDs and option IDs
5. **Set Field Values**: Use `mcp_github_github_update_project_item` for Status, Priority, Size, etc.

#### Critical Points

- **Issue IDs vs Numbers**: Projects require the internal `id` (e.g., 3600653715), NOT the issue `number` (e.g., 110)
- **Field Option IDs**: Use exact option ID strings (e.g., "f75ad846" for "Backlog"), not display names
- **Sequential Updates**: Field updates must be done one at a time (cannot batch)
- **Tool Activation**: If tools are disabled, use `activate_github_project_management_tools()` first

#### Common Field Mappings

**Status Field (230515571)**:
- Backlog (f75ad846): New issues not yet started
- Ready (61e4505c): Prepared for implementation  
- In progress (47fc9ee4): Active development
- In review (df73e18b): PR submitted for review
- Done (98236657): Completed and merged

**Priority Field (230515768)**:
- P0 (79628723): Critical/urgent
- P1 (0a877460): High priority/medium urgency
- P2 (da944a9c): Low priority/nice-to-have

**Size Field (230515769)**:
- XS (6c6483d2): < 1 hour
- S (f784b110): 1-2 hours
- M (7515a9f1): 4-6 hours
- L (817d0097): 1-2 days  
- XL (db339eb2): > 2 days

#### Quick Example

```typescript
// 1. Create issue and get internal ID
const issue = await mcp_github_github_issue_write({...})
// issue.id = 3600653715 (internal ID), issue.number = 110

// 2. Find project
const projects = await mcp_github_github_list_projects({
  owner: 'N0SAFE',
  owner_type: 'user'
})
// project_number = 3

// 3. Link to project
const item = await mcp_github_github_add_project_item({
  project_number: 3,
  content_id: 3600653715  // Use issue.id!
})
// item.id = '137943189'

// 4. Discover fields
const fields = await mcp_github_github_list_project_fields({...})

// 5. Set Status = Backlog
await mcp_github_github_update_project_item({
  item_id: '137943189',
  updated_field: { id: '230515571', value: 'f75ad846' }
})

// 6. Set Priority = P1
await mcp_github_github_update_project_item({
  item_id: '137943189',
  updated_field: { id: '230515768', value: '0a877460' }
})

// 7. Set Size = M
await mcp_github_github_update_project_item({
  item_id: '137943189',
  updated_field: { id: '230515769', value: '7515a9f1' }
})
```

#### Troubleshooting

- **404 errors**: Verify project_number is correct using list_projects
- **Field not found**: Ensure field is configured in GitHub UI first
- **Invalid option**: Use list_project_fields to get correct option IDs
- **Tools disabled**: Run activate_github_project_management_tools()

**For complete workflow documentation, see the memory bank file: `github-project-management-workflow.md`**