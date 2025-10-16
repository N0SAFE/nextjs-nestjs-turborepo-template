📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > Documentation-First Workflow

# Documentation-First Workflow

> **Type**: Core Concept - Development Process  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-14

## Overview

This is the **MOST IMPORTANT** rule for this project. You MUST follow this workflow for EVERY task.

## Core Principle

**⚠️ SILENTLY READ DOCUMENTATION BEFORE IMPLEMENTATION**

Before writing ANY code, making ANY changes, or answering ANY questions, read documentation **WITHOUT announcement**.

## Step 1: Silently Read Documentation First

Read these files in parallel (no announcements):

1. `docs/README.md` - Overview of all available documentation
2. Relevant concept documentation from `docs/concepts/`
3. Relevant architecture documentation from `docs/architecture/`
4. Relevant feature documentation from `docs/features/`
5. Relevant specification from `docs/specifications/`
6. **ALL files in `docs/core-concepts/`** - These are mandatory

## Step 2: Keep Core Documentation in Memory

Load these documents at start of EVERY conversation:

### Required Core Documents (Load Silently)

1. **`docs/core-concepts/README.md`** - Core concepts index and rules
2. **All `docs/core-concepts/*.md`** - All core concept files
3. **`docs/README.md`** - Documentation hub
4. **`docs/concepts/SERVICE-ADAPTER-PATTERN.md`** - Core architectural pattern
5. **`docs/concepts/FRONTEND-DEVELOPMENT-PATTERNS.md`** - Frontend patterns
6. **`docs/architecture/CORE-VS-FEATURE-ARCHITECTURE.md`** - Module organization
7. **`docs/architecture/CORE-MODULE-ARCHITECTURE.md`** - Core module dependencies

### Specifications (Load When Relevant)

- **`docs/specifications/ENVIRONMENT-SPECIFICATION.md`** - Environment variables
- **`docs/specifications/FRONTEND-SPECIFICATION.md`** - Frontend architecture
- **`docs/specifications/MULTI-DEPLOYMENT-ORCHESTRATION-SPECIFICATION.md`** - Deployment orchestration

## Step 3: Workflow for Every Task

```
┌─────────────────────────────────────────────┐
│ 1. User Request Received                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. Silently Read ALL Required Context       │
│    - docs/core-concepts/ (ALL files)        │
│    - docs/README.md                         │
│    - Core concepts                          │
│    - Relevant features/specs                │
│    (NO announcements about reading)         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. Verify Understanding Internally          │
│    - Correct pattern?                       │
│    - Correct folder structure?              │
│    - Dependencies clear?                    │
│    - Conflicts with core concepts?          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 4. Check for Core Concept Conflicts         │
│    - Does request violate core concept?     │
│    - If yes: Request user approval          │
│    - Show what would change                 │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 5. Implement Immediately                    │
│    - Use exact patterns from docs           │
│    - No explanations for standard work      │
│    - Only explain critical decisions        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 6. Show Completed Work                      │
│    - Present results                        │
│    - Update docs if needed                  │
└─────────────────────────────────────────────┘
```

## Examples

### ✅ CORRECT: Silent Action

```
User: "Create a new user service"

[Silently reads: docs/core-concepts/, docs/README.md, SERVICE-ADAPTER-PATTERN.md, CORE-VS-FEATURE-ARCHITECTURE.md]
[Implements service following patterns]
[Shows completed implementation]
```

### ❌ WRONG: Verbose Announcements

```
User: "Create a new user service"

I'll first read the SERVICE-ADAPTER-PATTERN.md to understand the pattern,
then check CORE-VS-FEATURE-ARCHITECTURE.md to determine module placement,
and finally implement the service following the documented patterns.
```

## When Documentation is Missing or Unclear

1. **Search existing docs** silently using grep/search
2. **Batch all questions** to user in single request
3. **Document your decision** after implementing
4. **Update core concepts** if it's a new fundamental rule

**NEVER** announce you're searching documentation.

## Documentation Loading Checklist

Internal verification (do not announce):

- [ ] Read `docs/core-concepts/README.md`
- [ ] Read ALL files in `docs/core-concepts/`
- [ ] Read `docs/README.md`
- [ ] Loaded `SERVICE-ADAPTER-PATTERN.md`
- [ ] Loaded `FRONTEND-DEVELOPMENT-PATTERNS.md` (for frontend)
- [ ] Loaded `CORE-VS-FEATURE-ARCHITECTURE.md`
- [ ] Loaded `CORE-MODULE-ARCHITECTURE.md`
- [ ] Identified relevant feature/spec docs
- [ ] Understand patterns for task
- [ ] No conflicts with core concepts
- [ ] Ready to implement

**If not ready, read more documentation silently.**

## Why This Matters

This project has **specific, non-standard patterns** that you cannot infer:

- ❌ You cannot guess that adapters go in `adapters/` (not `services/`)
- ❌ You cannot guess that types go in `interfaces/` (not inline)
- ❌ You cannot guess the service-adapter-controller orchestration pattern
- ❌ You cannot guess the core vs feature module rules
- ❌ You cannot guess the circular dependency handling approach

**These patterns are ONLY documented in `docs/`**. If you don't read the docs, you WILL implement incorrectly.

## Related Core Concepts

- [Efficient Execution Protocol](./00-EFFICIENT-EXECUTION-PROTOCOL.md)
- [Service-Adapter Pattern](./02-SERVICE-ADAPTER-PATTERN.md)
- [Core Concepts System](./README.md)
