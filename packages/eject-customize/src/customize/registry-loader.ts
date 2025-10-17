/**
 * Registry Loader for Customize Command
 * Loads and validates customize registries from various sources
 */

import { readFile } from 'fs/promises'
import { resolve } from 'path'
import type { CustomizeRegistry, CustomizeOption, RegistryCompatibility } from './types'
import { Logger, LogLevel } from '../utils/logging'

export interface RegistryLoaderOptions {
  registryPath?: string
  cache?: boolean
  validate?: boolean
  verbose?: boolean
}

export class RegistryLoaderError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'RegistryLoaderError'
  }
}

export class RegistryLoader {
  private cache: Map<string, CustomizeRegistry> = new Map()
  private logger: Logger

  constructor(private options: RegistryLoaderOptions = {}) {
    const logLevel = options.verbose ? LogLevel.DEBUG : LogLevel.INFO
    this.logger = new Logger(logLevel)
  }

  /**
   * Load registry from a path or URL
   */
  async load(source: string): Promise<CustomizeRegistry> {
    // Check cache first
    if (this.options.cache && this.cache.has(source)) {
      this.logger.info('Registry loaded from cache', { source })
      return this.cache.get(source)!
    }

    try {
      this.logger.info('Loading registry', { source })

      // Handle different source types
      let registry: CustomizeRegistry

      if (source.startsWith('http://') || source.startsWith('https://')) {
        throw new RegistryLoaderError(
          'URL_NOT_SUPPORTED',
          'URL loading is not supported in this environment. Use file paths instead.'
        )
      } else if (source.startsWith('file://')) {
        registry = await this.loadFromFile(source.slice(7))
      } else {
        registry = await this.loadFromFile(source)
      }

      // Validate registry if enabled
      if (this.options.validate !== false) {
        this.validateRegistry(registry)
      }

      // Cache if enabled
      if (this.options.cache) {
        this.cache.set(source, registry)
      }

      this.logger.info('Registry loaded successfully', {
        source,
        options_count: registry.options.length,
      })

      return registry
    } catch (error) {
      if (error instanceof RegistryLoaderError) {
        throw error
      }
      throw new RegistryLoaderError(
        'REGISTRY_LOAD_FAILED',
        `Failed to load registry from ${source}: ${error instanceof Error ? error.message : String(error)}`,
        error
      )
    }
  }

  /**
   * Load registry from file
   */
  private async loadFromFile(filePath: string): Promise<CustomizeRegistry> {
    try {
      const absolutePath = resolve(filePath)
      const content = await readFile(absolutePath, 'utf-8')
      return JSON.parse(content) as CustomizeRegistry
    } catch (error) {
      throw new RegistryLoaderError(
        'FILE_READ_FAILED',
        `Cannot read registry file: ${filePath}`,
        error
      )
    }
  }

  /**
   * Validate registry structure
   */
  private validateRegistry(registry: CustomizeRegistry): void {
    const errors: string[] = []

    // Check required fields
    if (!registry.version) errors.push('Missing required field: version')
    if (!registry.name) errors.push('Missing required field: name')
    if (!Array.isArray(registry.options)) errors.push('Missing or invalid field: options')

    // Check options
    if (registry.options) {
      registry.options.forEach((opt, idx) => {
        const optErrors = this.validateOption(opt)
        errors.push(...optErrors.map((e) => `Option[${idx}]: ${e}`))
      })
    }

    if (errors.length > 0) {
      throw new RegistryLoaderError('VALIDATION_FAILED', `Registry validation failed:\n${errors.join('\n')}`)
    }
  }

  /**
   * Validate a single customize option
   */
  private validateOption(option: CustomizeOption): string[] {
    const errors: string[] = []

    if (!option.id) errors.push('Missing required field: id')
    if (!option.name) errors.push('Missing required field: name')
    if (!option.version) errors.push('Missing required field: version')
    if (!option.category) errors.push('Missing required field: category')
    if (typeof option.default !== 'boolean') errors.push('Invalid field: default (must be boolean)')
    if (!Array.isArray(option.files)) errors.push('Invalid field: files (must be array)')
    if (!Array.isArray(option.dependencies)) errors.push('Invalid field: dependencies (must be array)')
    if (!Array.isArray(option.conflicts)) errors.push('Invalid field: conflicts (must be array)')

    return errors
  }

  /**
   * Get option by ID
   */
  getOption(registry: CustomizeRegistry, id: string): CustomizeOption | undefined {
    return registry.options.find((opt) => opt.id === id)
  }

  /**
   * Get options by category
   */
  getOptionsByCategory(registry: CustomizeRegistry, category: string): CustomizeOption[] {
    return registry.options.filter((opt) => opt.category === category)
  }

  /**
   * Check compatibility between registry and project
   */
  checkCompatibility(
    registry: CustomizeRegistry,
    projectVersion: string,
    requiredFeatures?: string[]
  ): RegistryCompatibility | null {
    // Implementation would check version compatibility
    // and required features
    return null
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    this.logger.info('Cache cleared')
  }

  /**
   * Get cached registries
   */
  getCachedRegistries(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Merge multiple registries
   */
  mergeRegistries(registries: CustomizeRegistry[]): CustomizeRegistry {
    if (registries.length === 0) {
      throw new RegistryLoaderError('MERGE_FAILED', 'Cannot merge empty registry list')
    }

    const merged: CustomizeRegistry = {
      version: registries[0].version,
      name: `Merged Registry (${registries.length} sources)`,
      description: `Merged from ${registries.length} registries`,
      options: [],
      categories: {},
      metadata: {
        total_options: 0,
        updated_at: new Date().toISOString(),
      },
    }

    // Merge options (deduplicate by ID)
    const optionMap = new Map<string, CustomizeOption>()
    registries.forEach((reg) => {
      reg.options.forEach((opt) => {
        optionMap.set(opt.id, opt)
      })

      // Merge categories
      Object.assign(merged.categories, reg.categories)
    })

    merged.options = Array.from(optionMap.values())
    merged.metadata.total_options = merged.options.length

    return merged
  }
}
