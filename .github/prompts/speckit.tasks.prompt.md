---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories with priorities)
   - **Optional**: data-model.md (entities), contracts/ (API endpoints), research.md (decisions), quickstart.md (test scenarios)
   - Note: Not all projects have all documents. Generate tasks based on what's available.

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories with their priorities (P1, P2, P3, etc.)
   - If data-model.md exists: Extract entities and map to user stories
   - If contracts/ exists: Map endpoints to user stories
   - If research.md exists: Extract decisions for setup tasks
   - Generate tasks organized by user story (see Task Generation Rules below)
   - Generate dependency graph showing user story completion order
   - Create parallel execution examples per user story
   - Validate task completeness (each user story has all needed tasks, independently testable)

4. **Generate tasks.md**: Use `.specify.specify/templates/tasks-template.md` as structure, fill with:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks (project initialization)
   - Phase 2: Foundational tasks (blocking prerequisites for all user stories)
   - Phase 3+: One phase per user story (in priority order from spec.md)
   - Each phase includes: story goal, independent test criteria, tests (if requested), implementation tasks
   - Final Phase: Polish & cross-cutting concerns
   - All tasks must follow the strict checklist format (see Task Generation Rules below)
   - Clear file paths for each task
   - Dependencies section showing story completion order
   - Parallel execution examples per story
   - Implementation strategy section (MVP first, incremental delivery)

5. **Report**: Output path to generated tasks.md and summary:
   - Total task count
   - Task count per user story
   - Parallel opportunities identified
   - Independent test criteria for each story
   - Suggested MVP scope (typically just User Story 1)
   - Format validation: Confirm ALL tasks follow the checklist format (checkbox, ID, labels, file paths)

6. **Post-Generation Validation** (MANDATORY):
   After generating tasks.md, you MUST run the task management verification script:
   
   ```bash
   .specify/scripts/bash/manage-tasks.sh verify FEATURE_DIR/tasks.md
   ```
   
   **If verification fails**:
   - Review the error messages (include line numbers and specific issues)
   - Fix ALL format violations immediately using the script's guidance
   - Re-run verification until all checks pass
   - Common issues to fix:
     * Missing checkboxes (`- [ ]` or `- [x]`)
     * Incorrect task ID format (must be T### with 3+ digits)
     * Improper label spacing ([P], [US#] require space after bracket)
     * Missing file paths in descriptions
   
   **Optional automated checks** (use as needed during task maintenance):
   
   ```bash
   # Check for duplicates, gaps, orphaned tasks
   .specify/scripts/bash/manage-tasks.sh check FEATURE_DIR/tasks.md
   
   # Auto-fix sequential numbering (with backup)
   .specify/scripts/bash/manage-tasks.sh reorganize --auto FEATURE_DIR/tasks.md
   
   # Update task completion status
   .specify/scripts/bash/manage-tasks.sh update --complete --task T001,T002 FEATURE_DIR/tasks.md
   ```
   
   **When to use these commands**:
   - `verify`: ALWAYS after initial generation, before reporting to user
   - `check`: When reviewing existing tasks.md, or after manual edits
   - `reorganize --auto`: When task IDs have gaps/duplicates (creates timestamped backup)
   - `update --complete/--incomplete`: When marking tasks as done during implementation
   
   **Script features**:
   - JSON output available with `--json` flag for CI/CD integration
   - Automatic backups before modifications (timestamped)
   - Line-by-line error reporting with specific issues
   - Validates against constitution standards (v1.3.0)
   
   Only proceed to step 5 reporting after verification passes successfully.

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## Core Concepts Compliance

**CRITICAL**: All generated tasks MUST comply with project core concepts from `.docs/core-concepts/`.

**Mandatory Patterns**:

1. **ORPC Contract-First** (Core Concept 09 - NON-NEGOTIABLE):
   - Every API endpoint MUST be split into 3 sequential tasks:
     - Task A: Define contract in `packages/api-contracts/[feature].contract.ts`
     - Task B: Implement controller using `@Implement(contract.method)`
     - Task C: Generate ORPC client with `bun run web -- generate`
   - NO direct endpoint implementation without contract definition
   - Ensures end-to-end type safety from backend to auto-generated React Query hooks

2. **Service-Adapter Pattern** (Core Concept 02):
   - Controllers call Services (business logic)
   - Services call Repositories (data access via DatabaseService)
   - Adapters transform entities to contracts
   - Controllers NEVER access DatabaseService directly
   - Task descriptions must explicitly note this pattern

3. **Better Auth Integration** (Core Concept 07):
   - All auth operations use `AuthService.api` wrapper
   - NO direct `betterAuth.*` calls in controllers
   - Reference `apps/api/src/core/modules/auth/services/auth.service.ts`

4. **Repository Ownership** (Core Concept 03):
   - Repositories owned by domain services
   - NO generic shared repositories
   - Each feature has its own repositories

5. **Documentation Maintenance** (Core Concept 10):
   - Documentation update tasks include parent README updates
   - Link validation tasks when modifying docs structure

**Validation**: After generating tasks.md, recommend running `/speckit.validate-core-concepts` to verify compliance before implementation.

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story to enable independent implementation and testing.

**Tests are OPTIONAL**: Only generate test tasks if explicitly requested in the feature specification or if user requests TDD approach.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[Story] label**: REQUIRED for user story phase tasks only
   - Format: [US1], [US2], [US3], etc. (maps to user stories from spec.md)
   - Setup phase: NO story label
   - Foundational phase: NO story label  
   - User Story phases: MUST have story label
   - Polish phase: NO story label
5. **Description**: Clear action with exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID and Story label)
- ❌ WRONG: `T001 [US1] Create model` (missing checkbox)
- ❌ WRONG: `- [ ] [US1] Create User model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (missing file path)

### Task Organization

1. **From User Stories (spec.md)** - PRIMARY ORGANIZATION:
   - Each user story (P1, P2, P3...) gets its own phase
   - Map all related components to their story:
     - Models needed for that story
     - Services needed for that story
     - Endpoints/UI needed for that story
     - If tests requested: Tests specific to that story
   - Mark story dependencies (most stories should be independent)
   
2. **From Contracts**:
   - Map each contract/endpoint → to the user story it serves
   - If tests requested: Each contract → contract test task [P] before implementation in that story's phase
   
3. **From Data Model**:
   - Map each entity to the user story(ies) that need it
   - If entity serves multiple stories: Put in earliest story or Setup phase
   - Relationships → service layer tasks in appropriate story phase
   
4. **From Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Story-specific setup → within that story's phase

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before user stories)
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Tests (if requested) → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns
