# AGENTS.md — @repo/config-eslint

Centralized ESLint configuration for the monorepo.

## Rules
- Keep configs minimal and sharable. Avoid project-specific rules here.
- When updating rules, run lint across repo and document notable changes.
 - Prefer using MCP `run-script` to run lint tasks across targets or consult `repo://commit/plan` for sequencing.
