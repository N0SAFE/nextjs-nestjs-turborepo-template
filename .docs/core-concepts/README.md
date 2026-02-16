# Core Concepts

> **Last Updated**: 2026-02-13  
> **Status**: 🔴 MANDATORY - MUST BE FOLLOWED AT ALL TIMES

## Overview

This directory contains the **CORE CONCEPTS** of this project - the fundamental architectural patterns, development processes, and rules that MUST be followed for ALL development work.

**⚠️ THESE CORE CONCEPTS ARE THE ONLY SOURCE OF TRUTH**

## Critical Rules

### 1. Be Aware of Core Concepts and Read What's Needed

AI assistants MUST:
1. **Know that `.docs/core-concepts/` exists** and contains fundamental patterns
2. **Read `.docs/core-concepts/README.md`** (this file) to see what concepts exist
3. **Read relevant core concept files** for the current task
4. **Don't re-read familiar concepts** you've already applied successfully

**Documentation Discovery Hierarchy**:
```
.docs/README.md (central navigation hub)
    ↓
.docs/core-concepts/README.md (index of fundamental patterns)
    ↓
Identify which concepts apply to your task
    ↓
Read ONLY the relevant core concept files
    ↓
Navigate to task-specific guides as needed
    ↓
Check feature/reference docs for details
```

**Key Principle**: Be aware of what documentation exists, read what you need when you need it.

**See**: [06-README-FIRST-DOCUMENTATION-DISCOVERY.md](./06-README-FIRST-DOCUMENTATION-DISCOVERY.md) for complete documentation discovery pattern.

### 2. Check Before Creating New Core Concepts

When learning or being requested to create a new core concept:

1. **Search existing core concepts** - Check if another file already handles this
2. **Update existing files** if the concept fits in an existing category
3. **Create new file only** if it's truly a new fundamental concept
4. **Split logically** - Organize concepts into clear, focused files

### 3. Never Bypass Core Concepts

These concepts are **MANDATORY** and **NON-NEGOTIABLE**:
- They define how this project works
- They ensure consistency across the codebase
- They prevent architectural violations

**Exception**: User explicitly overrides with direct instruction.

### 4. Request User Approval for Conflicts

If a user request conflicts with a core concept:

1. **Stop immediately**
2. **Explain the conflict** - Which core concept is violated?
3. **Show proposed changes** - What would need to change in the core concept?
4. **Wait for approval** before proceeding

**Example:**
```
⚠️ Core concept conflict detected:

Your request suggests accessing DatabaseService directly in the controller.
This violates: .docs/core-concepts/02-SERVICE-ADAPTER-PATTERN.md

The core concept requires:
- Controllers use Service layer
- Services use Repository layer
- Repositories access DatabaseService

Options:
1. Implement using Service-Adapter pattern (recommended)
2. Update core concept to allow direct database access (requires your approval)

How would you like to proceed?
```

## Core Concepts Index

### 🎯 Process & Workflow

| File | Concept | Priority | Description |
|------|---------|----------|-------------|
| [00-EFFICIENT-EXECUTION-PROTOCOL.md](./00-EFFICIENT-EXECUTION-PROTOCOL.md) | Efficient Execution | 🔴 CRITICAL | Silent context gathering, action-oriented execution |
| [01-DOCUMENTATION-FIRST-WORKFLOW.md](./01-DOCUMENTATION-FIRST-WORKFLOW.md) | Documentation-First | 🔴 CRITICAL | Read docs before implementing, mandatory workflow |
| [06-README-FIRST-DOCUMENTATION-DISCOVERY.md](./06-README-FIRST-DOCUMENTATION-DISCOVERY.md) | README-First Discovery | 🔴 CRITICAL | Always read docs/README.md first, navigate via structure |
| [08-FILE-MANAGEMENT-POLICY.md](./08-FILE-MANAGEMENT-POLICY.md) | File Management | 🔴 CRITICAL | Never delete files without permission |
| [10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md](./10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md) | Documentation Maintenance | 🔴 CRITICAL | Update parent README, validate links, maintain structure |

### 🏗️ Architecture Patterns

| File | Concept | Priority | Description |
|------|---------|----------|-------------|
| [02-SERVICE-ADAPTER-PATTERN.md](./02-SERVICE-ADAPTER-PATTERN.md) | Service-Adapter | 🔴 CRITICAL | Three-layer architecture: Repository → Service → Adapter |
| [03-REPOSITORY-OWNERSHIP-RULE.md](./03-REPOSITORY-OWNERSHIP-RULE.md) | Repository Ownership | 🔴 CRITICAL | Repositories owned by domain services only |
| [04-CORE-VS-FEATURE-ARCHITECTURE.md](./04-CORE-VS-FEATURE-ARCHITECTURE.md) | Core vs Feature | 🔴 CRITICAL | Module organization rules |

### 🔧 Type System & Auth

| File | Concept | Priority | Description |
|------|---------|----------|-------------|
| [05-TYPE-MANIPULATION-PATTERN.md](./05-TYPE-MANIPULATION-PATTERN.md) | Type Manipulation | 🟡 IMPORTANT | Prefer inference over manual definitions |
| [07-BETTER-AUTH-INTEGRATION.md](./07-BETTER-AUTH-INTEGRATION.md) | Better Auth | 🔴 CRITICAL | Use AuthService.api for all auth operations |
| [09-ORPC-IMPLEMENTATION-PATTERN.md](./09-ORPC-IMPLEMENTATION-PATTERN.md) | ORPC API Pattern | 🔴 CRITICAL | Type-safe API contracts with end-to-end safety |
| [11-ORPC-CLIENT-HOOKS-PATTERN.md](./11-ORPC-CLIENT-HOOKS-PATTERN.md) | ORPC Client Hooks | 🔴 CRITICAL | Consume ORPC in components via dedicated hooks layer |

## How to Use This System

### For AI Assistants

1. **At conversation start**: Check `.docs/README.md` and `.docs/core-concepts/README.md` to know what's available
2. **Before each task**: Identify which core concepts apply and read them
3. **When implementing**: Use patterns from relevant core concepts
4. **When uncertain**: Read the specific core concept or guide you need
5. **When learning new patterns**: Check if should be added as core concept
6. **When user requests conflict**: Request approval to update core concept
7. **Don't re-read**: Skip documentation for patterns you're already familiar with

### For Developers

1. **Read all core concepts** before contributing
2. **Follow patterns strictly** unless explicitly overriding
3. **Propose new core concepts** when discovering fundamental patterns
4. **Update core concepts** when patterns evolve

## Creating New Core Concepts

### When to Create

A new core concept should be created when:
- Pattern is **fundamental** to project architecture
- Violation causes **serious problems** (bugs, security, maintainability)
- Pattern is used **across multiple modules/features**
- Pattern must be **followed strictly** (not just a recommendation)

### Naming Convention

```
##-CONCEPT-NAME.md

Where ## is the next sequential number
```

### Required Sections

```markdown
# Concept Name

> **Type**: Core Concept - [Category]
> **Priority**: 🔴 CRITICAL / 🟡 IMPORTANT
> **Last Updated**: YYYY-MM-DD

## Overview
Brief description

## Core Principle
The fundamental rule

## Examples
✅ CORRECT and ❌ WRONG examples

## Enforcement
How strictly this must be followed

## Related Core Concepts
Links to related concepts
```

### Process

1. **Silently check** if concept already exists in another file
2. **Create file** following naming convention and template
3. **Update this README.md** - Add to index table
4. **Update copilot-instructions.md** - Add reference
5. **Test** - Ensure no broken links

## Enforcement Levels

- 🔴 **CRITICAL**: MUST be followed at all times, violations are architectural errors
- 🟡 **IMPORTANT**: SHOULD be followed unless specific reason not to

## Relationship to Other Documentation

```
docs/
├── core-concepts/          ← YOU ARE HERE (Source of Truth)
│   ├── README.md
│   ├── 00-EFFICIENT-EXECUTION-PROTOCOL.md
│   ├── 01-DOCUMENTATION-FIRST-WORKFLOW.md
│   └── ...
├── concepts/               ← Detailed explanations & examples
│   ├── SERVICE-ADAPTER-PATTERN.md (2000+ lines of examples)
│   └── ...
├── architecture/           ← System design & component relationships
└── specifications/         ← Feature specifications
```

**Core concepts = Fundamental rules (what MUST be done)**
**Other docs = Detailed specifications (how to do it)**

## Version History

| Date | Change | Author |
|------|--------|--------|
| 2025-10-14 | Created core concepts system | AI Assistant |
| 2025-10-14 | Migrated 8 core concepts from copilot-instructions.md | AI Assistant |
| 2025-10-14 | Added 10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md | AI Assistant |

## Questions?

If unclear about:
- **Whether something is a core concept**: Ask in the project
- **How to implement a pattern**: Check detailed docs in `.docs/concepts/` and `.docs/reference/`
- **Conflict with core concept**: Request user approval before proceeding
