#!/usr/bin/env -S node --loader tsx

import { execSync, spawnSync } from 'child_process'
import { existsSync } from 'fs'

interface GitRemoteConfig {
  name: string
  url: string
  readonly: boolean
}

const REMOTE_CONFIG: GitRemoteConfig = {
  name: 'upstream',
  url: 'https://github.com/N0SAFE/nextjs-directus-turborepo-template.git',
  readonly: true,
}

/**
 * Check if a git remote already exists
 */
function hasUpstream(remoteName: string): boolean {
  try {
    const remotes = execSync('git remote', { encoding: 'utf8' })
    return remotes.split(/\r?\n/).includes(remoteName)
  } catch (e) {
    return false
  }
}

/**
 * Get list of all git remotes
 */
function getRemotes(): string[] {
  try {
    const remotes = execSync('git remote', { encoding: 'utf8' })
    return remotes.split(/\r?\n/).filter(Boolean)
  } catch (e) {
    return []
  }
}

/**
 * Add upstream remote configuration
 */
function addUpstream(config: GitRemoteConfig): void {
  if (hasUpstream(config.name)) {
    console.log(`ℹ️  Remote '${config.name}' already exists.`)
    return
  }

  try {
    // Add the remote
    execSync(`git remote add ${config.name} ${config.url}`)
    console.log(`✅ Added remote '${config.name}': ${config.url}`)

    // Configure as read-only if specified
    if (config.readonly) {
      execSync(`git remote set-url --push ${config.name} no_push`)
      console.log(`🔒 Configured '${config.name}' as read-only (no push)`)
    }

    // Show the result
    const remoteUrl = execSync(`git config --get remote.${config.name}.url`, {
      encoding: 'utf8',
    }).trim()
    const pushUrl = execSync(
      `git config --get remote.${config.name}.pushurl 2>/dev/null || echo ''`,
      { encoding: 'utf8' }
    ).trim()

    console.log(`\n📋 Remote configuration:`)
    console.log(`   URL: ${remoteUrl}`)
    if (pushUrl) {
      console.log(`   Push URL: ${pushUrl}`)
    }
  } catch (error) {
    const err = error as Error
    console.error(`❌ Failed to add upstream remote: ${err.message}`)
    process.exit(1)
  }
}

/**
 * Verify git repository exists
 */
function verifyGitRepository(): boolean {
  if (!existsSync('.git')) {
    console.error('❌ Not a git repository. Run this from the root of your git repository.')
    return false
  }
  return true
}

/**
 * Main execution
 */
function main(): void {
  console.log('🔗 Setting up upstream remote...\n')

  if (!verifyGitRepository()) {
    process.exit(1)
  }

  const currentRemotes = getRemotes()
  console.log(`📍 Current remotes: ${currentRemotes.length > 0 ? currentRemotes.join(', ') : 'none'}`)
  console.log()

  addUpstream(REMOTE_CONFIG)

  console.log('\n✨ Upstream remote setup complete!')
  console.log('You can now run: git fetch upstream && git rebase upstream/main')
}

main()
