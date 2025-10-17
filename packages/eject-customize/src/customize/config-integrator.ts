/**
 * Config Integrator - Merge configurations into existing files
 * Part of Phase 5: Customize Command
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import type {
  CustomizeConfig,
  ConfigIntegrationResult,
} from './types'
import { Logger } from '../utils/logging'

/**
 * Integrates configuration changes into existing config files
 */
export class ConfigIntegrator {
  private readonly logger: Logger
  private readonly projectRoot: string

  constructor(projectRoot: string, logger?: Logger) {
    this.projectRoot = projectRoot
    this.logger = logger || new Logger()
  }

  /**
   * Integrate a configuration
   */
  async integrate(config: CustomizeConfig): Promise<ConfigIntegrationResult> {
    this.logger.info(`Integrating config: ${config.file}`)

    try {
      const filePath = path.join(this.projectRoot, config.file)
      
      // Check if file exists
      const fileExists = await this.fileExists(filePath)
      
      if (!fileExists) {
        // Create new file with config content
        await this.createConfigFile(filePath, config.content)
        return {
          file: config.file,
          success: true,
          changes_made: Object.keys(config.content).length,
        }
      }

      // Read existing config
      const existingContent = await this.readConfigFile(filePath)
      
      // Merge based on strategy
      const mergedContent = this.mergeContent(
        existingContent,
        config.content,
        config.merge_strategy
      )
      
      // Create backup
      const backupPath = await this.createBackup(filePath)
      
      // Write merged content
      await this.writeConfigFile(filePath, mergedContent)
      
      const changesMade = this.countChanges(existingContent, mergedContent)
      
      return {
        file: config.file,
        success: true,
        changes_made: changesMade,
        backup_created: backupPath,
      }
    } catch (error) {
      return {
        file: config.file,
        success: false,
        changes_made: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  /**
   * Integrate multiple configurations
   */
  async integrateMany(configs: CustomizeConfig[]): Promise<ConfigIntegrationResult[]> {
    const results: ConfigIntegrationResult[] = []

    for (const config of configs) {
      const result = await this.integrate(config)
      results.push(result)
    }

    return results
  }

  /**
   * Merge content based on strategy
   */
  private mergeContent(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>,
    strategy: CustomizeConfig['merge_strategy']
  ): Record<string, unknown> {
    switch (strategy) {
      case 'replace':
        return incoming

      case 'shallow':
        return { ...existing, ...incoming }

      case 'deep':
        return this.deepMerge(existing, incoming)

      case 'append':
        return this.appendMerge(existing, incoming)

      default:
        return this.deepMerge(existing, incoming)
    }
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...target }

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = result[key]

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          result[key] = this.deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>
          )
        } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
          result[key] = [...targetValue, ...sourceValue]
        } else {
          result[key] = sourceValue
        }
      }
    }

    return result
  }

  /**
   * Append merge for arrays
   */
  private appendMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...target }

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = result[key]

        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
          result[key] = [...targetValue, ...sourceValue]
        } else {
          result[key] = sourceValue
        }
      }
    }

    return result
  }

  /**
   * Check if value is a plain object
   */
  private isObject(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof RegExp)
    )
  }

  /**
   * Count changes between two objects
   */
  private countChanges(
    before: Record<string, unknown>,
    after: Record<string, unknown>
  ): number {
    let count = 0

    // Count new keys
    for (const key in after) {
      if (!Object.prototype.hasOwnProperty.call(before, key)) {
        count++
      } else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        count++
      }
    }

    return count
  }

  /**
   * Read config file
   */
  private async readConfigFile(filePath: string): Promise<Record<string, unknown>> {
    const content = await fs.readFile(filePath, 'utf-8')
    
    // Support JSON and JS config files
    if (filePath.endsWith('.json')) {
      return JSON.parse(content)
    }
    
    // For .js/.ts files, try to parse as JSON (mock implementation)
    try {
      return JSON.parse(content)
    } catch {
      // Return empty object if cannot parse
      return {}
    }
  }

  /**
   * Write config file
   */
  private async writeConfigFile(
    filePath: string,
    content: Record<string, unknown>
  ): Promise<void> {
    const formatted = JSON.stringify(content, null, 2)
    await fs.writeFile(filePath, formatted, 'utf-8')
  }

  /**
   * Create new config file
   */
  private async createConfigFile(
    filePath: string,
    content: Record<string, unknown>
  ): Promise<void> {
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    await this.writeConfigFile(filePath, content)
  }

  /**
   * Create backup of file
   */
  private async createBackup(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `${filePath}.backup-${timestamp}`
    await fs.copyFile(filePath, backupPath)
    this.logger.debug(`Created backup: ${backupPath}`)
    return backupPath
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate config structure
   */
  validate(config: CustomizeConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.file) {
      errors.push('Config file path is required')
    }

    if (!config.merge_strategy) {
      errors.push('Merge strategy is required')
    }

    if (!config.content || typeof config.content !== 'object') {
      errors.push('Config content must be an object')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
