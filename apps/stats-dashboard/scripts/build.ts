#!/usr/bin/env -S bun

import { spawn } from 'child_process'

async function runCommand(
  command: string,
  args: string[],
  description: string,
): Promise<number> {
  console.log(`\n📦 ${description}...`)

  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
    })

    childProcess.on('exit', (code: number | null) => {
      if (code === 0) {
        console.log(`✅ ${description} completed`)
        resolve(code || 0)
      } else {
        reject(new Error(`${description} failed with exit code ${code}`))
      }
    })

    childProcess.on('error', reject)

    const handleSignal = (signal: NodeJS.Signals) => {
      console.log(`\n⚠️  Received ${signal}, shutting down...`)
      childProcess.kill(signal)
      process.exit(1)
    }

    process.once('SIGINT', () => handleSignal('SIGINT'))
    process.once('SIGTERM', () => handleSignal('SIGTERM'))
  })
}

async function build(): Promise<void> {
  console.log('🚀 Starting sequential build process...')

  try {
    await runCommand('bun', ['generate'], 'Generate routes')

    await runCommand(
      'node',
      ['--no-warnings', './node_modules/.bin/next', 'build', '--turbopack'],
      'Build Next.js application',
    )

    console.log('\n✅ Build completed successfully!')
  } catch (error) {
    console.error(
      '\n❌ Build failed:',
      error instanceof Error ? error.message : error,
    )
    process.exit(1)
  }
}

build()
