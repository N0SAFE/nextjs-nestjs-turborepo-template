/**
 * Tests for FeatureRegistry
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { tmpdir } from 'os'
import path from 'path'
import { FeatureRegistry, RegistryError } from '../src/eject/registry.js'
import { writeFile, removeDirectory } from '../src/utils/fs-utils.js'

describe('FeatureRegistry', () => {
  let testDir: string
  let registryPath: string

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `registry-test-${Date.now()}`)
    registryPath = path.join(testDir, 'registry.json')

    // Create test registry
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
          description: 'Tailwind CSS framework',
          type: 'framework' as const,
          removable: true,
          dependencies: [],
          devDependencies: ['tailwindcss', 'postcss'],
        },
        {
          name: 'shadcn',
          version: '1.0.0',
          description: 'Shadcn UI components',
          type: 'library' as const,
          removable: true,
          dependencies: ['tailwind'],
          devDependencies: [],
        },
        {
          name: 'core-lib',
          version: '1.0.0',
          description: 'Core library',
          type: 'library' as const,
          removable: false,
          dependencies: [],
        },
      ],
    }

    await writeFile(registryPath, JSON.stringify(registryContent, null, 2))
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

  describe('load', () => {
    it('should load registry from file', async () => {
      const registry = new FeatureRegistry(registryPath)
      const loaded = await registry.load()

      expect(loaded.version).toBe('1.0.0')
      expect(loaded.features).toHaveLength(3)
    })

    it('should throw error if registry file not found', async () => {
      const registry = new FeatureRegistry(path.join(testDir, 'nonexistent.json'))

      await expect(registry.load()).rejects.toThrow(RegistryError)
    })

    it('should validate registry structure', async () => {
      const invalidRegistry = path.join(testDir, 'invalid.json')
      await writeFile(invalidRegistry, '{"version": "1.0.0"}') // Missing features

      const registry = new FeatureRegistry(invalidRegistry)

      await expect(registry.load()).rejects.toThrow(RegistryError)
    })
  })

  describe('getFeature', () => {
    it('should get feature by name', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      const feature = registry.getFeature('tailwind')

      expect(feature).toBeDefined()
      expect(feature?.name).toBe('tailwind')
      expect(feature?.removable).toBe(true)
    })

    it('should return undefined for unknown feature', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      const feature = registry.getFeature('unknown')

      expect(feature).toBeUndefined()
    })

    it('should throw error if registry not loaded', async () => {
      const registry = new FeatureRegistry(registryPath)

      expect(() => registry.getFeature('tailwind')).toThrow(RegistryError)
    })
  })

  describe('getFeatures', () => {
    it('should return all features', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      const features = registry.getFeatures()

      expect(features).toHaveLength(3)
    })

    it('should throw error if registry not loaded', async () => {
      const registry = new FeatureRegistry(registryPath)

      expect(() => registry.getFeatures()).toThrow(RegistryError)
    })
  })

  describe('getRemovableFeatures', () => {
    it('should return only removable features', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      const removable = registry.getRemovableFeatures()

      expect(removable).toHaveLength(2)
      expect(removable.every((f) => f.removable)).toBe(true)
    })
  })

  describe('hasFeature', () => {
    it('should return true for existing feature', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      expect(registry.hasFeature('tailwind')).toBe(true)
    })

    it('should return false for unknown feature', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      expect(registry.hasFeature('unknown')).toBe(false)
    })

    it('should return false if registry not loaded', async () => {
      const registry = new FeatureRegistry(registryPath)

      expect(registry.hasFeature('tailwind')).toBe(false)
    })
  })

  describe('checkDependencies', () => {
    it('should return direct dependencies', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      const deps = registry.checkDependencies('shadcn')

      expect(deps).toHaveLength(1)
      expect(deps[0]?.name).toBe('tailwind')
    })

    it('should return empty for feature with no dependencies', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      const deps = registry.checkDependencies('tailwind')

      expect(deps).toHaveLength(0)
    })

    it('should return empty for unknown feature', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      const deps = registry.checkDependencies('unknown')

      expect(deps).toHaveLength(0)
    })
  })

  describe('checkConflicts', () => {
    it('should find conflicting features', async () => {
      const registryPath2 = path.join(testDir, 'registry2.json')
      const registryContent = {
        version: '1.0.0',
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          description: 'Test registry',
        },
        features: [
          {
            name: 'webpack',
            version: '5.0.0',
            description: 'Webpack bundler',
            type: 'tool' as const,
            removable: true,
            conflicts: ['vite'],
            dependencies: [],
          },
          {
            name: 'vite',
            version: '4.0.0',
            description: 'Vite bundler',
            type: 'tool' as const,
            removable: true,
            conflicts: ['webpack'],
            dependencies: [],
          },
        ],
      }

      await writeFile(registryPath2, JSON.stringify(registryContent, null, 2))

      const registry = new FeatureRegistry(registryPath2)
      await registry.load()

      const conflicts = registry.checkConflicts('webpack', ['vite'])

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0]?.name).toBe('vite')
    })

    it('should return empty for no conflicts', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      const conflicts = registry.checkConflicts('tailwind', ['shadcn'])

      expect(conflicts).toHaveLength(0)
    })
  })

  describe('getRegistryMetadata', () => {
    it('should return metadata', async () => {
      const registry = new FeatureRegistry(registryPath)
      await registry.load()

      const metadata = registry.getRegistryMetadata()

      expect(metadata.description).toBe('Test registry')
      expect(metadata.created).toBeDefined()
      expect(metadata.updated).toBeDefined()
    })
  })
})
