#!/usr/bin/env -S bun

import { execSync } from 'child_process'
import { validateWebEnvSafe, webEnvIsValid } from '@repo/env'
import zod from 'zod/v4'

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
 * Start Next.js in production mode
 */
function startNext(): void {
  console.log('🚀 Starting Next.js in production mode...')

  try {
    execSync('bun run start', { stdio: 'inherit' })
  } catch (error) {
    console.error('❌ Next.js failed to start:', error)
    process.exit(1)
  }
}

/**
 * Main entrypoint
 */
function main(): void {
  console.log('🎯 Web Production Entrypoint Started\n')
  
  // Validate environment before starting
  validateEnvironment()
  
  startNext()
}

main()
