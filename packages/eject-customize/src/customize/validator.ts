/**
 * Validator for customize option selections
 * Validates selections for conflicts, dependencies, and file conflicts
 */

import type {
  CustomizeOption,
  CustomizeRegistry,
  CustomizeValidationResult,
  CustomizeValidationError,
  CustomizeValidationWarning,
  FilePreferences,
} from './types'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

// Simple logger for validation
class Logger {
  constructor(private name: string, private verbose?: boolean) {}
  info(message: string): void {
    if (this.verbose) console.log(`[${this.name}] ${message}`)
  }
  debug(message: string): void {
    if (this.verbose) console.debug(`[${this.name}] ${message}`)
  }
}

export interface ValidatorOptions {
  projectRoot?: string
  verbose?: boolean
}

/**
 * Validates customize option selections
 */
export class CustomizeValidator {
  private logger: Logger
  private projectRoot: string

  constructor(options: ValidatorOptions = {}) {
    this.logger = new Logger('CustomizeValidator', options.verbose)
    this.projectRoot = options.projectRoot ?? process.cwd()
  }

  /**
   * Validate selected options
   */
  async validate(
    selectedIds: string[],
    registry: CustomizeRegistry,
    filePreferences: FilePreferences
  ): Promise<CustomizeValidationResult> {
    this.logger.info(`Validating ${selectedIds.length} selected options`)

    const result: CustomizeValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    }

    // Get selected options
    const selectedOptions = this.getSelectedOptions(selectedIds, registry)

    if (selectedOptions.length === 0) {
      result.valid = false
      result.errors.push({
        message: 'No valid options selected',
        code: 'NO_OPTIONS',
        category: 'missing',
        severity: 'error',
      })
      return result
    }

    // Validate each option exists
    this.validateOptionsExist(selectedIds, selectedOptions, result)

    // Check for conflicts between selected options
    this.checkConflicts(selectedOptions, result)

    // Check for missing dependencies
    this.checkDependencies(selectedOptions, selectedIds, registry, result)

    // Check for file conflicts
    await this.checkFileConflicts(selectedOptions, filePreferences, result)

    // Check for compatibility issues
    this.checkCompatibility(selectedOptions, registry, result)

    // Add suggestions
    this.addSuggestions(selectedOptions, selectedIds, registry, result)

    // Final validation
    result.valid = result.errors.length === 0

    this.logger.info(`Validation complete: ${result.valid ? 'PASSED' : 'FAILED'}`)
    this.logger.info(`Errors: ${result.errors.length}, Warnings: ${result.warnings.length}, Suggestions: ${result.suggestions.length}`)

    return result
  }

  /**
   * Get selected options from registry
   */
  private getSelectedOptions(
    selectedIds: string[],
    registry: CustomizeRegistry
  ): CustomizeOption[] {
    return selectedIds
      .map((id) => registry.options.find((opt) => opt.id === id))
      .filter((opt): opt is CustomizeOption => opt !== undefined)
  }

  /**
   * Validate that all selected option IDs exist in registry
   */
  private validateOptionsExist(
    selectedIds: string[],
    selectedOptions: CustomizeOption[],
    result: CustomizeValidationResult
  ): void {
    const foundIds = new Set(selectedOptions.map((opt) => opt.id))
    const missingIds = selectedIds.filter((id) => !foundIds.has(id))

    if (missingIds.length > 0) {
      result.errors.push({
        message: `Options not found in registry: ${missingIds.join(', ')}`,
        code: 'OPTIONS_NOT_FOUND',
        category: 'missing',
        severity: 'error',
      })
    }
  }

  /**
   * Check for conflicts between selected options
   */
  private checkConflicts(
    selectedOptions: CustomizeOption[],
    result: CustomizeValidationResult
  ): void {
    const selectedIds = new Set(selectedOptions.map((opt) => opt.id))

    for (const option of selectedOptions) {
      if (!option.conflicts || option.conflicts.length === 0) {
        continue
      }

      const conflicts = option.conflicts.filter((conflictId) => selectedIds.has(conflictId))

      if (conflicts.length > 0) {
        result.errors.push({
          option_id: option.id,
          message: `Option "${option.name}" conflicts with: ${conflicts.join(', ')}`,
          code: 'OPTION_CONFLICT',
          category: 'conflict',
          severity: 'error',
        })
      }
    }
  }

  /**
   * Check for missing dependencies
   */
  private checkDependencies(
    selectedOptions: CustomizeOption[],
    selectedIds: string[],
    registry: CustomizeRegistry,
    result: CustomizeValidationResult
  ): void {
    const selectedIdSet = new Set(selectedIds)

    for (const option of selectedOptions) {
      if (!option.dependencies || option.dependencies.length === 0) {
        continue
      }

      const missingDeps = option.dependencies.filter((depId) => !selectedIdSet.has(depId))

      if (missingDeps.length > 0) {
        const depNames = missingDeps
          .map((id) => registry.options.find((opt) => opt.id === id)?.name ?? id)
          .join(', ')

        result.errors.push({
          option_id: option.id,
          message: `Option "${option.name}" requires: ${depNames}`,
          code: 'MISSING_DEPENDENCIES',
          category: 'missing',
          severity: 'error',
        })

        // Add suggestion to include dependencies
        result.suggestions.push(
          `Add ${depNames} to satisfy dependencies for "${option.name}"`
        )
      }
    }
  }

  /**
   * Check for file conflicts with existing files
   */
  private async checkFileConflicts(
    selectedOptions: CustomizeOption[],
    filePreferences: FilePreferences,
    result: CustomizeValidationResult
  ): Promise<void> {
    // Collect all files that will be created
    const filesToCreate = new Set<string>()
    const fileSourceMap = new Map<string, string[]>()

    for (const option of selectedOptions) {
      for (const file of option.files) {
        const targetPath = file.destination

        filesToCreate.add(targetPath)

        if (!fileSourceMap.has(targetPath)) {
          fileSourceMap.set(targetPath, [])
        }
        fileSourceMap.get(targetPath)!.push(option.name)
      }
    }

    // Check for files that will be created by multiple options
    for (const [filePath, sources] of fileSourceMap.entries()) {
      if (sources.length > 1) {
        result.warnings.push({
          message: `File "${filePath}" will be created by multiple options: ${sources.join(', ')}`,
          suggestion: 'Review file merge strategy for this file',
        })
      }
    }

    // Check for existing files
    if (!filePreferences.overwrite_existing) {
      for (const filePath of filesToCreate) {
        const fullPath = join(this.projectRoot, filePath)
        if (existsSync(fullPath)) {
          result.warnings.push({
            message: `File "${filePath}" already exists and will be skipped (overwrite disabled)`,
            suggestion: 'Enable overwrite or backup options',
          })
        }
      }
    }
  }

  /**
   * Check compatibility with project
   */
  private checkCompatibility(
    selectedOptions: CustomizeOption[],
    registry: CustomizeRegistry,
    result: CustomizeValidationResult
  ): void {
    // Compatibility checks would go here
    // For now, just log that we checked
    this.logger.debug(`Checked compatibility for ${selectedOptions.length} options`)
    
    // Could add framework-specific checks in the future
    if (registry.metadata?.author) {
      this.logger.debug(`Registry by: ${registry.metadata.author}`)
    }
  }

  /**
   * Add helpful suggestions
   */
  private addSuggestions(
    selectedOptions: CustomizeOption[],
    selectedIds: string[],
    registry: CustomizeRegistry,
    result: CustomizeValidationResult
  ): void {
    const selectedIdSet = new Set(selectedIds)

    // Suggest related options
    for (const option of selectedOptions) {
      // Find options in the same category that aren't selected
      const relatedOptions = registry.options.filter(
        (opt) =>
          opt.category === option.category &&
          opt.id !== option.id &&
          !selectedIdSet.has(opt.id) &&
          !option.conflicts?.includes(opt.id)
      )

      if (relatedOptions.length > 0 && relatedOptions.length <= 3) {
        const names = relatedOptions.map((opt) => opt.name).join(', ')
        result.suggestions.push(
          `Consider adding related ${option.category} options: ${names}`
        )
      }
    }

    // Suggest default options if not selected
    const defaultOptions = registry.options.filter(
      (opt) => opt.default && !selectedIdSet.has(opt.id)
    )

    if (defaultOptions.length > 0) {
      const names = defaultOptions.map((opt) => opt.name).join(', ')
      result.suggestions.push(`Consider including default options: ${names}`)
    }
  }

  /**
   * Validate a single option
   */
  async validateOption(
    optionId: string,
    registry: CustomizeRegistry
  ): Promise<boolean> {
    const option = registry.options.find((opt) => opt.id === optionId)
    return option !== undefined
  }

  /**
   * Get validation summary
   */
  getValidationSummary(result: CustomizeValidationResult): string {
    const parts = [
      `Validation: ${result.valid ? 'PASSED' : 'FAILED'}`,
      `Errors: ${result.errors.length}`,
      `Warnings: ${result.warnings.length}`,
      `Suggestions: ${result.suggestions.length}`,
    ]

    return parts.join(' | ')
  }
}
