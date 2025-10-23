#!/usr/bin/env -S bun

import { existsSync } from 'fs'
import { execSync, spawn } from 'child_process'

interface EntrypointConfig {
  skipMigrations: boolean
  diagnosePath: string
  migrateScript: string
  seedScript: string
  supervisordConf: string
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
function runMigrations(config: EntrypointConfig): boolean {
  if (config.skipMigrations) {
    console.log('⏭️  SKIP_MIGRATIONS set, skipping migrations and seeding')
    return true
  }

  const apiPackageJson = 'apps/api/package.json'

  if (!existsSync(apiPackageJson)) {
    console.log('⚠️  apps/api/package.json missing, skipping migrations and seeding')
    return false
  }

  console.log('Found apps/api/package.json - running migrations')

  try {
    console.log('📦 Running database migrations...')
    execSync(`bun run --cwd apps/api ${config.migrateScript}`, { stdio: 'inherit' })
  } catch (error) {
    console.error('⚠️  db:migrate failed (continuing)')
  }

  try {
    console.log('🌱 Running database seeding...')
    execSync(`bun run --cwd apps/api ${config.seedScript}`, { stdio: 'inherit' })
  } catch (error) {
    console.error('⚠️  db:seed failed (continuing)')
  }

  return true
}

/**
 * Start supervisord
 */
function startSupervisord(config: EntrypointConfig): void {
  console.log('🚀 Starting supervisord...')

  const supervisord = spawn('/usr/bin/supervisord', ['-c', config.supervisordConf], {
    stdio: 'inherit',
  })

  supervisord.on('error', (error: Error) => {
    console.error('❌ Failed to start supervisord:', error.message)
    process.exit(1)
  })

  supervisord.on('exit', (code: number) => {
    if (code !== 0) {
      console.error(`supervisord exited with code ${code}`)
      process.exit(code)
    }
  })
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
    supervisordConf: '/etc/supervisord.conf',
  }

  console.log('🎯 API Development Entrypoint Started\n')

  runDiagnostics(config)
  runMigrations(config)
  startSupervisord(config)
}

main()
