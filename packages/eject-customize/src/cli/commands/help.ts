/**
 * Help Command
 * Displays help information for the CLI
 */

import type { CommandHandler } from '../commands/router'
import type { ParsedArguments } from '../utils/arguments'
import { header, info, keyValue, listItem } from '../output/formatter'

const helpText = `
eject-customize - Framework ejection and customization tool

USAGE
  eject-customize <command> [options]

COMMANDS
  eject       Eject and customize your Next.js project
  customize   Customize an already ejected project
  swap        Swap frameworks in your project
  interactive Interactive mode for guided customization
  help        Show this help message

OPTIONS
  --help, -h      Show help information
  --version, -v   Show version information
  --debug         Enable debug logging
  --verbose       Enable verbose output

EXAMPLES
  # Show help
  eject-customize help

  # Eject project interactively
  eject-customize eject --interactive

  # Customize with specific features
  eject-customize customize --features auth,orm

  # Swap frameworks
  eject-customize swap --from react --to vue

  # Interactive mode
  eject-customize interactive

DOCUMENTATION
  For more information, visit: https://github.com/your-org/eject-customize
  Report issues at: https://github.com/your-org/eject-customize/issues
`

export const helpCommand: CommandHandler = {
  name: 'help',
  description: 'Show help information',
  async execute(args: ParsedArguments): Promise<number> {
    // Get specific command to help for
    const targetCommand = args.positionals[0]

    if (targetCommand === 'eject') {
      displayEjectHelp()
    } else if (targetCommand === 'customize') {
      displayCustomizeHelp()
    } else if (targetCommand === 'swap') {
      displaySwapHelp()
    } else if (targetCommand === 'interactive') {
      displayInteractiveHelp()
    } else {
      console.log(helpText)
    }

    return 0
  },
}

function displayEjectHelp(): void {
  console.log(header('Eject Command'))
  console.log(`
Eject and customize your Next.js project configuration.
Extracts ejected configuration for advanced customization.

USAGE
  eject-customize eject [options]

OPTIONS
  --interactive, -i      Interactive mode with prompts
  --output, -o <path>    Output directory for ejected files (default: ./ejected)
  --force, -f            Force overwrite existing files
  --dry-run              Show what would be done without making changes
  --include <features>   Features to include (comma-separated)
  --exclude <features>   Features to exclude (comma-separated)

FEATURES
  auth                   Authentication and authorization
  database               Database configuration and schemas
  orm                    Object-relational mapping setup
  api                    API routes and handlers
  ui                     User interface components
  testing                Testing setup and configuration
  validation             Input validation schemas
  logging                Logging configuration

EXAMPLES
  # Eject with interactive prompts
  eject-customize eject --interactive

  # Eject specific features
  eject-customize eject --include auth,database

  # Dry run to see changes
  eject-customize eject --dry-run

  # Force overwrite existing ejected config
  eject-customize eject --force
`)
}

function displayCustomizeHelp(): void {
  console.log(header('Customize Command'))
  console.log(`
Customize an already ejected project configuration.

USAGE
  eject-customize customize [options]

OPTIONS
  --config, -c <path>    Path to config file (default: ./ejected/config.json)
  --interactive, -i      Interactive mode with prompts
  --feature <name>       Customize specific feature
  --validate             Validate configuration without applying
  --dry-run              Show what would be done without making changes

EXAMPLES
  # Customize interactively
  eject-customize customize --interactive

  # Customize authentication
  eject-customize customize --feature auth

  # Validate current configuration
  eject-customize customize --validate

  # Dry run
  eject-customize customize --dry-run
`)
}

function displaySwapHelp(): void {
  console.log(header('Swap Command'))
  console.log(`
Swap between different frameworks in your project.

USAGE
  eject-customize swap [options]

OPTIONS
  --from <framework>     Source framework (required)
  --to <framework>       Target framework (required)
  --interactive, -i      Interactive mode with prompts
  --dry-run              Show migration plan without applying
  --skip-deps            Skip dependency updates
  --include-manual       Include manual migration steps

SUPPORTED FRAMEWORKS
  react                  React with Next.js
  vue                    Vue with Nuxt
  solid                  Solid.js
  astro                  Astro
  svelte                 Svelte with SvelteKit

EXAMPLES
  # Swap React to Vue
  eject-customize swap --from react --to vue

  # Swap with interactive mode
  eject-customize swap --from react --to solid --interactive

  # Dry run to see migration plan
  eject-customize swap --from react --to vue --dry-run
`)
}

function displayInteractiveHelp(): void {
  console.log(header('Interactive Mode'))
  console.log(`
Launch the interactive guided customization mode.

USAGE
  eject-customize interactive [options]

OPTIONS
  --skip-welcome         Skip welcome message
  --skip-intro           Skip introduction screens
  --mode <mode>          Set interaction mode (eject, customize, or swap)

DESCRIPTION
  Interactive mode provides step-by-step guidance through:
  - Project analysis
  - Feature selection
  - Configuration review
  - Confirmation before applying changes

EXAMPLES
  # Launch interactive mode
  eject-customize interactive

  # Launch in eject mode
  eject-customize interactive --mode eject

  # Skip welcome message
  eject-customize interactive --skip-welcome
`)
}

export default helpCommand
