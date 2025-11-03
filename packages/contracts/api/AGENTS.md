# AGENTS.md — @repo/api-contracts

Contracts define ORPC interfaces and shared types used by API and Web.

## Quick Context via MCP
- `repo://package/@repo/api-contracts/package.json`
- `repo://package/@repo/api-contracts/dependencies`
- `repo://graph/used-by/@repo/api-contracts` (expect apps to depend on it)

## Rules
- Backward-compatibility is critical. Coordinate changes with `apps/api` and `apps/web`.
- Update `docs/ORPC-TYPE-CONTRACTS.md` when adding/modifying contracts.
- Use MCP for impact analysis before changes:
	- `repo://graph/used-by/@repo/api-contracts` to list dependents
	- `list-internal-dependencies { targetName: "@repo/api-contracts" }` for graph context

## Scripts
- Type-check: `bun run @repo/api-contracts -- type-check`
- Test: `bun run @repo/api-contracts -- test`
