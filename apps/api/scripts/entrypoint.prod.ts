#!/usr/bin/env -S bun

import { existsSync } from 'fs'
import { execSync } from 'child_process'

interface EntrypointConfig {
  skipMigrations: boolean
  diagnosePath: string
  migrateScript: string
  seedScript: string
}

/**
 * Run diagnostics if available
 */
function runDiagnostics(config: EntrypointConfig): void {
  if (existsSync(config.diagnosePath)) {
    console.log('════════════════════════════════════════════════════════')
    console.log('Running Build Environment Diagnostics...')
    console.log('════════════════════════════════════════════════════════')

    try {
      execSync(`bun --bun ${config.diagnosePath}`, { stdio: 'inherit' })
    } catch (error) {
      console.error('⚠️  Diagnostics failed, continuing...')
    }

    console.log('════════════════════════════════════════════════════════')
  }
}

/**
 * Run database migrations
 */
function runMigrations(config: EntrypointConfig): void {
  if (config.skipMigrations) {
    console.log('⏭️  SKIP_MIGRATIONS set, skipping migrations and seeding')
    return
  }

  const apiPackageJson = 'package.json'

  if (!existsSync(apiPackageJson)) {
    console.log('⚠️  package.json missing, skipping migrations and seeding')
    return
  }

  console.log('Found package.json - running migrations')

  try {
    console.log('📦 Running database migrations...')
    execSync(`bun run ${config.migrateScript}`, { stdio: 'inherit' })
  } catch (error) {
    console.error('⚠️  db:migrate failed (continuing)')
  }
}

/**
 * Start API in production mode
 */
function startAPI(): void {
  console.log('🚀 Starting API in production mode...')

  try {
    execSync('bun run start:prod', { stdio: 'inherit' })
  } catch (error) {
    console.error('❌ API failed to start:', error)
    process.exit(1)
  }
}

/**
 * Main entrypoint
 */
function main(): void {
  const config: EntrypointConfig = {
    skipMigrations: process.env.SKIP_MIGRATIONS === 'true',
    diagnosePath: 'scripts/diagnose-build.ts',
    migrateScript: 'db:migrate',
    seedScript: 'db:seed',
  }

  console.log('🎯 API Production Entrypoint Started\n')

  runDiagnostics(config)
  runMigrations(config)
  startAPI()
}

main()
