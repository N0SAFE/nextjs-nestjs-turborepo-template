#!/usr/bin/env -S bun

import { build } from 'bun'
import { spawn } from 'child_process'
import { existsSync, rmSync } from 'fs'
import path from 'path'

const __dirname = import.meta.dir
const srcDir = path.join(__dirname, '..', 'src')
const distDir = path.join(__dirname, '..', 'dist')

// Parse command line arguments
const args = process.argv.slice(2)
const watch = args.includes('--watch')

/**
 * Cleanup function to remove dist directory
 */
function cleanup() {
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true })
  }
}

/**
 * Run Bun build for NestJS application
 * Builds only main.ts and cli.ts entry points with splitting and minification
 */
async function runBuild(): Promise<void> {
  const entrypoints = [
    path.join(srcDir, 'main.ts'),
    path.join(srcDir, 'cli.ts'),
  ]

  const config = {
    entrypoints,
    outdir: distDir,
    minify: true,
    splitting: true,
    target: 'bun' as const,
    external: [
      'reflect-metadata',
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/platform-express',
      '@nestjs/config',
      '@orpc/nest',
      '@orpc/server',
      '@orpc/shared',
      'better-auth',
      'drizzle-orm',
      'pg',
      'express',
      'rxjs',
      'zod',
    ],
  }

  console.log(`🔨 Building NestJS entry points${watch ? ' (watching for changes)' : ''}...`)

  const result = await build(config)

  if (!result.success) {
    console.error('❌ Build failed')
    process.exit(1)
  }

  console.log(`✅ Successfully built to ${distDir}`)
}

/**
 * Run database generation using Drizzle Kit
 */
function runDbGenerate(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('📦 Generating database schema...')
    const proc = spawn('bun', ['run', 'db:generate'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..'),
    })

    proc.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Database schema generated')
        resolve()
      } else {
        reject(new Error(`db:generate exited with code ${code}`))
      }
    })

    proc.on('error', reject)
  })
}

/**
 * Main build function - runs Bun build and db:generate concurrently
 */
async function main(): Promise<void> {
  console.log('🚀 Starting concurrent build and database generation...\n')

  try {
    cleanup()

    // Run both build and db:generate concurrently
    await Promise.all([runBuild(), runDbGenerate()])

    console.log('\n✅ Build completed successfully!')
  } catch (error) {
    console.error('\n❌ Build failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
