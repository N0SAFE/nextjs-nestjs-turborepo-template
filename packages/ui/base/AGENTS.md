# AGENTS.md — @repo/ui

Shared UI component library (Shadcn + Tailwind).

## Rules
- Components should be accessible and theme-aware.
- Avoid app-specific logic; keep components generic.
- Update Storybook/docs if present when adding components.

## Mandatory MCP Tool
- Add components via: `ui-add { components: ["button", "dialog"], flags: ["--yes"] }`
- This will call the local `ui:add` script and wire Shadcn components consistently.
