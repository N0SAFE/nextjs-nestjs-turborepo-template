#!/usr/bin/env -S bun

import { build } from 'bun'
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
 * Run Bun build for declarative-routing CLI
 */
async function runBuild(): Promise<void> {
  const entrypoints = [path.join(srcDir, 'index.ts')]

  const config = {
    entrypoints,
    outdir: distDir,
    minify: false,
    splitting: false,
    target: 'node' as const,
    format: 'cjs' as const,
    sourcemap: 'external' as const,
    external: ['@parcel/watcher'],
  }

  console.log(
    `🔨 Building declarative-routing CLI${watch ? ' (watching for changes)' : ''}...`,
  )

  const result = await build(config)

  if (!result.success) {
    console.error('❌ Build failed')
    process.exit(1)
  }

  console.log(`✅ Successfully built to ${distDir}`)
}

/**
 * Main build function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting build...\n')

  try {
    cleanup()
    await runBuild()
    console.log('\n✅ Build completed successfully!')
  } catch (error) {
    console.error('\n❌ Build failed:', error)
    process.exit(1)
  }
}

await main()
