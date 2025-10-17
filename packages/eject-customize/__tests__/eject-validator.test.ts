/**
 * Tests for EjectValidator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { tmpdir } from 'os'
import path from 'path'
import { EjectValidator } from '../src/eject/validator.js'
import { FeatureRegistry } from '../src/eject/registry.js'
import { writeFile, removeDirectory } from '../src/utils/fs-utils.js'

describe('EjectValidator', () => {
  let testDir: string
  let registry: FeatureRegistry
  let validator: EjectValidator
  let registryPath: string

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `validator-test-${Date.now()}`)
    registryPath = path.join(testDir, 'registry.json')

    const registryContent = {
      version: '1.0.0',
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        description: 'Test registry',
      },
      features: [
        {
          name: 'tailwind',
          version: '3.0.0',
          description: 'Tailwind CSS',
          type: 'framework' as const,
          removable: true,
          dependencies: [],
          devDependencies: ['tailwindcss'],
        },
        {
          name: 'shadcn',
          version: '1.0.0',
          description: 'Shadcn UI',
          type: 'library' as const,
          removable: true,
          dependencies: ['tailwind'],
          devDependencies: [],
        },
        {
          name: 'core',
          version: '1.0.0',
          description: 'Core library',
          type: 'library' as const,
          removable: false,
          dependencies: [],
        },
      ],
    }

    await writeFile(registryPath, JSON.stringify(registryContent, null, 2))

    registry = new FeatureRegistry(registryPath)
    await registry.load()

    validator = new EjectValidator(registry)
  })

  afterEach(async () => {
    if (testDir) {
      try {
        await removeDirectory(testDir)
      } catch {
        // ignore
      }
    }
  })

  describe('validateOptions', () => {
    it('should report error for empty features', () => {
      const errors = validator.validateOptions({
        features: [],
        dryRun: false,
        backup: true,
        commitChanges: false,
        noInteractive: false,
        verbose: false,
      })

      expect(errors).toHaveLength(1)
      expect(errors[0]?.code).toBe('NO_FEATURES')
    })

    it('should pass for valid options', () => {
      const errors = validator.validateOptions({
        features: ['tailwind'],
        dryRun: false,
        backup: true,
        commitChanges: false,
        noInteractive: false,
        verbose: false,
      })

      expect(errors).toHaveLength(0)
    })
  })

  describe('validateFeatures', () => {
    it('should report error for unknown feature', () => {
      const errors = validator.validateFeatures(['unknown'])

      expect(errors).toHaveLength(1)
      expect(errors[0]?.code).toBe('UNKNOWN_FEATURE')
    })

    it('should report error for non-removable feature', () => {
      const errors = validator.validateFeatures(['core'])

      expect(errors).toHaveLength(1)
      expect(errors[0]?.code).toBe('FEATURE_NOT_REMOVABLE')
    })

    it('should pass for valid removable features', () => {
      const errors = validator.validateFeatures(['tailwind', 'shadcn'])

      expect(errors).toHaveLength(0)
    })
  })

  describe('validateDependencies', () => {
    it('should warn when dependency not being removed', () => {
      const errors = validator.validateDependencies(['shadcn']) // shadcn depends on tailwind

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]?.code).toBe('UNMET_DEPENDENCY')
      expect(errors[0]?.severity).toBe('warning')
    })

    it('should pass when all dependencies are being removed', () => {
      const errors = validator.validateDependencies(['tailwind', 'shadcn'])

      expect(errors).toHaveLength(0)
    })

    it('should pass for feature with no dependencies', () => {
      const errors = validator.validateDependencies(['tailwind'])

      expect(errors).toHaveLength(0)
    })
  })

  describe('validateConflicts', () => {
    it('should report conflicts between features', async () => {
      // Add conflicting features to registry
      const registryPath2 = path.join(testDir, 'registry2.json')
      const registryContent = {
        version: '1.0.0',
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          description: 'Test',
        },
        features: [
          {
            name: 'webpack',
            version: '5.0.0',
            description: 'Webpack',
            type: 'tool' as const,
            removable: true,
            conflicts: ['vite'],
            dependencies: [],
          },
          {
            name: 'vite',
            version: '4.0.0',
            description: 'Vite',
            type: 'tool' as const,
            removable: true,
            conflicts: ['webpack'],
            dependencies: [],
          },
        ],
      }

      await writeFile(registryPath2, JSON.stringify(registryContent, null, 2))

      const reg = new FeatureRegistry(registryPath2)
      await reg.load()

      const val = new EjectValidator(reg)
      const errors = val.validateConflicts(['webpack', 'vite'])

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]?.code).toBe('CONFLICTING_FEATURES')
    })

    it('should pass for non-conflicting features', () => {
      const errors = validator.validateConflicts(['tailwind', 'shadcn'])

      expect(errors).toHaveLength(0)
    })
  })

  describe('validateAll', () => {
    it('should combine all validations', () => {
      const errors = validator.validateAll(
        ['unknown', 'core'],
        {
          features: ['unknown', 'core'],
          dryRun: false,
          backup: true,
          commitChanges: false,
          noInteractive: false,
          verbose: false,
        }
      )

      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('hasErrors', () => {
    it('should identify error severity', () => {
      const errors = [
        { code: 'ERROR', message: 'test', feature: 'f', severity: 'error' as const },
        { code: 'WARN', message: 'test', feature: 'f', severity: 'warning' as const },
      ]

      expect(validator.hasErrors(errors)).toBe(true)
    })

    it('should return false for no errors', () => {
      const errors = [
        { code: 'WARN', message: 'test', feature: 'f', severity: 'warning' as const },
      ]

      expect(validator.hasErrors(errors)).toBe(false)
    })
  })

  describe('hasWarnings', () => {
    it('should identify warning severity', () => {
      const errors = [
        { code: 'WARN', message: 'test', feature: 'f', severity: 'warning' as const },
      ]

      expect(validator.hasWarnings(errors)).toBe(true)
    })

    it('should return false for no warnings', () => {
      const errors = [
        { code: 'ERROR', message: 'test', feature: 'f', severity: 'error' as const },
      ]

      expect(validator.hasWarnings(errors)).toBe(false)
    })
  })

  describe('groupErrorsByFeature', () => {
    it('should group errors by feature', () => {
      const errors = [
        { code: 'E1', message: 'test1', feature: 'f1', severity: 'error' as const },
        { code: 'E2', message: 'test2', feature: 'f1', severity: 'error' as const },
        { code: 'E3', message: 'test3', feature: 'f2', severity: 'error' as const },
      ]

      const grouped = validator.groupErrorsByFeature(errors)

      expect(grouped.size).toBe(2)
      expect(grouped.get('f1')).toHaveLength(2)
      expect(grouped.get('f2')).toHaveLength(1)
    })
  })

  describe('formatErrors', () => {
    it('should format errors as string', () => {
      const errors = [
        { code: 'ERROR1', message: 'Error message', feature: 'f1', severity: 'error' as const },
      ]

      const formatted = validator.formatErrors(errors)

      expect(formatted).toContain('f1')
      expect(formatted).toContain('ERROR1')
      expect(formatted).toContain('Error message')
    })
  })
})
