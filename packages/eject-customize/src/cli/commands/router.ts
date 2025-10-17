/**
 * Command Router
 * Routes commands to appropriate handlers
 */

import type { ParsedArguments } from '../utils/arguments'
import { error, info, header } from '../output/formatter'
import { helpCommand } from './help'
import { ejectCommand } from './eject'
import { customizeCommand } from './customize'
import { swapCommand } from './swap'

export interface CommandHandler {
  name: string
  description: string
  execute(args: ParsedArguments): Promise<number>
}

export type CommandMap = Record<string, CommandHandler>

/**
 * Create command router
 */
export function createCommandRouter(): CommandMap {
  return {
    help: helpCommand,
    eject: ejectCommand,
    customize: customizeCommand,
    swap: swapCommand,
    interactive: {
      name: 'interactive',
      description: 'Interactive mode',
      async execute() {
        return 0 // Placeholder
      },
    },
  }
}

/**
 * Route command to handler
 */
export async function routeCommand(
  command: string | null,
  args: ParsedArguments,
  handlers: CommandMap
): Promise<number> {
  if (!command) {
    console.error(error('No command specified'))
    return 1
  }

  const handler = handlers[command]
  if (!handler) {
    console.error(error(`Unknown command: ${command}`))
    return 1
  }

  try {
    return await handler.execute(args)
  } catch (err) {
    console.error(error(`Command failed: ${err instanceof Error ? err.message : String(err)}`))
    if (process.env.DEBUG) {
      console.error(err)
    }
    return 1
  }
}

/**
 * Display command help
 */
export function displayCommandHelp(command: string, handler: CommandHandler): void {
  console.log(header(handler.name))
  console.log(`${handler.description}\n`)
}

/**
 * Display all commands
 */
export function displayAllCommands(handlers: CommandMap): void {
  console.log(header('Available Commands'))

  const maxNameLength = Math.max(...Object.values(handlers).map((h) => h.name.length))

  for (const handler of Object.values(handlers)) {
    const padding = ' '.repeat(maxNameLength - handler.name.length + 2)
    console.log(`  ${handler.name}${padding}${handler.description}`)
  }

  console.log()
}
