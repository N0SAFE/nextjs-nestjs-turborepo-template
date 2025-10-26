#!/usr/bin/env -S bun

import { spawn } from 'child_process'

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
function main(): void {
  console.log('🎯 Web Development Entrypoint Started\n')
  startProcesses()
}

main()
