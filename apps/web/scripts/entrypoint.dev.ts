#!/usr/bin/env -S bun

import { spawn, spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { validateWebEnvSafe, webEnvIsValid } from '@repo/env'
import zod from 'zod/v4'

const DECLARATIVE_ROUTING_PKG_DIR = join(process.cwd(), '../../packages/bin/declarative-routing')
const DECLARATIVE_ROUTING_DIST = join(DECLARATIVE_ROUTING_PKG_DIR, 'dist/index.js')

/**
 * Build local declarative-routing package and ensure dist/index.js exists.
 * Required in container startup to guarantee dr:build/watch use local package only.
 */
function ensureLocalDeclarativeRoutingBuilt(): void {
  const localCliSourcePath = join(DECLARATIVE_ROUTING_PKG_DIR, 'src/index.ts')

  if (!existsSync(localCliSourcePath)) {
    console.error('❌ declarative-routing local package source is missing')
    console.error(`   Expected at: ${localCliSourcePath}`)
    process.exit(1)
  }

  console.log('🔨 Building local @repo/cli-declarative-routing package...')

  const result = spawnSync('bun', ['run', '--cwd', DECLARATIVE_ROUTING_PKG_DIR, 'build'], {
    stdio: 'inherit',
    env: process.env,
  })

  if (result.status !== 0) {
    console.error('❌ Failed to build local @repo/cli-declarative-routing package')
    process.exit(1)
  }

  if (!existsSync(DECLARATIVE_ROUTING_DIST)) {
    console.error('❌ local declarative-routing build completed but dist/index.js is missing')
    console.error(`   Expected at: ${DECLARATIVE_ROUTING_DIST}`)
    process.exit(1)
  }

  console.log('✅ Local declarative-routing package built successfully')
}

/**
 * Validate environment variables at startup
 */
function validateEnvironment(): void {
  console.log('🔍 Validating environment variables...')
  
  if (!webEnvIsValid(process.env)) {
    const result = validateWebEnvSafe(process.env)
    console.error('❌ Environment validation failed:')
    if (!result.success) {
      console.error(zod.prettifyError(result.error))
    }
    process.exit(1)
  }
  
  console.log('✅ Environment validation passed\n')
}

/**
 * Ensure routes are generated before starting Next.js
 */
function ensureRoutesGenerated(): void {
  const routesIndexPath = join(process.cwd(), 'src/routes/index.ts')
  
  if (!existsSync(routesIndexPath)) {
    console.log('⚠️  Routes not found, generating initial routes...')
    const result = spawnSync('bun', ['--bun', 'run', 'dr:build'], {
      stdio: 'inherit',
      env: process.env,
    })
    
    if (result.status !== 0) {
      console.error('❌ Failed to generate routes')
      process.exit(1)
    }
    
    console.log('✅ Initial routes generated')
  } else {
    console.log('✅ Routes already exist')
  }
}

/**
 * Start Next.js and Declarative Routing processes concurrently
 */
function startProcesses(): void {
  console.log('🚀 Starting Next.js and Declarative Routing...')

  const nextProcess = spawn('bun', ['--bun', 'run', 'dev:docker'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_OPTIONS: '--max_old_space_size=1024 --inspect',
    },
  })

  const routingProcess = spawn('bun', ['--bun', 'run', 'dr:build:watch'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_OPTIONS: '--max_old_space_size=256',
    },
  })

  let exitRequested = false

  const handleExit = (code: number | null) => {
    if (!exitRequested) {
      exitRequested = true
      console.log('Process exited, cleaning up...')
      nextProcess.kill()
      routingProcess.kill()
      process.exit(code ?? 1)
    }
  }

  nextProcess.on('exit', handleExit)
  routingProcess.on('exit', handleExit)

  process.on('SIGINT', () => {
    if (!exitRequested) {
      exitRequested = true
      console.log('Received SIGINT, shutting down...')
      nextProcess.kill('SIGINT')
      routingProcess.kill('SIGINT')
    }
  })

  process.on('SIGTERM', () => {
    if (!exitRequested) {
      exitRequested = true
      console.log('Received SIGTERM, shutting down...')
      nextProcess.kill('SIGTERM')
      routingProcess.kill('SIGTERM')
    }
  })
}

/**
 * Main entrypoint
 */
async function main(): Promise<void> {
  console.log('🎯 Web Development Entrypoint Started\n')
  
  // Validate environment before starting
  validateEnvironment()

  // Build local declarative-routing package at container startup
  ensureLocalDeclarativeRoutingBuilt()
  
  // Ensure routes are generated before starting Next.js
  ensureRoutesGenerated()
  
  startProcesses()
}

main()
