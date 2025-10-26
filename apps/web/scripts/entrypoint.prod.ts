#!/usr/bin/env -S bun

import { execSync } from 'child_process'

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
  startNext()
}

main()
