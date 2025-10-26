---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
handoffs: 
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

## Core Concepts Compliance

**CRITICAL**: All planning decisions MUST comply with core concepts.

**Mandatory Planning Patterns**:

1. **ORPC Contract-First (Core Concept 09 - NON-NEGOTIABLE)**:
   - In data-model.md: Define entity schemas that map to ORPC contracts
   - In contracts/: Create ORPC contract definitions first
   - In plan.md: Document 3-step implementation flow
   - File structure: Contracts before controllers in dependency order

2. **Service-Adapter Pattern (Core Concept 02)**:
   - In plan.md: Document architecture layers (Controllers → Services → Repositories → Adapters)
   - In data-model.md: Separate entities (database) from contracts (API)
   - File structure: Entities → Repositories → Services → Adapters → Controllers

3. **Better Auth Integration (Core Concept 07)**:
   - In plan.md: Document `AuthService.api` wrapper usage
   - In contracts/: Auth endpoints use centralized service
   - Configuration: Auth setup in `apps/api/src/auth.ts`

4. **Repository Ownership (Core Concept 03)**:
   - In plan.md: Each feature has domain-specific repositories
   - File structure: Repositories scoped to feature domain
   - Example: `UserRepository`, `CapsuleRepository` (not generic)

5. **Documentation Maintenance (Core Concept 10)**:
   - In quickstart.md: Include setup, usage, and integration steps
   - In plan.md: Document parent README update requirements
   - Architecture docs: Update when adding new patterns

**Validation Checkpoints**:
- Constitution Check section MUST validate pattern compliance
- Run `/speckit.validate-core-concepts` after planning for comprehensive audit

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design

4. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update**:
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
