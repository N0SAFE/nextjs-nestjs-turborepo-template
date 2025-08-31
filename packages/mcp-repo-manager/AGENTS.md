# AGENTS.md — @repo/mcp-repo-manager

NestJS-based MCP server exposing tools/resources/prompts to manage this repo.

## Usage
- Development with Inspector: see `README.md` in this package.
- Primary resources: `repo://summary`, `repo://apps`, `repo://packages`, `repo://graph/*`.
- Primary tools: listing, creation, dependency management, scripts, versioning.
 - New tools: `api-db`, `auth-generate`, `ui-add`, `docker-up`, `docker-build`, `repo://changes`, `repo://diff-summary/{path}`, `repo://commit/plan`.

## Rules
- Keep Zod v3 compatibility. Internal imports should use `.js` extensions after build (ESM).
- Update the package README when adding tools/resources/prompts.
 - On tool errors, immediately attempt corrective action and retry (see root AGENTS.md rule 6).
