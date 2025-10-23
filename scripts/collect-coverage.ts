#!/usr/bin/env -S bun

import { existsSync, readdirSync, readFileSync, copyFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface CoverageStats {
  files: number
  statements: number
  functions: number
  branches: number
  lines: number
}

interface CoverageData {
  [file: string]: {
    s?: Record<string, number>
    f?: Record<string, number>
    b?: Record<string, number[]>
    l?: Record<string, number>
  }
}

interface PackageCoverageStats {
  [packageName: string]: CoverageStats
}

/**
 * Ensure directory exists, creating it if necessary
 */
function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

/**
 * Copy a file and return success status
 */
function copyFile(src: string, dest: string): boolean {
  if (existsSync(src)) {
    copyFileSync(src, dest)
    console.log(`✅ Copied ${src} to ${dest}`)
    return true
  }
  console.log(`⚠️  File not found: ${src}`)
  return false
}

/**
 * Analyze coverage data from a coverage file
 */
function analyzeCoverageFile(filePath: string): CoverageStats | null {
  try {
    const content: CoverageData = JSON.parse(readFileSync(filePath, 'utf8'))
    const files = Object.keys(content)
    let totalStatements = 0
    let coveredStatements = 0
    let totalFunctions = 0
    let coveredFunctions = 0
    let totalBranches = 0
    let coveredBranches = 0
    let totalLines = 0
    let coveredLines = 0

    files.forEach((file: string) => {
      const fileData = content[file]
      if (!fileData) return
      if (fileData.s) {
        totalStatements += Object.keys(fileData.s).length
        coveredStatements += Object.values(fileData.s).filter((v) => v > 0).length
      }
      if (fileData.f) {
        totalFunctions += Object.keys(fileData.f).length
        coveredFunctions += Object.values(fileData.f).filter((v) => v > 0).length
      }
      if (fileData.b) {
        const branches = Object.values(fileData.b)
        branches.forEach((branch) => {
          if (Array.isArray(branch)) {
            totalBranches += branch.length
            coveredBranches += branch.filter((v) => v > 0).length
          }
        })
      }
      if (fileData.l) {
        const lineNumbers = Object.keys(fileData.l).map(Number)
        if (lineNumbers.length > 0) {
          totalLines += lineNumbers.length
          coveredLines += Object.values(fileData.l).filter((v) => v > 0).length
        }
      }
    })

    return {
      files: files.length,
      statements: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0,
      functions: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0,
      branches: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0,
      lines: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0,
    }
  } catch (e) {
    return null
  }
}

/**
 * Format a coverage stat value
 */
function formatStat(value: number): string {
  return `${value}%`.padEnd(12)
}

/**
 * Print coverage statistics table
 */
function printCoverageTable(stats: PackageCoverageStats): void {
  console.log('📈 Individual Package Coverage Summary:')
  console.log('─'.repeat(70))
  console.log(
    'Package'.padEnd(20) +
      'Files'.padEnd(8) +
      'Statements'.padEnd(12) +
      'Functions'.padEnd(12) +
      'Branches'.padEnd(10) +
      'Lines'
  )
  console.log('─'.repeat(70))

  Object.entries(stats).forEach(([name, stats]) => {
    console.log(
      name.padEnd(20) +
        stats.files.toString().padEnd(8) +
        formatStat(stats.statements) +
        formatStat(stats.functions) +
        formatStat(stats.branches) +
        formatStat(stats.lines)
    )
  })
  console.log('─'.repeat(70))
}

/**
 * Collect coverage reports from all packages
 */
function collectCoverage(): number {
  console.log('\n🧪 Collecting coverage reports from all packages...\n')

  const rootDir = process.cwd()
  const coverageDir = join(rootDir, 'coverage')
  const rawDir = join(coverageDir, 'raw')

  // Ensure directories exist
  ensureDir(rawDir)

  let filesCollected = 0
  const coverageStats: PackageCoverageStats = {}

  // Collect web app coverage
  const webCoverage = join(rootDir, 'apps/web/coverage/coverage-final.json')
  if (copyFile(webCoverage, join(rawDir, 'web-coverage.json'))) {
    filesCollected++
    const stats = analyzeCoverageFile(webCoverage)
    if (stats) {
      coverageStats['Web App'] = stats
    }
  }

  // Collect API coverage
  const apiCoverage = join(rootDir, 'apps/api/coverage/coverage-final.json')
  if (copyFile(apiCoverage, join(rawDir, 'api-coverage.json'))) {
    filesCollected++
    const stats = analyzeCoverageFile(apiCoverage)
    if (stats) {
      coverageStats['API'] = stats
    }
  }

  // Collect package coverage
  const packagesDir = join(rootDir, 'packages')
  if (existsSync(packagesDir)) {
    const packages = readdirSync(packagesDir)
    packages.forEach((packageName: string) => {
      const packageCoverage = join(packagesDir, packageName, 'coverage/coverage-final.json')
      if (copyFile(packageCoverage, join(rawDir, `${packageName}-coverage.json`))) {
        filesCollected++
        const stats = analyzeCoverageFile(packageCoverage)
        if (stats) {
          coverageStats[`@repo/${packageName}`] = stats
        }
      }
    })
  }

  console.log(`\n📊 Collected ${filesCollected} coverage files\n`)

  if (filesCollected === 0) {
    console.log('⚠️  No coverage files found. Make sure to run tests with coverage first.')
    process.exit(1)
  }

  // Display summary
  if (Object.keys(coverageStats).length > 0) {
    printCoverageTable(coverageStats)
    console.log('\n🔄 Merging all coverage reports...\n')
  }

  return filesCollected
}

/**
 * Export for testing
 */
export { collectCoverage, analyzeCoverageFile }

// Main execution
collectCoverage()
