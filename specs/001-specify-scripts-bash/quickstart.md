# Quickstart: Documentation Restructuring Implementation

**Phase**: Phase 1 Design (Quick Reference)  
**Date**: 2025-10-16  
**Purpose**: Fast, actionable reference for implementing documentation restructuring

---

## Feature Summary

Restructure `/docs` folder into 5 categories (Core Concepts, Guides, Features, Planning, Reference) with hub-based architecture. Update `.github/copilot-instructions.md` to delegate to `docs/core-concepts/README.md` as single source of truth.

---

## Key Deliverables

| Item | Type | Count | Status |
|------|------|-------|--------|
| Core Concepts | Files | 12 + README | ✅ Exist |
| Guides | Directory | 6 files | Create |
| Features | Directory | 4 files | Create |
| Planning | Directory | 2 files | Create |
| Reference | Directory | 5+ files | Create |
| Deprecated | Directory | 7 files | Archive |
| Navigation Guide | New File | 1 | Create |
| Copilot Instructions | Modification | 1 | Update |
| Breadcrumbs | Additions | 28+ files | Add |
| Cross-References | Additions | 80+ links | Add |

---

## Implementation Roadmap

### Phase 1a: Directory Setup (1-2 hours)
```bash
# Create directories
mkdir -p docs/guides
mkdir -p docs/features
mkdir -p docs/planning
mkdir -p docs/reference
mkdir -p docs/deprecated

# Create index files for each
touch docs/guides/README.md
touch docs/features/README.md
touch docs/planning/README.md
touch docs/reference/README.md
touch docs/deprecated/README.md
```

### Phase 1b: Reorganize Existing Docs (2-3 hours)

**Move to guides/**:
- GETTING-STARTED.md
- DEVELOPMENT-WORKFLOW.md
- PRODUCTION-DEPLOYMENT.md
- RENDER-DEPLOYMENT.md
- DOCKER-BUILD-STRATEGIES.md
- MEMORY-OPTIMIZATION.md

**Move to features/**:
- ORPC-TYPE-CONTRACTS.md
- ENVIRONMENT-TEMPLATE-SYSTEM.md
- TESTING.md
- COPILOT-SETUP.md

**Move to planning/**:
- PROJECT-ISOLATION.md
- PROJECT-ISOLATION-IMPLEMENTATION.md

**Move to reference/**:
- TECH-STACK.md
- ARCHITECTURE.md
- GLOSSARY.md
- DOCKER-MIGRATION-SUMMARY.md
- TYPESCRIPT-CACHE-SOLUTION.md

**Move to deprecated/**:
- DIRECTUS-TYPE-GENERATION.md
- TESTING-IMPLEMENTATION-SUMMARY.md
- TESTING-SUCCESS-SUMMARY.md
- DOCKER-FILE-OWNERSHIP-FIX.md
- DOCKER-STORAGE-MANAGEMENT.md
- MCP-ENHANCEMENTS-IDEA.md

### Phase 1c: Create Hub Files (2-3 hours)

**Create docs/NAVIGATION.md**:
- Meta-guide explaining documentation structure
- How to navigate by use case
- Where to add new documentation
- Directory structure diagram

**Update .github/copilot-instructions.md**:
- Add prominent section: "MANDATORY FIRST STEP"
- Add explicit instruction: "Always read docs/core-concepts/README.md"
- Replace duplicated rules with reference to core-concepts
- Keep only governance-level intro

**Create category README files**:
- guides/README.md - Guide index with descriptions
- features/README.md - Feature docs index
- planning/README.md - Planning docs index
- reference/README.md - Reference materials index
- deprecated/README.md - Archive with deprecation notes

### Phase 1d: Add Breadcrumbs & Links (3-4 hours)

**Breadcrumb format**:
```markdown
📍 [Documentation Hub](../../README.md) > [Category](./README.md) > Current File
```

**Add to all active files**:
- 12 core-concepts files (already have structure)
- 6 guides files
- 4 features files
- 5 reference files
- 2 planning files

**Add cross-references**:
- 45 links within core-concepts
- 22 links from guides to concepts/examples
- 12 links from features to concepts
- 6 links from reference to guides

### Phase 1e: Link Validation (1-2 hours)

```bash
# Validate all links
npm run linkcheck

# Fix fixable broken links
npm run linkcheck:fix

# Generate link report
npm run linkcheck:report
```

---

## Quick Reference: Directory Structure

```
docs/
├── README.md                              # Main hub (entry point)
├── NAVIGATION.md                          # Meta-guide (NEW)
├── core-concepts/                         # ✅ Exists - 12 patterns
│   ├── README.md                          # ✅ Governance hub
│   ├── 00-EFFICIENT-EXECUTION-PROTOCOL.md
│   ├── 01-DOCUMENTATION-FIRST-WORKFLOW.md
│   ├── 02-SERVICE-ADAPTER-PATTERN.md
│   ├── 03-REPOSITORY-OWNERSHIP-RULE.md
│   ├── 04-CORE-VS-FEATURE-ARCHITECTURE.md
│   ├── 05-TYPE-MANIPULATION-PATTERN.md
│   ├── 06-README-FIRST-DOCUMENTATION-DISCOVERY.md
│   ├── 07-BETTER-AUTH-INTEGRATION.md
│   ├── 08-FILE-MANAGEMENT-POLICY.md
│   ├── 09-ORPC-IMPLEMENTATION-PATTERN.md
│   ├── 10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md
│   └── COPILOT-WORKFLOW-DIAGRAM.md
├── guides/                                # NEW - How-to docs
│   ├── README.md                          # NEW - Guide index
│   ├── GETTING-STARTED.md                 # Move
│   ├── DEVELOPMENT-WORKFLOW.md            # Move
│   ├── PRODUCTION-DEPLOYMENT.md           # Move
│   ├── RENDER-DEPLOYMENT.md               # Move
│   ├── DOCKER-BUILD-STRATEGIES.md         # Move
│   └── MEMORY-OPTIMIZATION.md             # Move
├── features/                              # NEW - Feature-specific
│   ├── README.md                          # NEW - Feature index
│   ├── ORPC-TYPE-CONTRACTS.md             # Move
│   ├── ENVIRONMENT-TEMPLATE-SYSTEM.md     # Move
│   ├── TESTING.md                         # Move
│   └── COPILOT-SETUP.md                   # Move
├── planning/                              # NEW - Planning docs
│   ├── README.md                          # NEW - Planning index
│   ├── PROJECT-ISOLATION.md               # Move
│   └── PROJECT-ISOLATION-IMPLEMENTATION.md # Move
├── reference/                             # NEW - Reference materials
│   ├── README.md                          # NEW - Reference index
│   ├── TECH-STACK.md                      # Move
│   ├── ARCHITECTURE.md                    # Move
│   ├── GLOSSARY.md                        # Move
│   ├── DOCKER-MIGRATION-SUMMARY.md        # Move
│   └── TYPESCRIPT-CACHE-SOLUTION.md       # Move
└── deprecated/                            # NEW - Archive
    ├── README.md                          # NEW - Archive guide
    ├── DIRECTUS-TYPE-GENERATION.md        # Archive
    ├── TESTING-IMPLEMENTATION-SUMMARY.md  # Archive
    ├── TESTING-SUCCESS-SUMMARY.md         # Archive
    ├── DOCKER-FILE-OWNERSHIP-FIX.md       # Archive
    ├── DOCKER-STORAGE-MANAGEMENT.md       # Archive
    └── MCP-ENHANCEMENTS-IDEA.md           # Archive
```

---

## Validation Checklist

Before committing Phase 1 changes:

- [ ] All 5 category directories created
- [ ] All existing docs moved to appropriate categories
- [ ] Deprecated docs moved to deprecated/ with notices
- [ ] All 5 category README files created with indices
- [ ] docs/NAVIGATION.md created with meta-guide
- [ ] .github/copilot-instructions.md updated with hub reference
- [ ] Breadcrumbs added to 28+ files
- [ ] Cross-references validated (zero broken links)
- [ ] Link checker runs successfully
- [ ] Average nav depth ≤ 3 clicks
- [ ] 90%+ of files have breadcrumbs
- [ ] Copilot-instructions.md delegates to core-concepts/README.md

---

## Success Criteria

✅ **SC-001**: copilot-instructions.md has explicit hub reference (no duplicate rules)  
✅ **SC-002**: core-concepts/README.md lists all 12 concepts with mandatory flags  
✅ **SC-003**: 100% of core concepts listed and linked in hub  
✅ **SC-004**: All documentation files have bidirectional links  
✅ **SC-005**: Average nav depth ≤ 3 clicks  
✅ **SC-006**: NAVIGATION.md explains structure (< 10 min read)  
✅ **SC-007**: Zero broken internal links  
✅ **SC-008**: 90%+ of legacy docs archived or reorganized  
✅ **SC-009**: docs/README.md provides reading order (< 1 hour understanding)  
✅ **SC-010**: Each concept states how it's enforced  

---

## Time Estimates

| Phase | Activity | Duration | Parallel |
|-------|----------|----------|----------|
| 1a | Create directories | 1-2 hrs | Solo |
| 1b | Reorganize docs | 2-3 hrs | Solo |
| 1c | Create hub files | 2-3 hrs | Solo |
| 1d | Add breadcrumbs/links | 3-4 hrs | Parallelizable by category |
| 1e | Link validation | 1-2 hrs | Solo |
| **Total** | | **9-14 hours** | |

---

## Git Workflow

### Branch
```bash
git checkout 001-specify-scripts-bash
```

### Commits (organized)
```bash
# 1. Create directories
git add docs/{guides,features,planning,reference,deprecated}
git commit -m "chore(docsRestructure): Create documentation category directories"

# 2. Move and reorganize docs
git add docs/
git commit -m "chore(docsRestructure): Reorganize documentation into categories"

# 3. Create hub files and navigation
git add docs/NAVIGATION.md docs/guides/README.md docs/features/README.md ...
git commit -m "feat(docsRestructure): Add documentation hub and category indices"

# 4. Update copilot instructions
git add .github/copilot-instructions.md
git commit -m "feat(docsRestructure): Update copilot-instructions.md to reference core-concepts hub"

# 5. Add breadcrumbs and links
git add docs/
git commit -m "feat(docsRestructure): Add breadcrumbs and cross-references to all documentation"
```

---

## Common Tasks

### Task: Add a new documentation file

1. Determine category (core-concept, guide, feature, planning, reference)
2. Create file in appropriate directory
3. Add breadcrumb at top using EMOJI_SEPARATOR format
4. Add link from category README
5. Add cross-references from related files
6. Run `npm run linkcheck` to validate
7. Commit with feature branch

### Task: Move existing file to new location

1. Move file to new directory: `git mv docs/OLD.md docs/category/OLD.md`
2. Update all cross-references pointing to old path
3. Add breadcrumb to file
4. Update category README indices
5. Run `npm run linkcheck` to find broken links
6. Fix broken link references
7. Commit move

### Task: Archive a deprecated document

1. Move to deprecated/: `git mv docs/OLD.md docs/deprecated/OLD.md`
2. Add deprecation notice at top of file
3. Add note to deprecated/README.md with reason
4. Update .github/copilot-instructions.md if it was referenced
5. Fix any links pointing to deprecated file (point to replacement)
6. Run link checker
7. Commit archival

---

## Related Documentation

- **Data Model**: `data-model.md` - Entity definitions
- **Breadcrumb Format**: `contracts/breadcrumb-format.md` - Breadcrumb specs
- **Link Conventions**: `contracts/link-conventions.md` - Link standards
- **Feature Spec**: `spec.md` - Full feature requirements
- **Research**: `research.md` - Phase 0 unknowns resolved
- **Implementation Plan**: `plan.md` - Overall planning

---

## Next Steps After Phase 1

1. Generate Phase 2 tasks via `/speckit.tasks`
2. Execute implementation tasks
3. Run full documentation validation
4. Deploy to GitHub and Fumadocs
5. Update agent context for Copilot

