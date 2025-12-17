#!/usr/bin/env -S bun

import { spawn } from 'child_process'

function startProduction(): void {
  console.log('🚀 Starting Stats Dashboard in production mode...')

  const process_next = spawn('envcli', ['next', 'start', '-p', '$:{NEXT_PUBLIC_STATS_PORT}'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  })

  const handleExit = (code: number | null) => {
    console.log('Process exited, cleaning up...')
    process_next.kill()
    process.exit(code ?? 1)
  }

  process_next.on('exit', handleExit)

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down...')
    process_next.kill('SIGINT')
  })

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down...')
    process_next.kill('SIGTERM')
  })
}

function main(): void {
  console.log('🎯 Stats Dashboard Production Entrypoint Started\n')
  startProduction()
}

main()
