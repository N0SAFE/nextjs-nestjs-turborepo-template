/**
 * Installer - Install customization features
 * Part of Phase 5: Customize Command
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import type {
  CustomizeOption,
  InstallationResult,
  CustomizeFile,
  FilePreferences,
} from './types'
import { Logger } from '../utils/logging'

export interface InstallOptions {
  force?: boolean
  backup?: boolean
  preferences?: FilePreferences
}

/**
 * Installs customization features
 */
export class Installer {
  private readonly logger: Logger
  private readonly projectRoot: string

  constructor(projectRoot: string, logger?: Logger) {
    this.projectRoot = projectRoot
    this.logger = logger || new Logger()
  }

  /**
   * Install multiple features
   */
  async installMany(
    options: CustomizeOption[],
    installOptions: InstallOptions = {}
  ): Promise<InstallationResult> {
    const startTime = Date.now()
    const createdFiles: string[] = []
    const mergedConfigs: string[] = []
    const warnings: string[] = []
    const errors: Error[] = []
    const backups: string[] = []

    this.logger.info(`Installing ${options.length} features...`)

    try {
      for (const option of options) {
        await this.installOption(
          option,
          installOptions,
          createdFiles,
          mergedConfigs,
          warnings,
          errors,
          backups
        )
      }

      const endTime = Date.now()
      const totalTime = (endTime - startTime) / 1000

      return {
        success: errors.length === 0,
        installed_options: options.map((o) => o.id),
        created_files: createdFiles,
        merged_configs: mergedConfigs,
        warnings,
        errors,
        summary: {
          total_files_created: createdFiles.length,
          total_configs_merged: mergedConfigs.length,
          total_time: totalTime,
          backups_created: backups.length > 0 ? backups : undefined,
        },
      }
    } catch (error) {
      const endTime = Date.now()
      const totalTime = (endTime - startTime) / 1000

      errors.push(error instanceof Error ? error : new Error(String(error)))

      return {
        success: false,
        installed_options: options.map((o) => o.id),
        created_files: createdFiles,
        merged_configs: mergedConfigs,
        warnings,
        errors,
        summary: {
          total_files_created: createdFiles.length,
          total_configs_merged: mergedConfigs.length,
          total_time: totalTime,
          backups_created: backups.length > 0 ? backups : undefined,
        },
      }
    }
  }

  /**
   * Install a single option
   */
  private async installOption(
    option: CustomizeOption,
    installOptions: InstallOptions,
    createdFiles: string[],
    mergedConfigs: string[],
    warnings: string[],
    errors: Error[],
    backups: string[]
  ): Promise<void> {
    this.logger.info(`Installing ${option.name}...`)

    // Validate option
    if (!option.id || !option.name || !option.version) {
      errors.push(new Error(`Invalid option: missing required fields`))
      return
    }

    // Create backup if requested
    if (installOptions.backup) {
      const backupPath = await this.createBackup(option)
      if (backupPath) {
        backups.push(backupPath)
      }
    }

    // Install files
    if (option.files && option.files.length > 0) {
      for (const file of option.files) {
        try {
          await this.installFile(file, installOptions)
          createdFiles.push(file.destination)
        } catch (error) {
          errors.push(
            error instanceof Error
              ? error
              : new Error(`Failed to install ${file.destination}`)
          )
        }
      }
    }

    // Merge configs
    if (option.configs && option.configs.length > 0) {
      for (const config of option.configs) {
        try {
          await this.mergeConfig(config)
          mergedConfigs.push(config.file)
        } catch (error) {
          errors.push(
            error instanceof Error
              ? error
              : new Error(`Failed to merge config ${config.file}`)
          )
        }
      }
    }

    this.logger.info(`Installed ${option.name} successfully`)
  }

  /**
   * Install a single file
   */
  private async installFile(
    file: CustomizeFile,
    options: InstallOptions
  ): Promise<void> {
    const filePath = path.join(this.projectRoot, file.destination)

    // Check if file exists
    const fileExists = await this.fileExists(filePath)

    if (fileExists && !file.overwrite && !options.force) {
      throw new Error(`File ${file.destination} already exists`)
    }

    // Create directory
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })

    // Read source file content (mock implementation)
    const content = await this.readSourceFile(file.source)

    // Apply template variables if needed
    const finalContent = file.template && file.variables
      ? this.applyVariables(content, file.variables)
      : content

    // Write file
    await fs.writeFile(filePath, finalContent, 'utf-8')
  }

  /**
   * Read source file
   * Validates that source path is safe and reads the file content
   */
  private async readSourceFile(source: string): Promise<string> {
    // Security check: prevent path traversal
    const normalizedPath = path.normalize(source)
    if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
      throw new Error(`Invalid source path: ${source}. Path traversal and absolute paths are not allowed.`)
    }

    // In real implementation, this would read from a registry directory
    // For now, we simulate reading by checking if the path looks valid
    // and throwing an error for obviously invalid paths
    if (source.startsWith('../') || source.includes('/etc/')) {
      throw new Error(`Unsafe file path detected: ${source}`)
    }

    // Return mock content for valid paths
    return `// Content from ${source}\n`
  }

  /**
   * Apply template variables
   */
  private applyVariables(
    content: string,
    variables: Record<string, string>
  ): string {
    let result = content
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return result
  }

  /**
   * Merge configuration
   */
  private async mergeConfig(config: any): Promise<void> {
    // Mock implementation
    this.logger.debug(`Merging config: ${config.file}`)
  }

  /**
   * Create backup
   */
  private async createBackup(option: CustomizeOption): Promise<string | null> {
    if (!option.files || option.files.length === 0) {
      return null
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(
      this.projectRoot,
      '.backups',
      `${option.id}_${timestamp}`
    )

    await fs.mkdir(backupDir, { recursive: true })

    for (const file of option.files) {
      const filePath = path.join(this.projectRoot, file.destination)
      if (await this.fileExists(filePath)) {
        const backupPath = path.join(
          backupDir,
          path.basename(file.destination)
        )
        await fs.copyFile(filePath, backupPath)
      }
    }

    return backupDir
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
}
