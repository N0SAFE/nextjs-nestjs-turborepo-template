/**
 * CLI Argument Parser
 * Parses command-line arguments into structured format
 */

export interface ParsedArguments {
  command: 'eject' | 'customize' | 'swap' | 'help' | 'interactive' | null
  args: string[]
  options: Record<string, string | boolean>
  positionals: string[]
}

export interface ArgumentDefinition {
  name: string
  shortForm?: string
  longForm: string
  hasValue: boolean
  description: string
  required?: boolean
}

/**
 * Parse command-line arguments
 */
export function parseArguments(argv: string[]): ParsedArguments {
  const result: ParsedArguments = {
    command: null,
    args: argv,
    options: {},
    positionals: [],
  }

  // Determine command (first non-option argument)
  let commandIndex = -1
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('-')) {
      if (isValidCommand(argv[i])) {
        result.command = argv[i] as 'eject' | 'customize' | 'swap' | 'help' | 'interactive'
        commandIndex = i
        break
      }
    }
  }

  // If no command found and --interactive flag present, use interactive mode
  if (!result.command && hasFlag(argv, '--interactive', '-i')) {
    result.command = 'interactive'
  }

  // If no command found, default to help
  if (!result.command) {
    result.command = 'help'
  }

  // Parse options and positionals
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=')
      if (value !== undefined) {
        result.options[key] = value
      } else {
        result.options[key] = true
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      // Short form options
      const shortFlags = arg.slice(1).split('')
      for (const flag of shortFlags) {
        result.options[flag] = true
      }
    } else if (i !== commandIndex) {
      // Positional arguments (not the command)
      result.positionals.push(arg)
    }
  }

  return result
}

/**
 * Check if argument is a valid command
 */
function isValidCommand(arg: string): boolean {
  const validCommands = ['eject', 'customize', 'swap', 'help', 'interactive']
  return validCommands.includes(arg)
}

/**
 * Check if flag is present
 */
export function hasFlag(argv: string[], longForm: string, shortForm?: string): boolean {
  for (const arg of argv) {
    if (arg === longForm) return true
    if (shortForm && arg === shortForm) return true
    if (arg.startsWith(longForm + '=')) return true
    if (shortForm && arg.startsWith(shortForm + '=')) return true
  }
  return false
}

/**
 * Get option value
 */
export function getOptionValue(
  options: Record<string, string | boolean>,
  key: string,
  defaultValue?: string
): string | undefined {
  const value = options[key]
  if (value === true) return defaultValue
  if (typeof value === 'string') return value
  return defaultValue
}

/**
 * Get boolean option
 */
export function getBooleanOption(
  options: Record<string, string | boolean>,
  key: string,
  defaultValue = false
): boolean {
  const value = options[key]
  if (value === true) return true
  if (value === false || value === 'false') return false
  return defaultValue
}

/**
 * Get all positional arguments
 */
export function getPositionals(parsed: ParsedArguments): string[] {
  return parsed.positionals
}

/**
 * Get specific positional argument
 */
export function getPositional(parsed: ParsedArguments, index: number): string | undefined {
  return parsed.positionals[index]
}

/**
 * Validate required options
 */
export function validateRequired(
  options: Record<string, string | boolean>,
  required: string[]
): { valid: boolean; missing: string[] } {
  const missing = required.filter((opt) => !(opt in options) || options[opt] === false)

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Format help text for command
 */
export function formatCommandHelp(
  command: string,
  description: string,
  options: ArgumentDefinition[],
  examples: string[]
): string {
  let help = `\nCommand: ${command}\n`
  help += `Description: ${description}\n\n`

  if (options.length > 0) {
    help += 'Options:\n'
    for (const opt of options) {
      let optStr = '  '
      if (opt.shortForm) {
        optStr += `${opt.shortForm}, `
      }
      optStr += `${opt.longForm}`
      if (opt.hasValue) {
        optStr += ' VALUE'
      }
      optStr = optStr.padEnd(30)
      optStr += opt.description
      if (opt.required) {
        optStr += ' (required)'
      }
      help += optStr + '\n'
    }
    help += '\n'
  }

  if (examples.length > 0) {
    help += 'Examples:\n'
    for (const example of examples) {
      help += `  ${example}\n`
    }
    help += '\n'
  }

  return help
}
