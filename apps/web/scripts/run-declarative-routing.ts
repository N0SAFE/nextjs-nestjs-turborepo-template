#!/usr/bin/env -S bun

import { existsSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'

const LOCAL_CLI_PKG_DIR = join(process.cwd(), '../../packages/bin/declarative-routing')
const LOCAL_CLI_DIST_ENTRY = join(LOCAL_CLI_PKG_DIR, 'dist/index.js')

function run(): void {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('❌ Missing declarative-routing command arguments (e.g. build, build --watch)')
    process.exit(1)
  }

  if (!existsSync(LOCAL_CLI_DIST_ENTRY)) {
    console.log('⚠️  Local declarative-routing dist missing, building local package...')

    const buildResult = spawnSync('bun', ['run', '--cwd', LOCAL_CLI_PKG_DIR, 'build'], {
      stdio: 'inherit',
      env: process.env,
    })

    if (buildResult.status !== 0) {
      console.error('❌ Failed to build local declarative-routing package')
      process.exit(buildResult.status ?? 1)
    }
  }

  if (!existsSync(LOCAL_CLI_DIST_ENTRY)) {
    console.error('❌ Local declarative-routing dist/index.js not found after build')
    console.error(`   Expected at: ${LOCAL_CLI_DIST_ENTRY}`)
    process.exit(1)
  }

  const result = spawnSync('bun', ['--bun', LOCAL_CLI_DIST_ENTRY, ...args], {
    stdio: 'inherit',
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run()
