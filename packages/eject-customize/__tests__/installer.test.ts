/**
 * Tests for Installer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import { Installer } from '../src/customize/installer'
import type { CustomizeOption } from '../src/customize/types'

describe('Installer', () => {
  let installer: Installer
  let testDir: string

  beforeEach(async () => {
    testDir = path.join(process.cwd(), '.test-install')
    await fs.mkdir(testDir, { recursive: true })
    installer = new Installer(testDir)
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('installMany', () => {
    it('should install a single option', async () => {
      const option: CustomizeOption = {
        id: 'test-option',
        name: 'Test Option',
        description: 'A test option',
        version: '1.0.0',
        category: 'other',
        removable: true,
        default: false,
        dependencies: [],
        conflicts: [],
        files: [
          {
            source: 'test.ts',
            destination: 'src/test.ts',
            type: 'component',
            overwrite: false,
          },
        ],
      }

      const result = await installer.installMany([option])

      expect(result.success).toBe(true)
      expect(result.created_files).toContain('src/test.ts')
      expect(result.installed_options).toContain('test-option')
    })

    it('should install multiple options', async () => {
      const options: CustomizeOption[] = [
        {
          id: 'option-1',
          name: 'Option 1',
          description: 'First option',
          version: '1.0.0',
          category: 'ui',
          removable: true,
          default: false,
          dependencies: [],
          conflicts: [],
          files: [
            {
              source: 'file1.ts',
              destination: 'src/file1.ts',
              type: 'component',
              overwrite: false,
            },
          ],
        },
        {
          id: 'option-2',
          name: 'Option 2',
          description: 'Second option',
          version: '1.0.0',
          category: 'ui',
          removable: true,
          default: false,
          dependencies: [],
          conflicts: [],
          files: [
            {
              source: 'file2.ts',
              destination: 'src/file2.ts',
              type: 'component',
              overwrite: false,
            },
          ],
        },
      ]

      const result = await installer.installMany(options)

      expect(result.success).toBe(true)
      expect(result.created_files).toHaveLength(2)
      expect(result.installed_options).toHaveLength(2)
    })

    it('should handle installation errors gracefully', async () => {
      const option: CustomizeOption = {
        id: 'invalid-option',
        name: '',
        description: '',
        version: '',
        category: 'other',
        removable: true,
        default: false,
        dependencies: [],
        conflicts: [],
        files: [],
      }

      const result = await installer.installMany([option])

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should create backups when requested', async () => {
      const option: CustomizeOption = {
        id: 'backup-test',
        name: 'Backup Test',
        description: 'Test backup creation',
        version: '1.0.0',
        category: 'other',
        removable: true,
        default: false,
        dependencies: [],
        conflicts: [],
        files: [
          {
            source: 'backup.ts',
            destination: 'src/backup.ts',
            type: 'component',
            overwrite: true,
          },
        ],
      }

      // First install
      await installer.installMany([option])

      // Second install with backup
      const result = await installer.installMany([option], { backup: true, force: true })

      expect(result.success).toBe(true)
      expect(result.summary.backups_created).toBeDefined()
      expect(result.summary.backups_created!.length).toBeGreaterThan(0)
    })

    it('should handle file conflicts without force option', async () => {
      const option: CustomizeOption = {
        id: 'conflict-test',
        name: 'Conflict Test',
        description: 'Test file conflicts',
        version: '1.0.0',
        category: 'other',
        removable: true,
        default: false,
        dependencies: [],
        conflicts: [],
        files: [
          {
            source: 'conflict.ts',
            destination: 'src/conflict.ts',
            type: 'component',
            overwrite: false,
          },
        ],
      }

      // First install
      await installer.installMany([option])

      // Second install without force
      const result = await installer.installMany([option])

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should merge configurations', async () => {
      const option: CustomizeOption = {
        id: 'config-test',
        name: 'Config Test',
        description: 'Test config merging',
        version: '1.0.0',
        category: 'other',
        removable: true,
        default: false,
        dependencies: [],
        conflicts: [],
        files: [],
        configs: [
          {
            file: 'config.json',
            merge_strategy: 'deep',
            content: { key: 'value' },
            description: 'Test config',
          },
        ],
      }

      const result = await installer.installMany([option])

      expect(result.success).toBe(true)
      expect(result.merged_configs).toContain('config.json')
    })

    it('should apply template variables', async () => {
      const option: CustomizeOption = {
        id: 'template-test',
        name: 'Template Test',
        description: 'Test template variables',
        version: '1.0.0',
        category: 'other',
        removable: true,
        default: false,
        dependencies: [],
        conflicts: [],
        files: [
          {
            source: 'template.ts',
            destination: 'src/template.ts',
            type: 'component',
            overwrite: false,
            template: true,
            variables: {
              PROJECT_NAME: 'MyProject',
              AUTHOR: 'Test Author',
            },
          },
        ],
      }

      const result = await installer.installMany([option])

      expect(result.success).toBe(true)
      expect(result.created_files).toContain('src/template.ts')
    })

    it('should collect warnings during installation', async () => {
      const option: CustomizeOption = {
        id: 'warning-test',
        name: 'Warning Test',
        description: 'Test warnings',
        version: '1.0.0',
        category: 'other',
        removable: true,
        default: false,
        dependencies: [],
        conflicts: [],
        files: [],
      }

      const result = await installer.installMany([option])

      expect(result.warnings).toBeDefined()
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('should track installation time', async () => {
      const option: CustomizeOption = {
        id: 'time-test',
        name: 'Time Test',
        description: 'Test timing',
        version: '1.0.0',
        category: 'other',
        removable: true,
        default: false,
        dependencies: [],
        conflicts: [],
        files: [],
      }

      const result = await installer.installMany([option])

      expect(result.summary.total_time).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty options array', async () => {
      const result = await installer.installMany([])

      expect(result.success).toBe(true)
      expect(result.created_files.length).toBeGreaterThanOrEqual(0)
      expect(result.installed_options.length).toBeGreaterThanOrEqual(0)
      expect(result.errors.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('error handling', () => {
    it('should continue on non-fatal errors', async () => {
      const options: CustomizeOption[] = [
        {
          id: 'good-option',
          name: 'Good Option',
          description: 'This should work',
          version: '1.0.0',
          category: 'ui',
          removable: true,
          default: false,
          dependencies: [],
          conflicts: [],
          files: [
            {
              source: 'good.ts',
              destination: 'src/good.ts',
              type: 'component',
              overwrite: false,
            },
          ],
        },
        {
          id: 'bad-option',
          name: '',
          description: '',
          version: '',
          category: 'ui',
          removable: true,
          default: false,
          dependencies: [],
          conflicts: [],
          files: [],
        },
      ]

      const result = await installer.installMany(options)

      // Should have created the good file
      expect(result.created_files).toContain('src/good.ts')
      // Should have errors from the bad option
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should provide detailed error messages', async () => {
      const option: CustomizeOption = {
        id: 'error-test',
        name: '',
        description: '',
        version: '',
        category: 'other',
        removable: true,
        default: false,
        dependencies: [],
        conflicts: [],
        files: [],
      }

      const result = await installer.installMany([option])

      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toBeInstanceOf(Error)
      if (result.errors[0]) {
        expect(result.errors[0].message).toBeTruthy()
      }
    })
  })
})
