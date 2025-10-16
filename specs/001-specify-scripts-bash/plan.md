# Implementation Plan: Documentation Structure Reorganization

**Branch**: `001-specify-scripts-bash` | **Date**: 2025-10-16 | **Spec**: `specs/001-specify-scripts-bash/spec.md`  
**Input**: Feature specification from `specs/001-specify-scripts-bash/spec.md`

**Phase Status**: 🔄 Phase 0 COMPLETE ✅ | Phase 1 NEXT (Design & Contracts) | Phase 2 TBD (Tasks)

## Summary

Restructure the documentation folder (`/docs`) to be more efficient and usable by both human developers and LLMs. Create a hub-based architecture where `.github/copilot-instructions.md` explicitly delegates to `docs/core-concepts/README.md` as the single source of truth for all mandatory patterns. Organize existing documentation into 5 categories (Core Concepts, Guides, Features, Planning, Reference) with clear navigation, breadcrumbs, and cross-references. Establish documentation discovery and maintenance protocols to ensure long-term quality and consistency.

**Technical Approach**: 
- Phase 0 ✅ COMPLETE: Resolved all unknowns; confirmed core-concepts files (110K+ lines) are complete
- Phase 1 (NEXT): Update copilot-instructions.md to reference core-concepts/README.md; organize existing docs into subdirectories; create NAVIGATION.md meta-guide; add breadcrumbs and links
- Phase 2: Implement enforcement via CI/CD link checker; update agent context; create implementation tasks

## Technical Context

**Language/Version**: Markdown (documentation) + YAML (frontmatter for metadata)  
**Primary Dependencies**: VS Code, Git, Markdown preview tools, link checker tools  
**Storage**: GitHub repository (documentation as code)  
**Testing**: Automated link checker (verify all internal links resolve); manual review by developers and LLMs  
**Target Platform**: GitHub (primary) + Fumadocs in apps/doc (publishing layer)  
**Project Type**: Documentation restructuring (monorepo-wide, affects all packages and apps)  
**Performance Goals**: LLM document loading <2 seconds for 110K+ lines of documentation  
**Constraints**: 
- No breaking changes to existing links (backward compatible)
- All core-concepts files already exist and are final (no modifications needed)
- Must maintain consistency with existing copilot-instructions.md governance model
- Documentation must be readable by both humans and LLM document loaders  

**Scale/Scope**: 
- 24+ documentation files across `/docs` directory
- 110,000+ lines of core-concepts documentation
- 12 core-concept files establishing mandatory patterns
- Cross-references between guides, features, planning, and reference docs

## Constitution Check

*GATE: Must pass before proceeding to Phase 1 design.*

### ✅ ALL GATES PASS

**I. End-to-End Type Safety via ORPC**: ✅ ALIGNED  
- Documentation structure supports ORPC principle via dedicated core-concept file (09-ORPC-IMPLEMENTATION-PATTERN.md)
- Copilot instructions will direct LLMs to this pattern as mandatory reference
- No conflicts with ORPC-first architecture

**II. Monorepo Discipline via Turborepo**: ✅ ALIGNED  
- Documentation structure mirrors monorepo hierarchy (core-concepts as shared rules, features for feature-specific docs)
- Core-concepts/README.md acts as "workspace coordinator" for documentation
- Supports clear separation of concerns and prevents circular references

**III. Docker-First Development**: ✅ OK  
- Feature doesn't add Docker requirements; only reorganizes existing documentation
- Documentation structure accommodates Docker-first workflows (guides for Docker, Docker optimization docs)
- No conflicts with Docker principle

**IV. Centralized Testing via Vitest**: ✅ OK  
- Feature doesn't modify testing infrastructure
- Testing documentation organized under guides/features/reference categories
- Orthogonal to testing principle

**V. Declarative Routing & Type-Safe Navigation**: ✅ SUPPORTED  
- Documentation structure follows declarative approach (clear hierarchy, generated index)
- Navigation uses relative paths (compatible with LLM document loaders and human readers)
- Supports type-safe documentation references

**VI. Better Auth Integration**: ✅ OK  
- Documentation includes Better Auth implementation guide (core-concepts/07-BETTER-AUTH-INTEGRATION.md)
- Proper reference material for authentication patterns
- No conflicts with auth principle

**VII. Documentation Maintenance Protocol**: ✅ ENFORCED  
- Feature implements the documentation maintenance protocol (core-concepts/10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md)
- Adds enforcement mechanisms (breadcrumbs, links, navigation meta-guide)
- Supports long-term documentation quality

**Overall Status**: ✅ **READY FOR PHASE 1** - All constitutional gates pass, no conflicts detected.

## Project Structure

### Documentation (this feature)

```
specs/001-specify-scripts-bash/
├── spec.md              # Feature specification (5 stories, 10 FR, 10 SC, 4 edge cases)
├── plan.md              # This file (Phase 0 & 1 planning - OUTPUT OF PHASE 0)
├── research.md          # Phase 0 research findings (all unknowns resolved)
├── data-model.md        # Phase 1 output: Documentation structure entities
├── quickstart.md        # Phase 1 output: Implementation quick reference
├── contracts/           # Phase 1 output: Documentation structure contracts/schemas
│   ├── documentation-hierarchy.md
│   ├── breadcrumb-format.md
│   └── link-conventions.md
└── tasks.md             # Phase 2 output (generated by /speckit.tasks command)
```

### Source Code (documentation reorganization)

```
docs/
├── README.md                                    # Hub: Main documentation entry point
├── NAVIGATION.md                                # NEW: Meta-guide for documentation structure
├── core-concepts/                               # ✅ EXISTS: 12 core concept files + README
│   ├── README.md                                # ✅ EXISTS: Governance hub (updated in Phase 1)
│   ├── 00-EFFICIENT-EXECUTION-PROTOCOL.md      # ✅ EXISTS
│   ├── 01-DOCUMENTATION-FIRST-WORKFLOW.md      # ✅ EXISTS
│   ├── 02-SERVICE-ADAPTER-PATTERN.md           # ✅ EXISTS
│   ├── 03-REPOSITORY-OWNERSHIP-RULE.md         # ✅ EXISTS
│   ├── 04-CORE-VS-FEATURE-ARCHITECTURE.md      # ✅ EXISTS
│   ├── 05-TYPE-MANIPULATION-PATTERN.md         # ✅ EXISTS
│   ├── 06-README-FIRST-DOCUMENTATION-DISCOVERY.md # ✅ EXISTS
│   ├── 07-BETTER-AUTH-INTEGRATION.md           # ✅ EXISTS
│   ├── 08-FILE-MANAGEMENT-POLICY.md            # ✅ EXISTS
│   ├── 09-ORPC-IMPLEMENTATION-PATTERN.md       # ✅ EXISTS
│   ├── 10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md # ✅ EXISTS
│   └── COPILOT-WORKFLOW-DIAGRAM.md             # ✅ EXISTS
├── guides/                                      # NEW: Step-by-step how-to documentation
│   ├── GETTING-STARTED.md                       # Move from root
│   ├── DEVELOPMENT-WORKFLOW.md                  # Move from root
│   ├── PRODUCTION-DEPLOYMENT.md                 # Move from root
│   ├── RENDER-DEPLOYMENT.md                     # Move from root
│   ├── DOCKER-BUILD-STRATEGIES.md               # Move from root
│   ├── MEMORY-OPTIMIZATION.md                   # Move from root
│   └── README.md                                # NEW: Guide index
├── features/                                    # NEW: Feature-specific documentation
│   ├── ORPC-TYPE-CONTRACTS.md                   # Move from root
│   ├── ENVIRONMENT-TEMPLATE-SYSTEM.md           # Move from root
│   ├── TESTING.md                               # Move from root
│   ├── COPILOT-SETUP.md                         # Move from root
│   └── README.md                                # NEW: Features index
├── planning/                                    # NEW: Planning and specification docs
│   ├── PROJECT-ISOLATION.md                     # Move from root
│   ├── PROJECT-ISOLATION-IMPLEMENTATION.md      # Move from root
│   └── README.md                                # NEW: Planning index
├── reference/                                   # NEW: Lookup and reference materials
│   ├── TECH-STACK.md                            # Move from root
│   ├── ARCHITECTURE.md                          # Move from root
│   ├── GLOSSARY.md                              # Move from root
│   ├── DOCKER-MIGRATION-SUMMARY.md              # Move from root
│   ├── TYPESCRIPT-CACHE-SOLUTION.md             # Move from root
│   └── README.md                                # NEW: Reference index
├── deprecated/                                  # NEW: Archive for legacy documentation
│   ├── README.md                                # Archive guide
│   ├── DIRECTUS-TYPE-GENERATION.md              # Archive (no longer in use)
│   ├── TESTING-IMPLEMENTATION-SUMMARY.md        # Archive (replaced by TESTING.md)
│   ├── TESTING-SUCCESS-SUMMARY.md               # Archive (historical)
│   ├── DOCKER-FILE-OWNERSHIP-FIX.md             # Archive (reference)
│   ├── DOCKER-STORAGE-MANAGEMENT.md             # Archive (reference)
│   └── MCP-ENHANCEMENTS-IDEA.md                 # Archive (planning)
├── concepts/                                    # EXISTING: Keep as is (may be consolidated)
└── core-concepts/                               # ✅ EXISTING: Already complete

.github/
└── copilot-instructions.md                      # MODIFY: Add explicit reference to core-concepts/README.md
```

**Structure Decision**: 
This feature implements a hub-based architecture where:
1. **Core Concepts** (`docs/core-concepts/`) serve as mandatory reference material for all patterns
2. **Guides** provide step-by-step how-to documentation organized by topic
3. **Features** contain feature-specific implementation details and guides
4. **Planning** collects planning docs and specification materials
5. **Reference** provides lookup tables, architecture overviews, and glossaries
6. **Deprecated** archives legacy documentation no longer actively maintained

The `.github/copilot-instructions.md` file explicitly delegates to `docs/core-concepts/README.md` as the single source of truth, preventing duplication and enabling consistent behavior across all AI agents and developers.

## Complexity Tracking

*No violations of project constitution. All 7 core principles pass the constitutional gate check.*

| Item | Notes |
|------|-------|
| **Backward Compatibility** | No breaking changes; all existing links remain valid through redirects and cross-references |
| **Duplication Prevention** | Core-concept rules appear only in `/docs/core-concepts/`; copilot-instructions.md delegates to this single source |
| **LLM Compatibility** | Documentation structure uses relative paths and clear link syntax compatible with document loaders |
| **Maintenance Responsibility** | Already defined in core-concepts/10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md |



