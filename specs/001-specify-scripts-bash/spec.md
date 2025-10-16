# Feature Specification: Documentation Structure Reorganization

**Feature Branch**: `002-docs-restructure-efficiency`  
**Created**: 2025-10-16  
**Status**: Draft  
**Input**: User description: "Update main docs folder to be more efficient and usable by both users and LLMs. Copilot instructions should reference docs to determine behavior and awareness of all features. Restructure docs by concepts, features, and planning."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - LLM Agent Discovery & Context Loading (Priority: P1)

An AI coding agent (like Copilot) needs to quickly understand the project architecture, patterns, and guidelines at the start of each session. The agent must load core documentation to ensure all subsequent decisions follow established architectural principles.

**Why this priority**: This is foundational—without proper discovery, AI agents violate core principles and produce inconsistent code. Core concepts in `docs/core-concepts/` must be non-negotiable reference material.

**Independent Test**: Can be tested by verifying that an LLM can systematically load and reference the documentation structure to make architecture-aligned decisions. MVP: Documentation structure is clear enough that a document crawler can identify which files to load for different task types.

**Acceptance Scenarios**:

1. **Given** an LLM agent starting a task, **When** it searches for architectural guidance, **Then** it finds a clear index and can identify core-concepts as mandatory, followed by relevant feature/planning docs.
2. **Given** documentation exists, **When** an LLM checks for "ORPC implementation rules", **Then** it finds the answer in core-concepts/ with links to extended guides.
3. **Given** a new developer reading docs, **When** they need to understand the project, **Then** the README.md and docs/README.md provide a clear hierarchy with links to core-concepts/ marked as **non-negotiable**.

---

### User Story 2 - Developer Navigation & Feature Lookup (Priority: P1)

A developer starting work on a feature should quickly navigate the documentation to find concepts, guides, and implementation patterns. Documentation should be organized by topic hierarchy, not just an alphabetical list.

**Why this priority**: Poor navigation causes developers to miss critical patterns or duplicate work. Clear categorization (concepts, features, planning, guides, reference) reduces cognitive load and search time.

**Independent Test**: Can be tested by simulating a developer workflow: "I'm building a new API endpoint"—docs should guide them through ORPC concepts → endpoint pattern → testing → deployment in a logical flow. MVP: Restructured folder layout with clear README showing organization.

**Acceptance Scenarios**:

1. **Given** a developer unfamiliar with the project, **When** they read `docs/README.md`, **Then** they see an opinionated journey organized by concepts/guides with clear purpose and recommended reading order.
2. **Given** a developer needs to implement an ORPC endpoint, **When** they search for guidance, **Then** they find: core-concepts/ORPC-IMPLEMENTATION-PATTERN.md → guides/API-DEVELOPMENT.md → examples linked from both.
3. **Given** a developer wants to understand database operations, **When** they check docs structure, **Then** core-concepts/DATABASE-PATTERN.md exists with links to TESTING.md, DEVELOPMENT-WORKFLOW.md, and schema reference docs.

---

### User Story 3 - Copilot Instructions Point to Core Concepts Hub (Priority: P1)

The `.github/copilot-instructions.md` file should instruct LLMs to **always read `docs/core-concepts/README.md` first and follow its instructions at all cost**. The `docs/core-concepts/README.md` acts as the governance hub, referencing all core-concept files, explaining their purpose, and requiring adherence to all listed patterns.

**Why this priority**: Copilot instructions are critical for AI consistency, but should be thin and direct LLMs to a single authoritative entry point (core-concepts/README.md). This prevents duplication and ensures single source of truth. Core-concepts/README.md orchestrates all mandatory reading and enforcement; when core-concepts change, behavior automatically updates.

**Independent Test**: Can be tested by verifying: (a) `.github/copilot-instructions.md` contains explicit instruction "Always read docs/core-concepts/README.md and follow its instructions at all cost", (b) `docs/core-concepts/README.md` exists with: introduction to workflow, link to COPILOT-WORKFLOW-DIAGRAM.md, complete list of all core-concepts with descriptions and mandatory links, (c) NO core-concept rules duplicated outside docs/core-concepts/, (d) LLM can discover all mandatory patterns by reading only copilot-instructions.md → core-concepts/README.md → each core-concept file. MVP: Updated copilot-instructions.md and new core-concepts/README.md hub file.

**Acceptance Scenarios**:

1. **Given** an LLM reads copilot-instructions.md, **When** it searches for guidance, **Then** it finds: explicit instruction "Read docs/core-concepts/README.md and follow ALL its instructions at all cost" with a clear link.
2. **Given** an LLM reads docs/core-concepts/README.md, **When** it starts, **Then** it finds: (a) explanation of what core-concepts are and why they're mandatory, (b) link to COPILOT-WORKFLOW-DIAGRAM.md with instruction "Follow these steps", (c) complete list of all core-concepts with brief description, mandatory flag, and link to each file.
3. **Given** a developer reviews LLM behavior, **When** checking alignment with rules, **Then** all mandatory patterns are discoverable via single entry point (copilot-instructions.md → core-concepts/README.md) with no duplication across files.

---

### User Story 4 - Unified Navigation Hub (Priority: P2)

All documentation files are linked together in a coherent navigation system. Users can jump between concepts, guides, and reference docs without dead links or unclear relationships.

**Why this priority**: Reduces friction and supports multiple learning styles (sequential onboarding vs. random access for specific features). Improves SEO and cross-linking for doc readers.

**Independent Test**: Can be tested by running a link checker on restructured docs and verifying that all internal links resolve. Can verify navigation breadcrumbs exist in major sections.

**Acceptance Scenarios**:

1. **Given** docs/README.md, **When** a user clicks on a core-concepts link, **Then** that file contains back-links to related guides and context.
2. **Given** a developer reading docs/guides/API-DEVELOPMENT.md, **When** they encounter a concept, **Then** a link to docs/core-concepts/ORPC-IMPLEMENTATION-PATTERN.md is present.
3. **Given** all docs, **When** a crawler checks links, **Then** no 404 errors exist for internal references.

---

### User Story 5 - Documentation Categorization by Function (Priority: P2)

Documentation is clearly categorized into: Core Concepts (non-negotiable rules), Guides (step-by-step how-to), Features (feature-specific docs), Planning (planning docs for specific features), Reference (lookup tables, commands, glossaries).

**Why this priority**: Enables users to quickly identify what type of information they need. Supports different reading styles (learn vs. reference). Enables better LLM decision-making ("Is this a concept, guide, or planning doc?").

**Independent Test**: Can be tested by verifying that docs/README.md clearly describes each category and provides examples of which files belong where. MVP: Reorganized folder structure and updated README.

**Acceptance Scenarios**:

1. **Given** the docs folder structure, **When** an outsider views it, **Then** categories (core-concepts, guides, features, planning, reference) are immediately obvious.
2. **Given** a developer, **When** they read docs/README.md, **Then** each category has a clear definition and list of example files.
3. **Given** a new file being added, **When** a team member decides where to place it, **Then** the docs structure provides clear guidance (concept? feature guide? reference?).

---

### Edge Cases

- What happens when docs are co-located in multiple apps (docs/main vs. apps/doc/)? How should cross-references work?
- How should core-concepts be maintained when feature-specific docs exist? Should all features reference core-concepts?
- Should generated/auto-migrated docs (like env-template-prompter/) be in main docs structure or kept separate?
- What about historical/legacy docs? Should they be archived, deleted, or marked as deprecated?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST organize documentation into 5 main categories: Core Concepts, Guides, Features, Planning, Reference
- **FR-002**: System MUST create `docs/core-concepts/README.md` as the governance hub that: (a) explains purpose and mandatory nature of core-concepts, (b) links to COPILOT-WORKFLOW-DIAGRAM.md with instruction "Copilot must follow these steps", (c) lists ALL core-concepts with brief description, mandatory flag, and link to each file
- **FR-003**: System MUST update `.github/copilot-instructions.md` with explicit instruction: "Always read docs/core-concepts/README.md and follow ALL its instructions at all cost" with a clear link
- **FR-004**: System MUST ensure all Core Concepts files are discoverable from core-concepts/README.md and marked as non-negotiable reference material
- **FR-005**: System MUST link all conceptual docs to relevant how-to guides and reference materials
- **FR-006**: System MUST consolidate/deduplicate documentation where content appears in multiple places (prevent core-concept rules from appearing outside docs/core-concepts/)
- **FR-007**: System MUST ensure all docs are scannable by both human readers and LLM document loaders (clear headings, link syntax, structure)
- **FR-008**: System MUST archive or clearly mark legacy/deprecated documentation (e.g., Directus migration docs, testing summaries)
- **FR-009**: System MUST provide breadcrumb context in each documentation file (context of where file fits in hierarchy)
- **FR-010**: System MUST document the docs structure itself (a meta-guide: "How to navigate these docs", "Where to add new docs")

### Key Entities

- **Core Concepts**: Non-negotiable architectural patterns (e.g., ORPC, Monorepo Discipline, Docker-First, Testing, Routing)
  - Attributes: mandatory flag, enforceability level, related guides, cross-references
  
- **Guides**: Step-by-step how-to documentation (Getting Started, Development Workflow, Testing, Deployment)
  - Attributes: prerequisites, learning order, related concepts, verification steps
  
- **Features**: Feature-specific documentation and specifications (api-contracts, UI components, environment system)
  - Attributes: location in monorepo, concepts it depends on, usage examples
  
- **Planning**: Planning and specification docs (often created during feature development)
  - Attributes: feature scope, technical decisions, constraints, success criteria
  
- **Reference**: Lookup materials (glossary, commands, environment variables, API references)
  - Attributes: topic, searchability, format (table/list/prose), last updated

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `.github/copilot-instructions.md` contains explicit instruction "Always read docs/core-concepts/README.md and follow ALL its instructions at all cost" with clear link; NO other core-concept rules in copilot-instructions.md
- **SC-002**: `docs/core-concepts/README.md` exists with: (a) explanation of purpose/mandatory nature, (b) link to COPILOT-WORKFLOW-DIAGRAM.md marked "Copilot must follow these steps", (c) complete list of ALL core-concepts with description, mandatory flag, and link
- **SC-003**: 100% of Core Concept files are listed in core-concepts/README.md with links and marked as mandatory reading
- **SC-004**: All documentation files have backward links to related concepts/guides (developers can traverse between related docs)
- **SC-005**: Average navigation depth from docs/README.md to any specific doc is ≤ 3 clicks (clear hierarchy)
- **SC-006**: Documentation structure is documented in a meta-guide (docs/NAVIGATION.md or similar) that a new contributor can understand in < 10 minutes
- **SC-007**: Zero broken internal links in all documentation files (verified by link checker tool)
- **SC-008**: 90% of legacy/deprecated docs are either migrated into new structure or clearly marked as archived
- **SC-009**: docs/README.md provides a reading order that a new developer can follow to understand the project in < 1 hour
- **SC-010**: Each Core Concept file contains explicit statement of how it's enforced (mandatory for code review, LLM behavior, etc.)

### Assumptions

- The `apps/doc/` directory with Fumadocs is considered a display/publishing layer and not the source of truth for structure (source is `docs/` folder)
- Core concepts should not change frequently; guides and features are updated more often
- Legacy documentation (Directus migration, testing summaries) should be archived, not deleted
- The copilot-instructions.md file is a critical enforcement mechanism for AI behavior consistency
- Documentation is written for both human developers and LLM consumption (clear structure, no ambiguity)

