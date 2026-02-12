#!/usr/bin/env bun
/**
 * Standardize all package names to @repo/* scope
 * 
 * This script renames:
 * - @repo-configs/* -> @repo/config-*
 * - @repo-bin/* -> @repo/*
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

// Mapping of old names to new names
const packageRenames: Record<string, string> = {
  '@repo/config-eslint': '@repo/config-eslint',
  '@repo/config-prettier': '@repo/config-prettier',
  '@repo/config-tailwind': '@repo/config-tailwind',
  '@repo/config-typescript': '@repo/config-typescript',
  '@repo/config-vitest': '@repo/config-vitest',
  '@repo/declarative-routing': '@repo/declarative-routing',
  '@repo/runthenkill': '@repo/runthenkill',
}

// Create regex pattern for replacements
const createReplacePattern = (oldName: string): RegExp => {
  const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(escaped, 'g')
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = readdirSync(dirPath)

  files.forEach((file) => {
    const filePath = join(dirPath, file)
    
    // Skip node_modules, dist, .git, etc.
    if (
      file === 'node_modules' ||
      file === 'dist' ||
      file === '.git' ||
      file === '.next' ||
      file === 'coverage' ||
      file === '.turbo' ||
      file === 'out'
    ) {
      return
    }

    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles)
    } else {
      // Only process certain file types
      if (
        file.endsWith('.ts') ||
        file.endsWith('.tsx') ||
        file.endsWith('.js') ||
        file.endsWith('.jsx') ||
        file.endsWith('.json') ||
        file.endsWith('.md') ||
        file.endsWith('.yml') ||
        file.endsWith('.yaml') ||
        file.endsWith('.mts') ||
        file.endsWith('.mjs')
      ) {
        arrayOfFiles.push(filePath)
      }
    }
  })

  return arrayOfFiles
}

function updateFileContent(filePath: string): { updated: boolean; changes: number } {
  try {
    let content = readFileSync(filePath, 'utf-8')
    let originalContent = content
    let changes = 0

    // Replace all old package names with new ones
    for (const [oldName, newName] of Object.entries(packageRenames)) {
      const pattern = createReplacePattern(oldName)
      const matches = content.match(pattern)
      if (matches) {
        content = content.replace(pattern, newName)
        changes += matches.length
      }
    }

    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8')
      return { updated: true, changes }
    }

    return { updated: false, changes: 0 }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
    return { updated: false, changes: 0 }
  }
}

async function main() {
  console.log('🔄 Standardizing package names to @repo/* scope...\n')

  const rootDir = join(import.meta.dir, '..')
  const files = getAllFiles(rootDir)

  console.log(`📁 Found ${files.length} files to process\n`)

  let totalUpdated = 0
  let totalChanges = 0
  const updatedFiles: string[] = []

  for (const file of files) {
    const result = updateFileContent(file)
    if (result.updated) {
      totalUpdated++
      totalChanges += result.changes
      const relativePath = file.replace(rootDir + '/', '')
      updatedFiles.push(`  ✓ ${relativePath} (${result.changes} changes)`)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`  Files processed: ${files.length}`)
  console.log(`  Files updated: ${totalUpdated}`)
  console.log(`  Total changes: ${totalChanges}`)

  if (updatedFiles.length > 0) {
    console.log('\n📝 Updated files:')
    updatedFiles.forEach(file => console.log(file))
  }

  console.log('\n✨ Package name standardization complete!')
  console.log('\n⚠️  Next steps:')
  console.log('  1. Run: bun install (to update lock file)')
  console.log('  2. Run: bun run type-check (to verify no type errors)')
  console.log('  3. Run: bun run test (to verify tests still pass)')
  console.log('  4. Commit the changes')
}

main().catch(console.error)
