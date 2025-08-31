# AGENTS.md — apps/doc (Docs Site)

Follow the root `AGENTS.md` first. This file adds Docs-specific guidance.

## Scope Rules

- This app renders documentation content from `apps/doc/content` and `docs/`.
- Keep content DRY; prefer linking to `docs/*.md` over duplicating.

## Quick Context via MCP

- Inspect this app:
  - `repo://app/doc/package.json`
  - `repo://app/doc/dependencies`

## Workflows

Development:
- Prefer MCP: `docker-up { mode: "dev", target: "web" }` if docs stack shares web infra
- Legacy: `bun run dev:doc` — start docs site

Content sources:
- Many pages mirror files in `docs/` with short summaries; ensure link references are correct.

## Boundaries

- Do not invent documentation—derive from actual repo state and update the canonical files under `docs/`.
