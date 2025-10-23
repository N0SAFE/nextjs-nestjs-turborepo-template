#!/usr/bin/env -S bun

import { execSync } from 'child_process'

interface GitDiffOptions {
  prBase?: string
  compareCommit?: string
}

type ChangeType = 'root' | 'package' | 'app'

interface PackageChange {
  type: ChangeType
  name: string
}

/**
 * Get changed files from git
 */
function getChangedFiles(options: GitDiffOptions = {}): string[] {
  let command: string

  if (options.prBase) {
    // For pull requests, compare against base branch
    command = `git diff --name-only origin/${options.prBase}...HEAD`
  } else if (options.compareCommit) {
    // Compare against specific commit
    command = `git diff --name-only ${options.compareCommit}`
  } else {
    // Compare against last commit
    command = 'git diff --name-only HEAD~1'
  }

  try {
    const output = execSync(command, { encoding: 'utf8' })
    return output.split(/\r?\n/).filter((line) => line.trim())
  } catch (error) {
    console.error('Failed to get changed files:', error)
    return []
  }
}

/**
 * Extract package/app name from file path
 */
function extractPackageName(file: string, type: 'packages' | 'apps'): string | null {
  const parts = file.split('/')
  if (parts[0] === type && parts.length > 1) {
    if (parts[1] === undefined) return null
    return parts[1]
  }
  return null
}

/**
 * Detect changed packages from file changes
 */
function detectChangedPackages(files: string[]): Set<string> {
  const packages = new Set<string>()

  files.forEach((file) => {
    // Check for root changes that affect everything
    if (['package.json', 'bun.lock', 'turbo.json'].includes(file)) {
      packages.add('root')
      packages.add('web')
      packages.add('api')
      packages.add('eslint-config')
      packages.add('prettier-config')
      packages.add('tailwind-config')
      packages.add('tsconfig')
      packages.add('types')
      packages.add('ui')
      packages.add('vitest-config')
      packages.add('bin')
      return // Stop processing this file
    }

    // Check for package changes
    const pkgName = extractPackageName(file, 'packages')
    if (pkgName) {
      packages.add(pkgName)
      return
    }

    // Check for app changes
    const appName = extractPackageName(file, 'apps')
    if (appName) {
      packages.add(appName)
      return
    }
  })

  return packages
}

/**
 * Parse command line arguments
 */
function parseArgs(): GitDiffOptions {
  const args = process.argv.slice(2)

  if (args[0] === 'pr' && args[1]) {
    return { prBase: args[1] }
  } else if (args[0]) {
    return { compareCommit: args[0] }
  }

  return {}
}

/**
 * Main execution
 */
function main(): void {
  console.log('🔍 Detecting changed packages...\n')

  const options = parseArgs()
  const changedFiles = getChangedFiles(options)

  console.log('📝 Changed files:')
  changedFiles.forEach((file) => console.log(`  - ${file}`))
  console.log()

  if (changedFiles.length === 0) {
    console.log('⚠️  No changed files detected')
    console.log('Detected packages: []')
    return
  }

  const packages = detectChangedPackages(changedFiles)
  const packageArray = Array.from(packages).sort()

  // Output in JSON format for GitHub Actions
  const jsonOutput = JSON.stringify(packageArray)
  console.log(`Detected packages: ${jsonOutput}`)

  // Also output individual packages for easier parsing
  console.log('\n📦 Individual packages:')
  packageArray.forEach((pkg) => console.log(`  - ${pkg}`))
}

main()
