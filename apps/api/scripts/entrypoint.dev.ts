#!/usr/bin/env -S bun

import { existsSync } from 'fs'
import { execSync, spawn } from 'child_process'
import { validateApiEnv, apiEnvIsValid, validateApiEnvSafe } from '@repo/env'
import zod from 'zod/v4'

interface EntrypointConfig {
  skipMigrations: boolean
  diagnosePath: string
  migrateScript: string
  seedScript: string
}

/**
 * Validate environment variables at startup
 */
function validateEnvironment(): void {
  console.log('🔍 Validating environment variables...')
  
  if (!apiEnvIsValid(process.env)) {
    const result = validateApiEnvSafe(process.env)
    console.error('❌ Environment validation failed:')
    if (!result.success) {
      console.error(zod.prettifyError(result.error))
    }
    process.exit(1)
  }
  
  console.log('✅ Environment validation passed\n')
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
      execSync(`bun --bun ${config.diagnosePath} --watch`, { stdio: 'inherit' })
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

  try {
    console.log('🌱 Running database seeding...')
    execSync(`bun run ${config.seedScript}`, { stdio: 'inherit' })
  } catch (error) {
    console.error('⚠️  db:seed failed (continuing)')
  }
}

/**
 * Start API and Drizzle Studio processes concurrently
 */
function startProcesses(): void {
  console.log('🚀 Starting API and Drizzle Studio...')

  const apiProcess = spawn('bun', ['run', 'start:dev'], {
    stdio: 'inherit',
    shell: true,
  })

  const studioProcess = spawn('bun', ['run', 'db:studio', '--host', '0.0.0.0'], {
    stdio: 'inherit',
    shell: true,
  })

  let exitRequested = false

  const handleExit = (code: number | null) => {
    if (!exitRequested) {
      exitRequested = true
      console.log('Process exited, cleaning up...')
      apiProcess.kill()
      studioProcess.kill()
      process.exit(code ?? 1)
    }
  }

  apiProcess.on('exit', handleExit)
  studioProcess.on('exit', handleExit)

  process.on('SIGINT', () => {
    if (!exitRequested) {
      exitRequested = true
      console.log('Received SIGINT, shutting down...')
      apiProcess.kill('SIGINT')
      studioProcess.kill('SIGINT')
    }
  })

  process.on('SIGTERM', () => {
    if (!exitRequested) {
      exitRequested = true
      console.log('Received SIGTERM, shutting down...')
      apiProcess.kill('SIGTERM')
      studioProcess.kill('SIGTERM')
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
  }

  console.log('🎯 API Development Entrypoint Started\n')

  // Validate environment before starting
  validateEnvironment()

  runDiagnostics(config)
  runMigrations(config)
  startProcesses()
}

main()
