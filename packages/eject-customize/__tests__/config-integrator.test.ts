/**
 * Tests for ConfigIntegrator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import { ConfigIntegrator } from '../src/customize/config-integrator'
import type { CustomizeConfig } from '../src/customize/types'

describe('ConfigIntegrator', () => {
  let integrator: ConfigIntegrator
  let testDir: string

  beforeEach(async () => {
    testDir = path.join(process.cwd(), '.test-config')
    await fs.mkdir(testDir, { recursive: true })
    integrator = new ConfigIntegrator(testDir)
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('integrate', () => {
    it('should create new config file if it does not exist', async () => {
      const config: CustomizeConfig = {
        file: 'config.json',
        merge_strategy: 'deep',
        content: { key: 'value' },
        description: 'Test config',
      }

      const result = await integrator.integrate(config)

      expect(result.success).toBe(true)
      expect(result.changes_made).toBe(1)

      const filePath = path.join(testDir, 'config.json')
      const content = await fs.readFile(filePath, 'utf-8')
      expect(JSON.parse(content)).toEqual({ key: 'value' })
    })

    it('should merge with existing config using deep strategy', async () => {
      const filePath = path.join(testDir, 'existing.json')
      await fs.writeFile(
        filePath,
        JSON.stringify({ existing: 'value', nested: { a: 1 } }),
        'utf-8'
      )

      const config: CustomizeConfig = {
        file: 'existing.json',
        merge_strategy: 'deep',
        content: { new: 'value', nested: { b: 2 } },
        description: 'Merge test',
      }

      const result = await integrator.integrate(config)

      expect(result.success).toBe(true)
      expect(result.changes_made).toBeGreaterThan(0)

      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      expect(parsed.existing).toBe('value')
      expect(parsed.new).toBe('value')
      expect(parsed.nested.a).toBe(1)
      expect(parsed.nested.b).toBe(2)
    })

    it('should replace config using replace strategy', async () => {
      const filePath = path.join(testDir, 'replace.json')
      await fs.writeFile(
        filePath,
        JSON.stringify({ old: 'value' }),
        'utf-8'
      )

      const config: CustomizeConfig = {
        file: 'replace.json',
        merge_strategy: 'replace',
        content: { new: 'value' },
        description: 'Replace test',
      }

      const result = await integrator.integrate(config)

      expect(result.success).toBe(true)

      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      expect(parsed.old).toBeUndefined()
      expect(parsed.new).toBe('value')
    })

    it('should use shallow merge strategy', async () => {
      const filePath = path.join(testDir, 'shallow.json')
      await fs.writeFile(
        filePath,
        JSON.stringify({ a: 1, nested: { old: 'value' } }),
        'utf-8'
      )

      const config: CustomizeConfig = {
        file: 'shallow.json',
        merge_strategy: 'shallow',
        content: { b: 2, nested: { new: 'value' } },
        description: 'Shallow merge',
      }

      const result = await integrator.integrate(config)

      expect(result.success).toBe(true)

      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      expect(parsed.a).toBe(1)
      expect(parsed.b).toBe(2)
      // Shallow merge replaces nested object entirely
      expect(parsed.nested.old).toBeUndefined()
      expect(parsed.nested.new).toBe('value')
    })

    it('should append arrays using append strategy', async () => {
      const filePath = path.join(testDir, 'append.json')
      await fs.writeFile(
        filePath,
        JSON.stringify({ items: [1, 2, 3] }),
        'utf-8'
      )

      const config: CustomizeConfig = {
        file: 'append.json',
        merge_strategy: 'append',
        content: { items: [4, 5, 6] },
        description: 'Append test',
      }

      const result = await integrator.integrate(config)

      expect(result.success).toBe(true)

      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      expect(parsed.items).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('should create backup of existing file', async () => {
      const filePath = path.join(testDir, 'backup-test.json')
      await fs.writeFile(
        filePath,
        JSON.stringify({ original: 'value' }),
        'utf-8'
      )

      const config: CustomizeConfig = {
        file: 'backup-test.json',
        merge_strategy: 'deep',
        content: { new: 'value' },
        description: 'Backup test',
      }

      const result = await integrator.integrate(config)

      expect(result.success).toBe(true)
      expect(result.backup_created).toBeDefined()
      expect(result.backup_created).toContain('backup-test.json.backup-')

      // Verify backup exists and contains original content
      if (result.backup_created) {
        const backupContent = await fs.readFile(result.backup_created, 'utf-8')
        expect(JSON.parse(backupContent)).toEqual({ original: 'value' })
      }
    })

    it('should handle integration errors gracefully', async () => {
      // Try to write to an existing file as directory
      const filePath = path.join(testDir, 'existing-file.json')
      await fs.writeFile(filePath, '{}', 'utf-8')

      const config: CustomizeConfig = {
        file: 'existing-file.json/nested/config.json', // Try to use file as directory
        merge_strategy: 'deep',
        content: { key: 'value' },
        description: 'Error test',
      }

      const result = await integrator.integrate(config)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should count changes made', async () => {
      const filePath = path.join(testDir, 'changes.json')
      await fs.writeFile(
        filePath,
        JSON.stringify({ a: 1, b: 2 }),
        'utf-8'
      )

      const config: CustomizeConfig = {
        file: 'changes.json',
        merge_strategy: 'deep',
        content: { b: 3, c: 4, d: 5 },
        description: 'Changes count test',
      }

      const result = await integrator.integrate(config)

      expect(result.success).toBe(true)
      expect(result.changes_made).toBeGreaterThan(0)
    })
  })

  describe('integrateMany', () => {
    it('should integrate multiple configs', async () => {
      const configs: CustomizeConfig[] = [
        {
          file: 'config1.json',
          merge_strategy: 'deep',
          content: { key1: 'value1' },
          description: 'Config 1',
        },
        {
          file: 'config2.json',
          merge_strategy: 'deep',
          content: { key2: 'value2' },
          description: 'Config 2',
        },
      ]

      const results = await integrator.integrateMany(configs)

      expect(results).toHaveLength(2)
      expect(results[0]?.success).toBe(true)
      expect(results[1]?.success).toBe(true)
    })

    it('should continue on errors', async () => {
      // Create a file to use as directory path (causes error)
      const blockingFile = path.join(testDir, 'blocking-file.json')
      await fs.writeFile(blockingFile, '{}', 'utf-8')

      const configs: CustomizeConfig[] = [
        {
          file: 'good.json',
          merge_strategy: 'deep',
          content: { key: 'value' },
          description: 'Good config',
        },
        {
          file: 'blocking-file.json/nested/bad.json', // Use file as directory
          merge_strategy: 'deep',
          content: { key: 'value' },
          description: 'Bad config',
        },
      ]

      const results = await integrator.integrateMany(configs)

      expect(results).toHaveLength(2)
      expect(results[0]?.success).toBe(true)
      expect(results[1]?.success).toBe(false)
    })
  })

  describe('validate', () => {
    it('should validate valid config', () => {
      const config: CustomizeConfig = {
        file: 'config.json',
        merge_strategy: 'deep',
        content: { key: 'value' },
        description: 'Valid config',
      }

      const result = integrator.validate(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject config without file', () => {
      const config = {
        merge_strategy: 'deep',
        content: { key: 'value' },
        description: 'Invalid config',
      } as unknown as CustomizeConfig

      const result = integrator.validate(config)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject config without merge strategy', () => {
      const config = {
        file: 'config.json',
        content: { key: 'value' },
        description: 'Invalid config',
      } as unknown as CustomizeConfig

      const result = integrator.validate(config)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject config without content', () => {
      const config = {
        file: 'config.json',
        merge_strategy: 'deep',
        description: 'Invalid config',
      } as CustomizeConfig

      const result = integrator.validate(config)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('merge strategies', () => {
    it('should handle nested object merging', async () => {
      const filePath = path.join(testDir, 'nested.json')
      await fs.writeFile(
        filePath,
        JSON.stringify({
          level1: {
            level2: {
              a: 1,
              b: 2,
            },
          },
        }),
        'utf-8'
      )

      const config: CustomizeConfig = {
        file: 'nested.json',
        merge_strategy: 'deep',
        content: {
          level1: {
            level2: {
              c: 3,
            },
          },
        },
        description: 'Nested merge',
      }

      const result = await integrator.integrate(config)

      expect(result.success).toBe(true)

      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      expect(parsed.level1.level2.a).toBe(1)
      expect(parsed.level1.level2.b).toBe(2)
      expect(parsed.level1.level2.c).toBe(3)
    })

    it('should merge arrays in deep merge', async () => {
      const filePath = path.join(testDir, 'arrays.json')
      await fs.writeFile(
        filePath,
        JSON.stringify({
          items: [1, 2, 3],
        }),
        'utf-8'
      )

      const config: CustomizeConfig = {
        file: 'arrays.json',
        merge_strategy: 'deep',
        content: {
          items: [4, 5],
        },
        description: 'Array merge',
      }

      const result = await integrator.integrate(config)

      expect(result.success).toBe(true)

      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      expect(parsed.items).toEqual([1, 2, 3, 4, 5])
    })
  })
})
