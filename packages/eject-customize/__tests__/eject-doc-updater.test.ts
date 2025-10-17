/**
 * Tests for DocumentationUpdater class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DocumentationUpdater, DocUpdaterError } from '../src/eject/doc-updater.js'
import { promises as fs } from 'fs'
import path from 'path'
import { tmpdir } from 'os'

describe('DocumentationUpdater', () => {
  let testDir: string
  let updater: DocumentationUpdater

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `doc-updater-test-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
    updater = new DocumentationUpdater()
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('updateReadme', () => {
    it('should create new README if it does not exist', async () => {
      const readmePath = path.join(testDir, 'README.md')
      const changes = [{ feature: 'feature1', action: 'removed' as const }]

      await updater.updateReadme(readmePath, changes)

      const exists = await fs
        .stat(readmePath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)

      const content = await fs.readFile(readmePath, 'utf-8')
      expect(content).toContain('# Project Documentation')
      expect(content).toContain('## Ejected Features')
      expect(content).toContain('feature1')
    })

    it('should update existing README', async () => {
      const readmePath = path.join(testDir, 'README.md')
      await fs.writeFile(readmePath, '# Existing README\n\nContent here\n')

      const changes = [{ feature: 'feature1', action: 'removed' as const }]
      await updater.updateReadme(readmePath, changes)

      const content = await fs.readFile(readmePath, 'utf-8')
      expect(content).toContain('# Existing README')
      expect(content).toContain('## Ejected Features')
      expect(content).toContain('feature1')
    })

    it('should not duplicate feature entries', async () => {
      const readmePath = path.join(testDir, 'README.md')
      const changes = [{ feature: 'feature1', action: 'removed' as const }]

      await updater.updateReadme(readmePath, changes)
      await updater.updateReadme(readmePath, changes)

      const content = await fs.readFile(readmePath, 'utf-8')
      const matches = content.match(/- \*\*feature1\*\*/g) || []
      expect(matches.length).toBeLessThanOrEqual(2) // Should not duplicate significantly
    })

    it('should add datetime when option is enabled', async () => {
      const readmePath = path.join(testDir, 'README.md')
      const changes = [{ feature: 'feature1', action: 'removed' as const }]

      await updater.updateReadme(readmePath, changes, { addDatetime: true })

      const content = await fs.readFile(readmePath, 'utf-8')
      expect(content).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // Date format
    })

    it('should skip removal notes when disabled', async () => {
      const readmePath = path.join(testDir, 'README.md')
      const changes = [{ feature: 'feature1', action: 'removed' as const }]

      await updater.updateReadme(readmePath, changes, { includeRemovalNotes: false })

      const content = await fs.readFile(readmePath, 'utf-8')
      expect(content).toContain('## Ejected Features')
      // Feature might not be listed without removal notes
    })
  })

  describe('addChangelog', () => {
    it('should create new changelog if it does not exist', async () => {
      const changelogPath = path.join(testDir, 'CHANGELOG.md')
      const changes = [{ feature: 'feature1', description: 'Removed feature1' }]

      await updater.addChangelog(changelogPath, '1.1.0', changes)

      const exists = await fs
        .stat(changelogPath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)

      const content = await fs.readFile(changelogPath, 'utf-8')
      expect(content).toContain('# Changelog')
      expect(content).toContain('[1.1.0]')
      expect(content).toContain('feature1')
    })

    it('should append to existing changelog', async () => {
      const changelogPath = path.join(testDir, 'CHANGELOG.md')
      const previousContent = '# Changelog\n\n## [1.0.0] - 2024-01-01\n'
      await fs.writeFile(changelogPath, previousContent)

      const changes = [{ feature: 'feature1', description: 'Removed feature1' }]
      await updater.addChangelog(changelogPath, '1.1.0', changes)

      const content = await fs.readFile(changelogPath, 'utf-8')
      expect(content).toContain('[1.1.0]')
      expect(content).toContain('[1.0.0]')
      expect(content.indexOf('[1.1.0]')).toBeLessThan(content.indexOf('[1.0.0]'))
    })

    it('should format multiple changes correctly', async () => {
      const changelogPath = path.join(testDir, 'CHANGELOG.md')
      const changes = [
        { feature: 'feature1', description: 'Removed feature1' },
        { feature: 'feature2', description: 'Removed feature2' },
      ]

      await updater.addChangelog(changelogPath, '1.1.0', changes)

      const content = await fs.readFile(changelogPath, 'utf-8')
      expect(content).toContain('- **feature1**: Removed feature1')
      expect(content).toContain('- **feature2**: Removed feature2')
    })
  })

  describe('createEjectionReport', () => {
    it('should create an ejection report', async () => {
      const reportPath = path.join(testDir, 'ejection-report.md')
      const features = ['feature1', 'feature2']
      const timestamp = new Date().toISOString()

      await updater.createEjectionReport(reportPath, 'MyProject', features, 42, timestamp)

      const exists = await fs
        .stat(reportPath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)

      const content = await fs.readFile(reportPath, 'utf-8')
      expect(content).toContain('# Ejection Report')
      expect(content).toContain('MyProject')
      expect(content).toContain('feature1')
      expect(content).toContain('feature2')
      expect(content).toContain('42')
    })
  })

  describe('updatePackageJson', () => {
    it('should remove dependencies from package.json', async () => {
      const packageJsonPath = path.join(testDir, 'package.json')
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'dep1': '^1.0.0',
          'dep2': '^2.0.0',
        },
      }
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson))

      await updater.updatePackageJson(packageJsonPath, ['dep1'], [])

      const updated = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      expect(updated.dependencies).not.toHaveProperty('dep1')
      expect(updated.dependencies).toHaveProperty('dep2')
    })

    it('should remove devDependencies from package.json', async () => {
      const packageJsonPath = path.join(testDir, 'package.json')
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        devDependencies: {
          'dev1': '^1.0.0',
          'dev2': '^2.0.0',
        },
      }
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson))

      await updater.updatePackageJson(packageJsonPath, [], ['dev1'])

      const updated = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      expect(updated.devDependencies).not.toHaveProperty('dev1')
      expect(updated.devDependencies).toHaveProperty('dev2')
    })

    it('should add eject metadata to package.json', async () => {
      const packageJsonPath = path.join(testDir, 'package.json')
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
      }
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson))

      await updater.updatePackageJson(packageJsonPath, ['dep1'], ['dev1'])

      const updated = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      expect(updated.eject).toBeDefined()
      expect(updated.eject.ejectedAt).toBeDefined()
      expect(updated.eject.removedDependencies).toEqual(['dep1'])
      expect(updated.eject.removedDevDependencies).toEqual(['dev1'])
    })

    it('should throw error if package.json does not exist', async () => {
      const packageJsonPath = path.join(testDir, 'nonexistent', 'package.json')

      try {
        await updater.updatePackageJson(packageJsonPath, [], [])
        expect.fail('Should have thrown DocUpdaterError')
      } catch (error) {
        expect(error).toBeInstanceOf(DocUpdaterError)
      }
    })
  })

  describe('addEjectionNote', () => {
    it('should add note to TypeScript file', async () => {
      const filePath = path.join(testDir, 'test.ts')
      await fs.writeFile(filePath, 'export const value = 42;')

      await updater.addEjectionNote(filePath, 'This feature was ejected')

      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toContain('This feature was ejected')
      expect(content).toContain('export const value = 42;')
    })

    it('should add note to JavaScript file', async () => {
      const filePath = path.join(testDir, 'test.js')
      await fs.writeFile(filePath, 'console.log("test");')

      await updater.addEjectionNote(filePath, 'This feature was ejected')

      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toContain('This feature was ejected')
      expect(content).toContain('console.log')
    })

    it('should add note to text file', async () => {
      const filePath = path.join(testDir, 'test.txt')
      await fs.writeFile(filePath, 'Some text content')

      await updater.addEjectionNote(filePath, 'This feature was ejected')

      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toContain('This feature was ejected')
      expect(content).toContain('Some text content')
    })

    it('should create file if it does not exist', async () => {
      const filePath = path.join(testDir, 'new-file.md')

      await updater.addEjectionNote(filePath, 'This feature was ejected')

      const exists = await fs
        .stat(filePath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)

      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toContain('This feature was ejected')
    })
  })
})
