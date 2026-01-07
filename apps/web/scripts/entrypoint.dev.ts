#!/usr/bin/env -S bun

import { spawn, spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { validateWebEnvSafe, webEnvIsValid } from '@repo/env'
import zod from 'zod/v4'

const DECLARATIVE_ROUTING_DIST = join(process.cwd(), '../../packages/bin/declarative-routing/dist/index.js')

/**
 * Wait for declarative-routing dist to be built
 * This is needed because turbo runs dev tasks in parallel
 */
async function waitForDeclarativeRoutingDist(maxWaitMs = 60000): Promise<void> {
  const startTime = Date.now()
  const checkInterval = 500 // Check every 500ms
  
  console.log('⏳ Waiting for @repo-bin/declarative-routing to build...')
  
  while (!existsSync(DECLARATIVE_ROUTING_DIST)) {
    if (Date.now() - startTime > maxWaitMs) {
      console.error(`❌ Timeout: declarative-routing dist not found after ${maxWaitMs / 1000}s`)
      console.error(`   Expected at: ${DECLARATIVE_ROUTING_DIST}`)
      process.exit(1)
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval))
  }
  
  console.log('✅ declarative-routing dist is ready')
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
    const result = spawnSync('bun', ['x', 'declarative-routing', 'build'], {
      stdio: 'inherit',
      shell: true,
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
  
  // Wait for declarative-routing to be built (parallel turbo dev tasks)
  await waitForDeclarativeRoutingDist()
  
  // Ensure routes are generated before starting Next.js
  ensureRoutesGenerated()
  
  startProcesses()
}

main()
