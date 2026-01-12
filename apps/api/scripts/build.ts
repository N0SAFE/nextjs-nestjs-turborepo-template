#!/usr/bin/env -S bun

import { build, BuildConfig } from 'bun'
import { spawn } from 'child_process'
import { existsSync, rmSync, mkdirSync, cpSync } from 'fs'
import * as path from 'path'

// @ts-expect-error -- Bun provides import.meta.dir
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
 * Copy migrations folder to dist for production use
 */
function copyMigrations(): void {
  const migrationsSource = path.join(srcDir, 'config', 'drizzle', 'migrations')
  const migrationsDest = path.join(distDir, 'migrations')

  if (!existsSync(migrationsSource)) {
    console.warn('⚠️ Migrations folder not found at', migrationsSource)
    return
  }

  // Ensure dist directory exists
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true })
  }

  // Copy migrations folder recursively
  cpSync(migrationsSource, migrationsDest, { recursive: true })
  console.log('📁 Copied migrations to', migrationsDest)
}

/**
 * Run Bun build for NestJS application
 * Builds main.ts and cli.ts entry points with splitting and minification
 * Builds create-default-admin.ts separately as a standalone bundle
 */
async function runBuild(): Promise<void> {
  const scriptsDir = path.join(__dirname)
  
  // Main entrypoints with code splitting
  const mainEntrypoints = [
    path.join(srcDir, 'main.ts'),
    path.join(srcDir, 'cli.ts'),
  ]

  const mainConfig = {
    entrypoints: mainEntrypoints,
    outdir: distDir,
    minify: true,
    splitting: true,
    target: 'bun' as const,
    naming: {
      entry: '[dir]/[name].[ext]',
      chunk: 'chunk-[hash].[ext]',
    },
    external: [
      "class-transformer",
      "@nestjs/microservices",
      "@nestjs/platform-socket.io",
    ]
  } as BuildConfig

  console.log(`🔨 Building NestJS entry points${watch ? ' (watching for changes)' : ''}...`)

  const mainResult = await build(mainConfig)

  if (!mainResult.success) {
    console.error('❌ Main build failed')
    process.exit(1)
  }

  // Build create-default-admin.ts as standalone (no splitting to avoid hash conflicts)
  console.log('🔨 Building create-default-admin script...')
  
  const adminConfig = {
    entrypoints: [path.join(scriptsDir, 'create-default-admin.ts')],
    outdir: distDir,
    minify: true,
    splitting: false, // No splitting for standalone script
    target: 'bun' as const,
    external: [
      "class-transformer",
      "@nestjs/microservices",
      "@nestjs/platform-socket.io",
    ]
  } as BuildConfig

  const adminResult = await build(adminConfig)

  if (!adminResult.success) {
    console.error('❌ Admin script build failed')
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

    // Copy migrations folder to dist for production use
    copyMigrations()

    console.log('\n✅ Build completed successfully!')
  } catch (error) {
    console.error('\n❌ Build failed:', error)
    process.exit(1)
  }
}

// @ts-ignore
await main()
