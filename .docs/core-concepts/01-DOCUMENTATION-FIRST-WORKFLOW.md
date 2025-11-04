📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > Documentation-First Workflow

# Documentation-First Workflow

> **Type**: Core Concept - Development Process  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-14

## Overview

This is the **MOST IMPORTANT** rule for this project. You MUST follow this workflow for EVERY task.

## Core Principle

**⚠️ BE AWARE OF DOCUMENTATION AND READ WHAT'S NEEDED**

Before writing ANY code or making ANY changes, check if relevant documentation exists and read it **WITHOUT announcement**.

## Step 1: Know What Documentation Exists

**First time or when uncertain**, understand the documentation structure:

1. `.docs/README.md` - Central navigation hub for all documentation
2. `.docs/core-concepts/README.md` - Index of fundamental patterns and rules
3. `.docs/guides/` - Setup, workflows, deployment guides
4. `.docs/features/` - Feature-specific documentation
5. `.docs/reference/` - Architecture, tech stack references

## Step 2: Read Relevant Documentation Silently

**For each task**, identify and read (no announcements):

### Always Check These First

1. **`.docs/README.md`** - Quick reference to find what you need
2. **`.docs/core-concepts/README.md`** - See if any core concepts apply to your task
3. **Relevant core concept files** - Read ONLY the ones that apply to your current task

### Task-Specific Documentation

**For API Development:**
- `.docs/core-concepts/02-SERVICE-ADAPTER-PATTERN.md`
- `.docs/core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md`
- `.docs/features/ORPC-TYPE-CONTRACTS.md`

**For Frontend Development:**
- `.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md`
- `apps/web/src/routes/README.md`
- `.docs/guides/DEVELOPMENT-WORKFLOW.md`

**For Database Work:**
- `.docs/guides/DEVELOPMENT-WORKFLOW.md` (Database Operations section)

**For Deployment/Docker:**
- `.docs/guides/DOCKER-BUILD-STRATEGIES.md`
- `.docs/guides/PRODUCTION-DEPLOYMENT.md`

### DON'T Read Everything Every Time

- If you know the Service-Adapter pattern, don't re-read it
- If you've implemented ORPC hooks before, you remember the pattern
- Only re-read when uncertain or encountering a new variation

## Step 3: Workflow for Every Task

```
┌─────────────────────────────────────────────┐
│ 1. User Request Received                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. Identify What Documentation You Need     │
│    - What type of task? (API/Frontend/DB)   │
│    - Check .docs/README.md for relevant docs│
│    - Check core-concepts index              │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. Silently Read ONLY Relevant Docs         │
│    - Read applicable core concepts          │
│    - Read task-specific guides              │
│    - Skip familiar patterns you know        │
│    (NO announcements about reading)         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 4. Verify Understanding Internally          │
│    - Correct pattern?                       │
│    - Correct folder structure?              │
│    - Dependencies clear?                    │
│    - Conflicts with core concepts?          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 5. Check for Core Concept Conflicts         │
│    - Does request violate core concept?     │
│    - If yes: Request user approval          │
│    - Show what would change                 │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 6. Implement Immediately                    │
│    - Use exact patterns from docs           │
│    - No explanations for standard work      │
│    - Only explain critical decisions        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 7. Show Completed Work                      │
│    - Present results                        │
│    - Update docs if needed                  │
└─────────────────────────────────────────────┘
```

## Examples

### ✅ CORRECT: Silent Action

```
User: "Create a new user service"

[Checks: This is API work, I need Service-Adapter pattern]
[Silently reads: .docs/core-concepts/02-SERVICE-ADAPTER-PATTERN.md]
[Already familiar with core-vs-feature rules, skips re-reading]
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

## Documentation Awareness Checklist

Internal verification (do not announce):

- [ ] Checked `.docs/README.md` to know what's available
- [ ] Reviewed `.docs/core-concepts/README.md` index
- [ ] Identified which core concepts apply to this task
- [ ] Read ONLY the relevant core concept files
- [ ] Identified task-specific guides (API/frontend/deployment/etc.)
- [ ] Read applicable guides and features docs
- [ ] Understand patterns needed for task
- [ ] No conflicts with core concepts
- [ ] Ready to implement

**If uncertain about a pattern, read the specific documentation for it.**

**Don't re-read documentation you're already familiar with.**

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
