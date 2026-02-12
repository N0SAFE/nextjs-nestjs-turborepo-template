# @repo/runthenkill

A CLI tool to run a process and manage port state after termination. Written in TypeScript and runs with Bun.

## Features

- Cross-platform compatible (Windows, macOS, Linux)
- Written in TypeScript for type safety
- Runs with Bun for fast execution
- Monitors port state before and after process execution
- Can run a secondary command if the port is not in use
- Properly handles process termination and cleanup
- Restores port state after process exits

## Installation

This package is part of the monorepo and is used internally.

## Usage

```bash
runthenkill -c "your-command" -p 3000
```

### Options

- `-c, --command <command>` (required): Command to run
- `-p, --port <port>` (required): Port to monitor
- `-a, --args <args...>` (optional): Arguments for the command
- `--secondary-command <command>` (optional): Secondary command to run if port is not open
- `--secondary-args <args...>` (optional): Arguments for the secondary command

### Examples

```bash
# Run a simple command
runthenkill -c "npm start" -p 3000

# Run with arguments
runthenkill -c "node" -p 3000 -a "server.js" "--debug"

# Run with a secondary command
runthenkill -c "npm test" -p 3000 --secondary-command "npm start"
```

## How It Works

1. Checks if the specified port is in use before starting
2. If port is not in use and a secondary command is provided, starts the secondary command
3. Runs the main command
4. On termination, manages port cleanup to restore the original state
5. Properly handles SIGINT (Ctrl+C) for graceful shutdown
