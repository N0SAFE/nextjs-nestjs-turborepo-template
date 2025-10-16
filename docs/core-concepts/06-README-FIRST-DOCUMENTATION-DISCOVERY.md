📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > Core Concept 06: README-First Documentation Discovery

# Core Concept 06: README-First Documentation Discovery

**Category**: Documentation & Knowledge Management  
**Status**: Mandatory  
**Related Concepts**: 00-FILE-MANAGEMENT-POLICY

---

## Overview

Documentation discovery in this project follows a **hierarchical README-first pattern**. Never dive directly into individual files. Always start with the main README, navigate through the structure, and use subdirectory READMEs as your guide to deeper content.

This pattern ensures efficient context gathering, prevents missing critical information, and maintains a clear understanding of documentation relationships.

---

## Core Principle

**The Documentation Hierarchy**:
```
docs/README.md (START HERE)
    ↓
Subdirectory READMEs (concepts/, architecture/, features/, etc.)
    ↓
Individual documentation files
    ↓
Code files (only after understanding documentation)
```

**ALWAYS follow this order**. Never skip levels in the hierarchy.

---

## Implementation Rules

### 1. **Always Start with docs/README.md**

**At the start of EVERY conversation or task:**
- Read `docs/README.md` first (no exceptions)
- Understand the documentation structure and organization
- Identify which subdirectory is relevant to your task
- Note the navigation pattern before proceeding

**DO NOT:**
- ❌ Jump directly to specific files based on assumptions
- ❌ Search for files without understanding the structure first
- ❌ Read individual files before checking the README hierarchy

### 2. **Navigate via Subdirectory READMEs**

**When you identify a relevant subdirectory:**
- Read its README.md file (e.g., `docs/concepts/README.md`)
- Understand the topic organization within that directory
- Identify which specific files you need
- Follow references to related documentation

**Pattern:**
```bash
# 1. Main hub
docs/README.md

# 2. Subdirectory index
docs/concepts/README.md
docs/architecture/README.md
docs/features/README.md
docs/specifications/README.md

# 3. Individual files (only after steps 1 & 2)
docs/concepts/SERVICE-ADAPTER-PATTERN.md
docs/architecture/CORE-VS-FEATURE-ARCHITECTURE.md
# ... etc
```

### 3. **Read Individual Files Only When Directed**

**After consulting READMEs:**
- Read individual files that the README specifically points to
- Understand the context before diving into details
- Follow cross-references methodically
- Keep the documentation hierarchy in mind

**Example Workflow:**
```
Task: "Understand the service-adapter pattern"

✅ CORRECT:
1. Read docs/README.md → Find "Core Concepts" section
2. Read docs/core-concepts/README.md → Find concept 01
3. Read docs/core-concepts/01-SERVICE-ADAPTER-PATTERN.md → Deep dive

❌ WRONG:
1. Search for "service adapter" 
2. Read first file found
3. Miss related context and critical requirements
```

### 4. **Use Batch Reading for Efficiency**

**When you know the path from READMEs:**
- Read multiple related files in parallel
- Group by logical sections (all core concepts, all architecture docs, etc.)
- Maintain hierarchy order (README first, then parallel reads)

**Example:**
```typescript
// After reading docs/README.md and docs/core-concepts/README.md:
Promise.all([
  readFile('docs/core-concepts/01-SERVICE-ADAPTER-PATTERN.md'),
  readFile('docs/core-concepts/02-CORE-MODULE-SHARED-LOGIC.md'),
  readFile('docs/core-concepts/03-TYPE-MANIPULATION-PATTERNS.md'),
])
```

---

## Enforcement

### ⚠️ Violations

**STOP and correct if you find yourself:**
- Reading code files before documentation
- Searching for specific files without checking READMEs first
- Skipping the main docs/README.md at conversation start
- Assuming file locations without verifying structure
- Jumping to conclusions based on file names alone

### ✅ Correct Approach Verification

Before implementing any task, verify:
- [ ] Read `docs/README.md` (main documentation hub)
- [ ] Read `docs/core-concepts/README.md` (mandatory patterns)
- [ ] Navigate to relevant subdirectories via README structure
- [ ] Check subdirectory READMEs for specific topics
- [ ] Read individual files as needed for deep understanding
- [ ] Understand patterns for task
- [ ] Ready to implement

**If checklist incomplete → Read more documentation silently**

---

## Examples

### Example 1: New API Endpoint Task

**Request**: "Create a new user management API endpoint"

**README-First Approach:**
```
1. Read docs/README.md
   → Find "Development Workflows" and "Core Concepts" sections

2. Read docs/core-concepts/README.md
   → Identify: 01-SERVICE-ADAPTER-PATTERN, 04-ORPC-CONTROLLER-IMPLEMENTATION

3. Read relevant core concepts in parallel:
   - docs/core-concepts/01-SERVICE-ADAPTER-PATTERN.md
   - docs/core-concepts/04-ORPC-CONTROLLER-IMPLEMENTATION.md

4. Check docs/specifications/README.md (if exists)
   → Find API specification templates

5. NOW implement following documented patterns
```

### Example 2: Frontend Component Task

**Request**: "Add a new dashboard widget"

**README-First Approach:**
```
1. Read docs/README.md
   → Find "Frontend Development" section

2. Read docs/concepts/README.md (if exists)
   → Find FRONTEND-DEVELOPMENT-PATTERNS.md reference

3. Read docs/concepts/FRONTEND-DEVELOPMENT-PATTERNS.md
   → Understand component structure, atomic design

4. Check docs/features/README.md
   → Find dashboard-related feature documentation

5. Read specific dashboard docs if available

6. NOW implement following documented patterns
```

### Example 3: Documentation Discovery Task

**Request**: "Understand the deployment process"

**README-First Approach:**
```
1. Read docs/README.md
   → Find "Docker & Deployment" section

2. Read docs/guides/README.md (if exists)
   → Find deployment guide references

3. Read deployment-specific docs:
   - docs/guides/DOCKER-BUILD-STRATEGIES.md
   - docs/guides/PRODUCTION-DEPLOYMENT.md
   - docs/specifications/MULTI-DEPLOYMENT-ORCHESTRATION-SPECIFICATION.md

4. Follow cross-references in those docs

5. NOW understand full deployment workflow
```

---

## Documentation Structure Benefits

### Why README-First?

1. **Context Before Details**: Understand the big picture before diving deep
2. **Efficient Navigation**: Know exactly where to look for information
3. **Complete Knowledge**: Don't miss related documentation
4. **Relationship Understanding**: See how concepts interconnect
5. **Time Saving**: Avoid reading irrelevant files

### What READMEs Provide

- **docs/README.md**: Complete documentation map, main topics, navigation guide
- **Subdirectory READMEs**: Topic organization, file relationships, usage guidance
- **Index Files**: Quick reference tables, concept lists, cross-references

---

## Related Concepts

- **00-FILE-MANAGEMENT-POLICY.md**: Never delete files without permission (includes documentation)
- **Core Concepts System**: All core concepts must be loaded at conversation start
- **Documentation-First Workflow**: Read docs before implementing (copilot-instructions.md)

---

## Tooling Support

### Documentation Analysis Scripts

**docs/bin/check-doc-links.ts**: Analyze documentation link structure
```bash
# Check all links from main README
bun run docs/bin/check-doc-links.ts --file docs/README.md --depth 2

# Filter specific patterns
bun run docs/bin/check-doc-links.ts --file docs/README.md --filter "*.md" --depth 1
```

**docs/bin/generate-doc-diagram.ts**: Generate Mermaid visualization
```bash
# Visualize full documentation structure
bun run docs/bin/generate-doc-diagram.ts --start docs/README.md

# Limited depth for overview
bun run docs/bin/generate-doc-diagram.ts --start docs/README.md --depth 2
```

These scripts help understand documentation relationships and verify the README-first hierarchy.

---

## Summary

**Golden Rule**: 📚 **README → Subdirectory README → Individual Files → Code**

Never skip levels. Always start with `docs/README.md`. Navigate methodically through the documentation hierarchy. Understand structure before diving into details.

This pattern is **MANDATORY** and ensures efficient, complete, and contextual knowledge acquisition.
