---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     * Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     * Completed items: Lines matching `- [X]` or `- [x]`
     * Incomplete items: Lines matching `- [ ]`
   - Create a status table:
     ```
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```
   - Calculate overall status:
     * **PASS**: All checklists have 0 incomplete items
     * **FAIL**: One or more checklists have incomplete items
   
   - **If any checklist is incomplete**:
     * Display the table with incomplete item counts
     * **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     * Wait for user response before continuing
     * If user says "no" or "wait" or "stop", halt execution
     * If user says "yes" or "proceed" or "continue", proceed to step 3
   
   - **If all checklists are complete**:
     * Display the table showing all checklists passed
     * Automatically proceed to step 3

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios

4. **Project Setup Verification**:
   - **REQUIRED**: Create/verify ignore files based on actual project setup:
   
   **Detection & Creation Logic**:
   - Check if the following command succeeds to determine if the repository is a git repo (create/verify .gitignore if so):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```
   - Check if Dockerfile* exists or Docker in plan.md → create/verify .dockerignore
   - Check if .eslintrc* or eslint.config.* exists → create/verify .eslintignore
   - Check if .prettierrc* exists → create/verify .prettierignore
   - Check if .npmrc or package.json exists → create/verify .npmignore (if publishing)
   - Check if terraform files (*.tf) exist → create/verify .terraformignore
   - Check if .helmignore needed (helm charts present) → create/verify .helmignore
   
   **If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
   **If ignore file missing**: Create with full pattern set for detected technology
   
   **Common Patterns by Technology** (from plan.md tech stack):
   - **Node.js/JavaScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `Makefile`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`
   
   **Tool-Specific Patterns**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`

5. Parse tasks.md structure and extract:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements

6. Execute implementation following the task plan:
   - **Phase-by-phase execution**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together  
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   - **Validation checkpoints**: Verify each phase completion before proceeding

7. Implementation execution rules:
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish and validation**: Unit tests, performance optimization, documentation

8. Progress tracking and error handling:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** For completed tasks, make sure to mark the task off as [X] in the tasks file.

9. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original specification
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary of completed work

## Core Concepts Compliance During Implementation

**CRITICAL**: Implementation MUST strictly follow core concepts. Validate compliance at every step.

**Implementation Enforcement**:

1. **ORPC Contract-First (Core Concept 09 - BLOCKING)**:
   - **BEFORE implementing any endpoint**:
     1. ✅ Contract MUST exist in `packages/api-contracts/`
     2. ✅ Controller MUST use `@Implement(contract)` decorator
     3. ✅ Client MUST be generated: `bun run web -- generate`
   - **NEVER implement endpoint without contract first**
   - **Validation**: Check contract file exists before controller creation
   - **Error**: Stop implementation if contract missing

2. **Service-Adapter Pattern (Core Concept 02 - BLOCKING)**:
   - **Architecture layers** (MUST follow this order):
     1. Repositories: `src/repositories/[domain].repository.ts`
     2. Services: `src/services/[domain].service.ts`
     3. Adapters: `src/adapters/[domain].adapter.ts`
     4. Controllers: `src/controllers/[domain].controller.ts`
   - **NEVER allow**:
     - Controllers accessing `DatabaseService` directly
     - Business logic in controllers
     - Data access logic outside repositories
   - **Validation**: Check import statements, flag violations
   - **Correction**: Refactor before proceeding

3. **Better Auth Integration (Core Concept 07 - BLOCKING)**:
   - **ALL auth operations** MUST use `AuthService.api`:
     ```typescript
     // ✅ CORRECT
     await this.authService.api.signIn.email(...)
     
     // ❌ WRONG - STOP IMPLEMENTATION
     await betterAuth.signIn.email(...)
     ```
   - **Configuration**: Centralized in `apps/api/src/auth.ts`
   - **Validation**: Search for `betterAuth.` calls, flag violations
   - **Error**: Refactor to use wrapper before proceeding

4. **Repository Ownership (Core Concept 03)**:
   - **Domain-specific repositories**:
     - `UserRepository` for user domain
     - `CapsuleRepository` for capsule domain
     - NOT `GenericRepository` or `SharedRepository`
   - **File location**: `src/repositories/[domain].repository.ts`
   - **Validation**: Check repository names match domain

5. **File Management Policy (Core Concept 08 - BLOCKING)**:
   - **NEVER delete files** without explicit user permission
   - **ALWAYS ask first**: "This requires deleting X. Proceed? (yes/no)"
   - **Wait for approval** before any deletion
   - **Alternative**: Suggest refactoring instead of deletion

6. **Documentation Maintenance (Core Concept 10)**:
   - **After implementation**:
     - Update parent README if structure changed
     - Validate all documentation links
     - Document new patterns/concepts
     - Update quickstart guide if needed
   - **Validation**: Check README accuracy after implementation

**Continuous Validation**:
- Check compliance BEFORE each file creation/modification
- Flag violations immediately, stop implementation
- Provide correction guidance with core concept reference
- Re-validate after corrections applied
- Final compliance audit before marking tasks complete

**Error Handling**:
- **CRITICAL violations** (ORPC, Service-Adapter, Better Auth, File Deletion): STOP implementation, require fix
- **HIGH violations** (Repository Ownership, Documentation): Flag, suggest fix, can continue with user approval
- **Document all violations** in implementation notes

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/tasks` first to regenerate the task list.
