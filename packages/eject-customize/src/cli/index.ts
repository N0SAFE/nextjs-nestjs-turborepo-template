#!/usr/bin/env node

/**
 * Main CLI Entry Point
 * Parses arguments and routes to appropriate command handler
 */

import process from 'process'
import { parseArguments } from './utils/arguments'
import { createCommandRouter, routeCommand, displayAllCommands } from './commands/router'
import { error, success, info } from './output/formatter'

/**
 * Main CLI function
 */
export async function main(): Promise<number> {
  // Parse command line arguments
  const args = parseArguments(process.argv.slice(2))

  // Extract command from parsed args
  const command = args.command

  // Create command router
  const router = createCommandRouter()

  // Handle no command (show help)
  if (!command || command === 'help' || args.options.help) {
    displayAllCommands(router)
    return 0
  }

  // Route and execute command
  return await routeCommand(command, args, router)
}

/**
 * Run CLI with error handling
 */
export async function runCLI(): Promise<void> {
  try {
    const exitCode = await main()
    process.exit(exitCode)
  } catch (err) {
    console.error(error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`))
    if (process.env.DEBUG) {
      console.error(err)
    }
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI()
}

export default { main, runCLI }
