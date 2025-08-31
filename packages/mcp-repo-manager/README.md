# MCP Repo Manager

NestJS-based MCP server using `@rekog/mcp-nest` to manage this monorepo.

Tools available:
- `list-apps`
- `list-packages`
- `list-agents` → Index of all AGENTS.md files (root, apps/*, packages/*)
- `show-app-dependencies` (params: `name`)
- `show-package-dependencies` (params: `name`)
- `create-app` (params: `appName`, `template` = `none|nextjs`, optional `cliFlags`)
- `create-package` (params: `packageName`, optional `folderName`)
 - `add-dependency` (params: `targetType` = `app|package`, `targetName`, `depName`, optional `version`, optional `dev=false`, optional `install=false`)
 - `remove-dependency` (params: `targetType`, `targetName`, `depName`, optional `dev=false`, optional `install=false`)
 - `run-script` (params: `targetType`, `targetName`, `script`, optional `args[]`, optional `timeoutMs`)
 - `list-internal-dependencies` (params: `targetType`, `targetName`)
 - `delete-target` (params: `targetType`, `targetName`, `confirm=true` required)
 - `bump-version` (params: `targetType`, `targetName`, `release` = `major|minor|patch|prerelease`, optional `preid`)
 - `add-script` (params: `targetType`, `targetName`, `scriptName`, `scriptCmd`, optional `overwrite=false`)

Transport: STDIO by default.

## Resources

Direct resources:
- `repo://summary` → JSON summary of apps and packages
- `repo://apps` → List of apps
- `repo://packages` → List of packages
- `repo://agents` → JSON index of AGENTS.md files

Resource templates:
- `repo://app/{name}/dependencies` → Dependencies for an app
- `repo://package/{name}/dependencies` → Dependencies for a package
- `repo://app/{name}/package.json` → Raw app `package.json`
- `repo://package/{name}/package.json` → Raw package `package.json`
- `repo://graph/uses/{name}` → Internal deps used by target
- `repo://graph/used-by/{name}` → Internal dependents of target
- `repo://agent/{scope}` → Read AGENTS.md by scope (e.g., `root`, `apps/web`, `packages/ui`)

Example (Inspector Resources tab): read `repo://summary` to view a repo snapshot.

## Prompts

- `create-app-wizard` (args: `appName?`, `template?=none|nextjs`, `flags?[]`) → suggests a `create-app` tool call
- `add-dependency-wizard` (args: `targetType?`, `targetName?`, `depName?`, `version?`, `dev?`) → suggests an `add-dependency` call
- `version-bump-plan` (args: `targetType?`, `targetName?`, `release?`, `preid?`) → checklists + `bump-version` call

Use the Prompts tab in Inspector to fetch and run prompts.

## Development

- Build: `bun --bun --cwd=./packages/mcp-repo-manager run build`
- Dev with Inspector: `bun --bun --cwd=./packages/mcp-repo-manager run dev`
	- Then open: http://127.0.0.1:6274 (Inspector UI)
	- Proxy server runs on 127.0.0.1:6277 by default
	- Alternate (run inspector against build output): `bun --bun --cwd=./packages/mcp-repo-manager run dev:inspector` (requires prior build)

## Using as MCP server
After building, configure your MCP client with a command pointing to `node dist/main.js`.

## Notes
- `create-app` with `nextjs` template uses `bun x create-next-app@latest`.
- All paths are resolved relative to repository root.
 - Adding an internal workspace dependency writes to `package.json` directly and can optionally run `bun install` at repo root.
 - `delete-target` permanently removes directories; require `confirm=true`.
 - `run-script` executes `bun run <script>` from the target directory.
