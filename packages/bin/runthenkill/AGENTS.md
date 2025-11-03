# AGENTS.md — @repo/bin-runthenkill

CLI tool to run a process and manage port state after termination.

## Quick Context via MCP
- `repo://package/@repo/bin-runthenkill/package.json`
- `repo://package/@repo/bin-runthenkill/dependencies`

## Rules
- Keep the CLI cross-platform compatible (Windows, macOS, Linux)
- Properly handle process termination and port cleanup
- Document usage in project scripts that use this tool

## Usage
```bash
runthenkill -c "your-command" -p 3000
runthenkill -c "your-command" -p 3000 --secondary-command "fallback-command"
```
