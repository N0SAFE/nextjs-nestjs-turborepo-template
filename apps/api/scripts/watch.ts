#!/usr/bin/env bun
/**
 * Custom watch script for development that uses chokidar with polling
 * to properly detect file changes in Docker volume mounts.
 * 
 * This script watches for file changes and restarts the Bun process,
 * solving the issue where `bun --watch` doesn't work in Docker because
 * it relies on inotify events which don't propagate through bind mounts.
 */

import { watch } from 'chokidar'
import { spawn, type ChildProcess } from 'child_process'
import { resolve } from 'path'

interface WatchConfig {
  watchPaths: string[]
  ignorePaths: string[]
  command: string
  args: string[]
  debounceMs: number
  usePolling: boolean
}

const config: WatchConfig = {
  watchPaths: ['src/**/*.ts', 'src/**/*.js', 'src/**/*.json'],
  ignorePaths: [
    '**/node_modules/**',
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/dist/**',
    '**/.turbo/**',
  ],
  command: 'bun',
  args: ['--bun', 'src/main.ts'],
  debounceMs: 1000,
  // Use polling in Docker environments (respect CHOKIDAR_USEPOLLING env var)
  usePolling: process.env.CHOKIDAR_USEPOLLING === 'true' || process.env.NODE_ENV === 'development',
}

let currentProcess: ChildProcess | null = null
let restartTimer: NodeJS.Timeout | null = null
let isShuttingDown = false

/**
 * Start the application process
 */
function startProcess(): void {
  if (isShuttingDown) return

  console.log(`\n🚀 Starting: ${config.command} ${config.args.join(' ')}`)
  console.log(`📁 Working directory: ${process.cwd()}`)
  console.log('─'.repeat(60))

  currentProcess = spawn(config.command, config.args, {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      // Ensure the child process knows it's in development
      NODE_ENV: process.env.NODE_ENV || 'development',
    },
  })

  currentProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      if (signal) {
        console.log(`\n⚠️  Process killed with signal: ${signal}`)
      } else if (code !== 0) {
        console.log(`\n❌ Process exited with code: ${code}`)
      }
    }
    currentProcess = null
  })

  currentProcess.on('error', (error) => {
    console.error('\n❌ Failed to start process:', error)
    currentProcess = null
  })
}

/**
 * Stop the current process gracefully
 */
async function stopProcess(): Promise<void> {
  if (!currentProcess) return

  return new Promise((resolve) => {
    if (!currentProcess) {
      resolve()
      return
    }

    console.log('\n🛑 Stopping current process...')

    const timeout = setTimeout(() => {
      if (currentProcess && !currentProcess.killed) {
        console.log('⚠️  Process did not stop gracefully, forcing kill...')
        currentProcess.kill('SIGKILL')
      }
      resolve()
    }, 5000)

    currentProcess.once('exit', () => {
      clearTimeout(timeout)
      resolve()
    })

    // Send SIGTERM for graceful shutdown
    currentProcess.kill('SIGTERM')
  })
}

/**
 * Restart the process (stop then start)
 */
async function restartProcess(): Promise<void> {
  if (isShuttingDown) return

  await stopProcess()
  startProcess()
}

/**
 * Schedule a restart with debouncing
 */
function scheduleRestart(changedPath: string): void {
  if (restartTimer) {
    clearTimeout(restartTimer)
  }

  console.log(`\n📝 File changed: ${changedPath}`)
  console.log(`⏱️  Restart scheduled in ${config.debounceMs}ms...`)

  restartTimer = setTimeout(() => {
    restartTimer = null
    void restartProcess()
  }, config.debounceMs)
}

/**
 * Setup file watcher
 */
function setupWatcher(): void {
  const watchPaths = config.watchPaths.map(p => resolve(process.cwd(), p))

  console.log('👁️  Setting up file watcher...')
  console.log(`📂 Watching: ${config.watchPaths.join(', ')}`)
  console.log(`🚫 Ignoring: ${config.ignorePaths.join(', ')}`)
  console.log(`🔄 Polling: ${config.usePolling ? 'enabled' : 'disabled'}`)
  console.log(`⏱️  Debounce: ${config.debounceMs}ms`)
  console.log('─'.repeat(60))

  const watcher = watch(watchPaths, {
    ignored: config.ignorePaths,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
    // Enable polling for Docker compatibility
    usePolling: config.usePolling,
    interval: 100, // Poll every 100ms
    binaryInterval: 300,
  })

  watcher
    .on('change', (path) => scheduleRestart(path))
    .on('add', (path) => scheduleRestart(path))
    .on('unlink', (path) => {
      console.log(`\n🗑️  File deleted: ${path}`)
      scheduleRestart(path)
    })
    .on('error', (error) => {
      console.error('\n❌ Watcher error:', error)
    })
    .on('ready', () => {
      console.log('✅ File watcher ready!\n')
      console.log('💡 Tip: Make changes to files to trigger auto-restart')
      console.log('💡 Press Ctrl+C to stop\n')
    })

  // Handle process termination
  const shutdown = async () => {
    if (isShuttingDown) return
    isShuttingDown = true

    console.log('\n\n🛑 Shutting down...')

    if (restartTimer) {
      clearTimeout(restartTimer)
    }

    await watcher.close()
    await stopProcess()

    console.log('✅ Shutdown complete')
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

/**
 * Main entry point
 */
function main(): void {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║         🔥 Development Watch Mode (Bun + Chokidar)        ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')

  setupWatcher()
  startProcess()
}

// Start the watcher
main()
