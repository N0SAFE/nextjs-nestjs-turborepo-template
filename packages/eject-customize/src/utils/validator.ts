/**
 * Validation utilities
 */

import { Feature, CustomModule } from '../types/index.js'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error'
}

export interface ValidationWarning {
  field: string
  message: string
  severity: 'warning'
}

export class Validator {
  private errors: ValidationError[] = []
  private warnings: ValidationWarning[] = []

  addError(field: string, message: string): void {
    this.errors.push({ field, message, severity: 'error' })
  }

  addWarning(field: string, message: string): void {
    this.warnings.push({ field, message, severity: 'warning' })
  }

  validateFeature(feature: Feature): ValidationResult {
    this.errors = []
    this.warnings = []

    // Validate required fields
    if (!feature.id) this.addError('id', 'Feature ID is required')
    if (!feature.name) this.addError('name', 'Feature name is required')
    if (!feature.category) this.addError('category', 'Feature category is required')
    if (!feature.files || feature.files.length === 0) {
      this.addWarning('files', 'Feature has no files')
    }

    // Validate dependencies exist
    if (feature.dependencies) {
      for (const dep of feature.dependencies) {
        if (typeof dep !== 'string') {
          this.addError('dependencies', `Invalid dependency: ${dep}`)
        }
      }
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    }
  }

  validateCustomModule(module: CustomModule): ValidationResult {
    this.errors = []
    this.warnings = []

    // Validate required fields
    if (!module.id) this.addError('id', 'Module ID is required')
    if (!module.name) this.addError('name', 'Module name is required')
    if (!module.version) this.addError('version', 'Module version is required')
    if (!module.files || Object.keys(module.files).length === 0) {
      this.addError('files', 'Module must have at least one file')
    }

    // Validate file paths
    if (module.files) {
      for (const [key, file] of Object.entries(module.files)) {
        if (!file.path) {
          this.addError(`files.${key}.path`, 'File path is required')
        }
        if (!file.content) {
          this.addWarning(`files.${key}.content`, 'File content is empty')
        }
      }
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    }
  }

  validateDependencies(
    featureIds: string[],
    features: Map<string, Feature>
  ): ValidationResult {
    this.errors = []
    this.warnings = []

    for (const featureId of featureIds) {
      const feature = features.get(featureId)
      if (!feature) {
        this.addError('features', `Unknown feature: ${featureId}`)
        continue
      }

      for (const dep of feature.dependencies || []) {
        if (!featureIds.includes(dep)) {
          this.addWarning(
            featureId,
            `Feature depends on ${dep} which is not being ejected`
          )
        }
      }
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    }
  }
}

export function validateFeature(feature: Feature): ValidationResult {
  const validator = new Validator()
  return validator.validateFeature(feature)
}

export function validateCustomModule(module: CustomModule): ValidationResult {
  const validator = new Validator()
  return validator.validateCustomModule(module)
}
