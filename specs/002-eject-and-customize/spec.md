# Feature Specification: Eject and Customize System for Monorepo Template

**Feature Branch**: `002-eject-and-customize`  
**Created**: 2025-10-16  
**Status**: Clarified  
**Input**: User description: "Create a two-command eject and customize system for the monorepo template. First command removes template showcase and prompts user about removing features like ORPC, Better Auth, etc. Second command builds on the eject and allows adding custom modules or switching frameworks."

## Clarifications *(from /speckit.clarify sessions)*

### Session 1 - 2025-10-16

- Q1: User roles and personas → A: Single "Developer" archetype (Option A). No separate maintainer UI or skill-level branching needed.
- Q2: Recovery/rollback UX on failure → A: Auto-detect failure, prompt user with choices (Rollback+retry / Rollback+abort / Continue anyway?), execute via `.backup/` snapshot system (hybrid B+D with snapshot-primary).
- Q3: Error communication and progress UX → A: Real-time progress bars per phase (analyze → remove → validate) + structured error messages with auto-suggested recovery actions (Option A).

### Session 2 - 2025-10-16 (Post-Tasks Validation)

- **Q1: Interdependency Strategy** → **A1**: Option B (Prevent deselection) - When user tries to remove a feature with dependents, system prevents deselection and guides user to remove dependents first. Rationale: More predictable UX, forces explicit user choices, reduces accidental broken states.
- **Q2: Error Message Format** → **A2**: Option C (Hybrid format) - Display human-friendly prose with metadata in terminal, also persist structured JSON to `.logs/errors.json` for debugging. Rationale: Best UX for end users + machine-readable backup for troubleshooting.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Eject Template Showcase (Priority: P1)

A developer who has forked the template wants to remove all template-specific showcase code and components while keeping the core infrastructure intact. They run the eject command and are prompted about which optional features they want to retain or remove.

**Why this priority**: This is the foundational feature - all other customizations depend on having a clean, ejected project. Removing the showcase is the first step any developer would take after forking.

**Independent Test**: Can be fully tested by running the eject command, verifying showcase files are removed, and confirming the project still builds and runs without the showcase components.

**Acceptance Scenarios**:

1. **Given** a forked template project, **When** user runs the eject command, **Then** the system displays an interactive menu with options for removing/keeping template features
2. **Given** the interactive menu is shown, **When** user selects features to remove, **Then** those features are cleanly removed without breaking dependencies
3. **Given** the eject process completes, **When** the project is built/run, **Then** it starts successfully without showcase components
4. **Given** showcase is removed, **When** user navigates to former showcase routes, **Then** appropriate 404 or redirect responses occur
5. **Given** optional features are kept selected, **When** the project runs, **Then** those features function normally

---

### User Story 2 - Interactive Feature Selection During Eject (Priority: P1)

During the eject process, developers are prompted about optional features (ORPC, Better Auth, Redis caching, etc.) and can choose which to keep or remove based on their needs.

**Why this priority**: This is critical for the first-time experience - developers need granular control over which features to include. This saves time and prevents confusion about unnecessary dependencies.

**Independent Test**: Can be tested by running the eject command and verifying the prompt system works correctly, responses are processed, and only selected features are removed/retained.

**Acceptance Scenarios**:

1. **Given** the eject command is executed, **When** the interactive prompt appears, **Then** all optional features are listed with descriptions and current status
2. **Given** a feature is listed, **When** user deselects it, **Then** all related code, dependencies, and configurations are marked for removal
3. **Given** a feature is listed, **When** user keeps it selected, **Then** all related code, dependencies, and configurations are preserved
4. **Given** user completes feature selection, **When** eject finishes, **Then** the selected features are actually removed from the codebase
5. **Given** interdependent features exist (e.g., auth requires database), **When** user tries to deselect a dependency, **Then** system prevents deselection and displays: "❌ Cannot remove [Feature] - [Dependent Feature] still depends on it. Remove [Dependent Feature] first." (Per Session 2 Q1: Option B)

---

### User Story 3 - Customize System for Adding Features (Priority: P2)

After ejecting, developers can run a customize command that uses the clean eject as a base and allows them to add new modules, replace frameworks, or integrate different technologies.

**Why this priority**: This enables developers to scaffold new functionality or make architectural changes on top of a clean base. High value but depends on successful eject completion.

**Independent Test**: Can be tested by running customize on an ejected project and verifying that new features can be added without conflicts or breaking existing functionality.

**Acceptance Scenarios**:

1. **Given** a project has been ejected, **When** user runs the customize command, **Then** the system displays available modules or framework options
2. **Given** customize command shows options, **When** user selects a module to add, **Then** the module is installed with all dependencies and properly integrated
3. **Given** a module is added, **When** the project is built/run, **Then** the new module functions correctly and integrates with existing code
4. **Given** customize is offered after eject, **When** user chooses to skip customize, **Then** the ejected project is ready for immediate use
5. **Given** multiple customizations are added, **When** the project runs, **Then** all customizations coexist without conflicts

---

### User Story 4 - Framework Switching Support (Priority: P3)

For advanced use cases, developers can customize the template to use alternative frameworks or technology stacks (e.g., switching from ORPC to tRPC, or replacing Next.js patterns).

**Why this priority**: This enables power users to adapt the template to their existing tech stack. Valuable but lower priority than core eject and basic customization.

**Independent Test**: Can be tested by successfully replacing a framework component and verifying the project still builds, type safety is maintained, and primary workflows function.

**Acceptance Scenarios**:

1. **Given** the customize command is running, **When** user selects "framework swap" option, **Then** available alternative frameworks are listed
2. **Given** a framework replacement is selected, **When** user confirms, **Then** the old framework is removed and the new one is installed/configured
3. **Given** a framework is replaced, **When** the project is tested, **Then** type safety and end-to-end contracts still work correctly
4. **Given** a framework change is complete, **When** documentation is regenerated, **Then** examples reflect the new framework

---

### Edge Cases

- What happens when a user interrupts the eject/customize process mid-way? (Recovery/resume capability needed?)
- How does the system handle features with complex interdependencies that create removal conflicts?
- What if a user manually modifies files during eject/customize execution?
- How does the system handle projects that have been partially ejected or customized previously?
- What happens if a developer tries to customize without ejecting first? (Should customize auto-run eject or require explicit eject first?)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an `eject` command that removes all template showcase code and components
- **FR-002**: System MUST display an interactive menu during eject showing optional features (ORPC, Better Auth, Redis, documentation site, etc.)
- **FR-003**: System MUST allow users to select which optional features to remove or keep during eject
- **FR-004**: System MUST use feature removal manifests to identify and remove all feature-specific files, routes, API contracts, and configurations. Each removable feature MUST have a manifest file specifying exactly what should be removed (files, folders, config keys, dependencies)
- **FR-005**: System MUST provide a `customize` command that operates on an ejected project
- **FR-006**: System MUST allow customize command to add new modules or packages to the ejected project
- **FR-007**: System MUST allow customize command to swap out framework components (e.g., ORPC for tRPC)
- **FR-008**: System MUST validate that the project builds successfully after eject/customize operations
- **FR-009**: System MUST provide rollback or recovery mechanism if eject/customize fails partway through
- **FR-010**: System MUST update dependency manifests (package.json) to reflect removed/added features
- **FR-011**: System MUST clean up unused configuration files, environment templates, and docker/deployment configs after feature removal
- **FR-012**: System MUST provide detailed logging/output of what was removed/added during eject/customize
- **FR-013** (Clarified Q3): System MUST display real-time progress bars for each operation phase (analyzing → removing → validating)
- **FR-014** (Clarified Q3 & Session 2 Q2): System MUST display structured error messages showing: (1) what failed, (2) why it failed, (3) auto-suggested recovery action. Format per Session 2 Q2 (Option C): Human-friendly prose in terminal + structured JSON persisted to `.logs/errors.json` for debugging
- **FR-015** (Clarified Q2): System MUST create `.backup/` snapshots before starting eject/customize operations
- **FR-016** (Clarified Q2): System MUST detect operation failures and prompt user with three options: (1) "Rollback and retry?", (2) "Rollback and abort?", (3) "Continue anyway?"
- **FR-017** (Clarified Q2): System MUST restore from `.backup/` snapshot if user selects "Rollback" option
- **FR-013**: System MUST display real-time progress bars for each operation phase (analyzing → removing → validating) to communicate progress during long-running operations
- **FR-014**: System MUST detect failures during eject/customize and prompt user with recovery options: (1) "Rollback and retry?" (2) "Rollback and abort?" (3) "Continue anyway?"
- **FR-015**: System MUST create backup snapshots in `.backup/` directory before eject/customize operations begin and use snapshots for rollback (primary recovery mechanism)
- **FR-016**: On error, system MUST display structured error message with: (a) what failed, (b) why it failed, (c) auto-suggested recovery action

### Key Entities

- **Template Feature**: A removable or swappable component of the template (e.g., ORPC API layer, Better Auth integration, Redis caching, Shadcn UI components)
  - Attributes: name, description, dependencies, reverse-dependencies, associated files/folders
  
- **Eject Configuration**: User's selected features and preferences from the interactive menu
  - Attributes: features_to_remove, features_to_keep, timestamp, project_snapshot
  
- **Custom Module**: A module/package that can be added via customize (e.g., Stripe integration, Analytics, Email service)
  - Attributes: name, install_script, integration_points, files_to_add, dependencies

- **Framework Swap**: A predefined alternative to a core framework component
  - Attributes: original_framework, replacement_framework, swap_script, compatibility_version

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eject command completes in under 2 minutes for average-sized project with all showcase removed
- **SC-002**: After eject with features removed, project builds and runs without errors within first attempt for 95% of use cases
- **SC-003**: Customize command allows adding at least 3 different module types (integrations, UI additions, service layers) with zero manual configuration needed
- **SC-004**: Documentation and README files are automatically updated to reflect ejected/customized state (showcase examples removed, custom features documented)
- **SC-005**: Users can complete full eject → customize → build workflow independently without reading documentation (task completion rate ≥ 80% on first try)
- **SC-006**: Rollback of a failed eject/customize operation restores project to fully functional state in under 1 minute
- **SC-007**: At least 90% of removed features can be identified automatically by the system (vs. requiring manual file lists)

## Clarifications

### Session 2025-10-16

- **Q1: User Roles and Personas** → **A1**: Single "Developer" archetype (Option A) - Developer who forks template, removes showcase, customizes for their needs. No separate Maintainer UI or skill-level branching.
- **Q2: Recovery Mechanism on Failure** → **A2**: Snapshot-primary hybrid (B+D) - System creates `.backup/` snapshots before operations. On failure, detects it, prompts user: (1) "Rollback and retry?", (2) "Rollback and abort?", (3) "Continue anyway?". If Rollback chosen, restores via `.backup/` system. Meets SC-006 (<1 min recovery).
- **Q3: Error Communication and Progress UX** → **A3**: Real-time progress bars + structured errors (Option A) - Shows progress bars for each phase (analyzing → removing → validating). On error displays: (1) What failed, (2) Why, (3) Auto-suggested recovery action. Supports SC-005 (80% independent task completion).

## Assumptions

1. **Feature Detection**: The system can automatically detect template showcase files by common naming patterns or directory structure (e.g., `/showcase`, demo components)
2. **Safe Removal**: Removing optional features won't break core infrastructure since they're designed to be pluggable
3. **Version Compatibility**: After customization, all added modules are compatible with the retained framework versions
4. **Build Validation**: TypeScript and build tools can serve as automated validation that removal/addition was successful
5. **User Expertise**: Developers running customize command have basic familiarity with monorepo structure and package management (single Developer archetype per Q1)
6. **Git Available**: Projects use Git and can leverage Git history for recovery if needed
7. **Clean State Assumption**: Eject/customize operations are intended for fresh projects or after commit to allow rollback via Git
8. **Documentation Auto-generation**: Dynamic docs can be regenerated based on current project structure after modifications
9. **Backup System**: System has write access to create `.backup/` directories for pre-operation snapshots per Q2
10. **Error Handling**: CLI tooling can display real-time progress bars and structured error messages per Q3

### Clarified Assumptions from Sessions

**Session 1 Clarifications (2025-10-16)**:
9. **Single User Archetype**: All eject/customize users are assumed to be "Developers" with normal technical competency. No separate UX for "Maintainers" or skill-level branching.
10. **Automatic Recovery with Choice**: When failures occur, system automatically creates `.backup/` snapshots and prompts user with recovery options (retry/abort/continue) rather than requiring manual git commands.
11. **Progress Transparency**: Long-running operations (SC-001: <2 min eject) require real-time progress bars and structured error messages with auto-suggested recovery to support SC-005 (80% independent task completion)

**Session 2 Clarifications (Post-Tasks Validation)**:
12. **Interdependency Prevention**: Feature removal respects dependencies by preventing deselection of features that other selected features depend on. User must explicitly remove dependents first, guided by system prompts. This prevents broken states (Task T031).
13. **Dual-format Error Logging**: Error messages display human-readable prose to end users in terminal, while also persisting structured JSON data to `.logs/errors.json` for debugging and monitoring. Supports both UX and operational transparency (Task T023).

