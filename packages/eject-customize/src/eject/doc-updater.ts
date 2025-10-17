/**
 * Documentation updater for maintaining README and documentation files
 */

import { readFile, writeFile, fileExists } from '../utils/fs-utils.js'
import path from 'path'

export class DocUpdaterError extends Error {
  constructor(message: string, cause?: Error) {
    super(`DocUpdater Error: ${message}`)
    this.name = 'DocUpdaterError'
    if (cause) this.cause = cause
  }
}

export interface DocUpdateOptions {
  includeRemovalNotes?: boolean
  updateTOC?: boolean
  addDatetime?: boolean
}

export class DocumentationUpdater {
  async updateReadme(
    readmePath: string,
    changes: { feature: string; action: 'removed' | 'modified' }[],
    options: DocUpdateOptions = {}
  ): Promise<void> {
    try {
      const exists = await fileExists(readmePath)

      let content = exists ? await readFile(readmePath) : '# Project Documentation\n'

      const { includeRemovalNotes = true, addDatetime = true } = options

      // Add eject section if it doesn't exist
      if (!content.includes('## Ejected Features')) {
        content += '\n\n## Ejected Features\n'
        if (includeRemovalNotes) {
          content += '\nThe following features have been ejected from this project:\n'
        }
      }

      // Add removal notes
      if (includeRemovalNotes) {
        for (const change of changes.filter((c) => c.action === 'removed')) {
          const entry = `- **${change.feature}**: Ejected${addDatetime ? ` on ${new Date().toLocaleDateString()}` : ''}`

          if (!content.includes(`- **${change.feature}**`)) {
            content += `\n${entry}`
          }
        }
      }

      await writeFile(readmePath, content)
    } catch (error) {
      throw new DocUpdaterError(`Failed to update README at ${readmePath}`, error as Error)
    }
  }

  async addChangelog(
    changelogPath: string,
    version: string,
    changes: { feature: string; description: string }[]
  ): Promise<void> {
    try {
      let content = (await fileExists(changelogPath)) ? await readFile(changelogPath) : '# Changelog\n'

      const changeDate = new Date().toISOString().split('T')[0]
      const versionHeader = `\n## [${version}] - ${changeDate}\n`

      const changeList = changes
        .map((c) => `- **${c.feature}**: ${c.description}`)
        .join('\n')

      const entry = `${versionHeader}\n### Ejected\n${changeList}\n`

      content = entry + content

      await writeFile(changelogPath, content)
    } catch (error) {
      throw new DocUpdaterError(
        `Failed to update changelog at ${changelogPath}`,
        error as Error
      )
    }
  }

  async createEjectionReport(
    reportPath: string,
    projectName: string,
    features: string[],
    filesRemoved: number,
    timestamp: string
  ): Promise<void> {
    try {
      const report = `# Ejection Report

**Project**: ${projectName}
**Date**: ${timestamp}
**Features Ejected**: ${features.length}
**Files Removed**: ${filesRemoved}

## Features

${features.map((f) => `- ${f}`).join('\n')}

## Changes

This report documents the changes made during the ejection process.
For detailed information, refer to the eject manifest file.
`

      await writeFile(reportPath, report)
    } catch (error) {
      throw new DocUpdaterError(`Failed to create ejection report at ${reportPath}`, error as Error)
    }
  }

  async updatePackageJson(
    packageJsonPath: string,
    removedDependencies: string[],
    removedDevDependencies: string[]
  ): Promise<void> {
    try {
      const exists = await fileExists(packageJsonPath)
      if (!exists) {
        throw new DocUpdaterError(`package.json not found at ${packageJsonPath}`)
      }

      const content = await readFile(packageJsonPath)
      let packageJson = JSON.parse(content)

      // Remove dependencies
      if (removedDependencies.length > 0) {
        if (!packageJson.dependencies) {
          packageJson.dependencies = {}
        }

        for (const dep of removedDependencies) {
          delete packageJson.dependencies[dep]
        }
      }

      // Remove devDependencies
      if (removedDevDependencies.length > 0) {
        if (!packageJson.devDependencies) {
          packageJson.devDependencies = {}
        }

        for (const dep of removedDevDependencies) {
          delete packageJson.devDependencies[dep]
        }
      }

      // Add ejection metadata
      if (!packageJson.eject) {
        packageJson.eject = {}
      }

      packageJson.eject.ejectedAt = new Date().toISOString()
      packageJson.eject.removedDependencies = removedDependencies
      packageJson.eject.removedDevDependencies = removedDevDependencies

      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
    } catch (error) {
      throw new DocUpdaterError(
        `Failed to update package.json at ${packageJsonPath}`,
        error as Error
      )
    }
  }

  async addEjectionNote(
    targetPath: string,
    note: string
  ): Promise<void> {
    try {
      let content = (await fileExists(targetPath)) ? await readFile(targetPath) : ''

      // Add comment at the top if it's a text file
      if (targetPath.endsWith('.ts') || targetPath.endsWith('.js')) {
        content = `/**\n * ${note}\n */\n\n${content}`
      } else if (targetPath.endsWith('.json')) {
        // For JSON files, we can't add comments directly
        // This is a limitation we document
      } else {
        content = `# ${note}\n\n${content}`
      }

      await writeFile(targetPath, content)
    } catch (error) {
      throw new DocUpdaterError(`Failed to add ejection note to ${targetPath}`, error as Error)
    }
  }
}
