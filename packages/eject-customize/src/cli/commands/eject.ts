/**
 * Eject Command
 * Eject and customize project configuration
 */

import type { CommandHandler } from '../commands/router'
import type { ParsedArguments } from '../utils/arguments'
import { success, error, info, progressBar } from '../output/formatter'
import { ValidationError, FileOperationError } from '../utils/error-handler'

interface EjectOptions {
  interactive?: boolean
  output?: string
  force?: boolean
  dryRun?: boolean
  include?: string[]
  exclude?: string[]
}

export const ejectCommand: CommandHandler = {
  name: 'eject',
  description: 'Eject and customize project configuration',
  async execute(args: ParsedArguments): Promise<number> {
    try {
      // Parse options
      const options = parseEjectOptions(args)

      // Validate options
      validateEjectOptions(options)

      // Display header
      console.log(info('🚀 Starting eject process...\n'))

      // Simulate eject process
      const result = await performEject(options)

      // Display results
      if (result.success) {
        console.log(success(`✓ Eject completed successfully!`))
        console.log(
          info(
            `Configuration ejected to: ${options.output || './ejected'}\n`
          )
        )

        // Display summary
        if (result.filesCreated > 0) {
          console.log(info(`Created ${result.filesCreated} configuration files`))
        }
        if (result.featuresConfigured > 0) {
          console.log(info(`Configured ${result.featuresConfigured} features`))
        }

        return 0
      } else {
        console.log(error(`✗ Eject failed: ${result.error}`))
        return 1
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.log(error(`✗ Eject failed: ${message}`))
      if (process.env.DEBUG) {
        console.error(err)
      }
      return 1
    }
  },
}

function parseEjectOptions(args: ParsedArguments): EjectOptions {
  const options: EjectOptions = {}

  // Check for interactive flag
  if (args.options.interactive || args.options.i) {
    options.interactive = true
  }

  // Get output directory
  if (args.options.output) {
    options.output = String(args.options.output)
  } else if (args.options.o) {
    options.output = String(args.options.o)
  } else {
    options.output = './ejected'
  }

  // Check for force flag
  if (args.options.force || args.options.f) {
    options.force = true
  }

  // Check for dry-run flag
  if (args.options['dry-run']) {
    options.dryRun = true
  }

  // Parse include list
  if (args.options.include) {
    const includeStr = String(args.options.include)
    options.include = includeStr.split(',').map((s) => s.trim())
  }

  // Parse exclude list
  if (args.options.exclude) {
    const excludeStr = String(args.options.exclude)
    options.exclude = excludeStr.split(',').map((s) => s.trim())
  }

  return options
}

function validateEjectOptions(options: EjectOptions): void {
  if (!options.output) {
    throw new ValidationError('Output directory is required')
  }

  if (options.include && options.exclude) {
    const hasConflict = options.include.some((f) => options.exclude?.includes(f))
    if (hasConflict) {
      throw new ValidationError('Cannot include and exclude the same features')
    }
  }
}

interface EjectResult {
  success: boolean
  filesCreated: number
  featuresConfigured: number
  error?: string
}

async function performEject(options: EjectOptions): Promise<EjectResult> {
  const allFeatures = ['auth', 'database', 'orm', 'api', 'ui', 'testing', 'validation', 'logging']

  // Determine which features to configure
  let featuresToConfigure = allFeatures

  if (options.include && options.include.length > 0) {
    featuresToConfigure = allFeatures.filter((f) => options.include?.includes(f))
  } else if (options.exclude && options.exclude.length > 0) {
    featuresToConfigure = allFeatures.filter((f) => !options.exclude?.includes(f))
  }

  // Simulate progress
  let filesCreated = 0
  let featuresConfigured = 0

  if (!options.dryRun) {
    // Show progress
    for (let i = 0; i < featuresToConfigure.length; i++) {
      const feature = featuresToConfigure[i]
      const progress = ((i + 1) / featuresToConfigure.length) * 100

      process.stdout.write(`\r${progressBar(i + 1, featuresToConfigure.length, 30)}  ${feature}`)

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 100))

      filesCreated += 2 // Each feature creates 2 files
      featuresConfigured += 1
    }

    console.log() // New line after progress
  } else {
    // Dry run mode
    console.log(info('DRY RUN: Would create the following:'))
    featuresToConfigure.forEach((feature) => {
      console.log(info(`  - ${feature}/config.json`))
      console.log(info(`  - ${feature}/types.ts`))
      filesCreated += 2
      featuresConfigured += 1
    })
    console.log()
  }

  return {
    success: true,
    filesCreated,
    featuresConfigured,
  }
}

export default ejectCommand
