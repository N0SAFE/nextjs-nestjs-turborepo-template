/**
 * Feature registry loader for discovering available eject features
 */

import { readFile } from '../utils/fs-utils.js'
import { EjectException, EjectRegistry, FeaturePackage } from './types.js'
import path from 'path'

export class RegistryError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Registry Error: ${message}`)
    this.name = 'RegistryError'
    if (cause) this.cause = cause
  }
}

export class FeatureRegistry {
  private registry: EjectRegistry | null = null
  private registryPath: string

  constructor(registryPath: string) {
    this.registryPath = registryPath
  }

  async load(): Promise<EjectRegistry> {
    try {
      const content = await readFile(this.registryPath)
      this.registry = JSON.parse(content) as EjectRegistry

      // Validate registry structure
      this.validateRegistry(this.registry)

      return this.registry
    } catch (error) {
      throw new RegistryError(`Failed to load registry from ${this.registryPath}`, error as Error)
    }
  }

  private validateRegistry(registry: EjectRegistry): void {
    if (!registry.version) {
      throw new RegistryError('Registry missing version field')
    }

    if (!Array.isArray(registry.features)) {
      throw new RegistryError('Registry features must be an array')
    }

    if (!registry.metadata) {
      throw new RegistryError('Registry missing metadata field')
    }
  }

  getFeature(featureName: string): FeaturePackage | undefined {
    if (!this.registry) {
      throw new RegistryError('Registry not loaded. Call load() first.')
    }

    return this.registry.features.find((f) => f.name === featureName)
  }

  getFeatures(): FeaturePackage[] {
    if (!this.registry) {
      throw new RegistryError('Registry not loaded. Call load() first.')
    }

    return this.registry.features
  }

  getRemovableFeatures(): FeaturePackage[] {
    if (!this.registry) {
      throw new RegistryError('Registry not loaded. Call load() first.')
    }

    return this.registry.features.filter((f) => f.removable)
  }

  hasFeature(featureName: string): boolean {
    if (!this.registry) {
      return false
    }

    return this.registry.features.some((f) => f.name === featureName)
  }

  checkDependencies(featureName: string): FeaturePackage[] {
    const feature = this.getFeature(featureName)
    if (!feature) {
      return []
    }

    const dependencies: FeaturePackage[] = []

    if (feature.dependencies) {
      for (const depName of feature.dependencies) {
        const depFeature = this.getFeature(depName)
        if (depFeature) {
          dependencies.push(depFeature)
          // Recursively check dependencies
          dependencies.push(...this.checkDependencies(depName))
        }
      }
    }

    return Array.from(new Map(dependencies.map((d) => [d.name, d])).values())
  }

  checkConflicts(featureName: string, otherFeatures: string[]): FeaturePackage[] {
    const feature = this.getFeature(featureName)
    if (!feature || !feature.conflicts) {
      return []
    }

    const conflicts: FeaturePackage[] = []

    for (const conflictName of feature.conflicts) {
      if (otherFeatures.includes(conflictName)) {
        const conflictFeature = this.getFeature(conflictName)
        if (conflictFeature) {
          conflicts.push(conflictFeature)
        }
      }
    }

    return conflicts
  }

  getRegistryMetadata() {
    if (!this.registry) {
      throw new RegistryError('Registry not loaded. Call load() first.')
    }

    return this.registry.metadata
  }
}

// Example registry factory for creating default registries
export function createDefaultRegistry(registryPath?: string): FeatureRegistry {
  const path = registryPath || './eject-registry.json'
  return new FeatureRegistry(path)
}
