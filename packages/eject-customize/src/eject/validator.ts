/**
 * Validator for eject operations
 */

import { FeatureRegistry } from './registry.js'
import { EjectOptions, FeaturePackage, EjectError } from './types.js'

export class ValidationError extends Error {
  constructor(message: string, public errors: EjectError[] = [], cause?: Error) {
    super(`Validation Error: ${message}`)
    this.name = 'ValidationError'
    if (cause) this.cause = cause
  }
}

export class EjectValidator {
  constructor(private registry: FeatureRegistry) {}

  validateOptions(options: EjectOptions): EjectError[] {
    const errors: EjectError[] = []

    if (!options.features || options.features.length === 0) {
      errors.push({
        code: 'NO_FEATURES',
        message: 'At least one feature must be specified for ejection',
        feature: 'general',
        severity: 'error',
      })
    }

    return errors
  }

  validateFeatures(featureNames: string[]): EjectError[] {
    const errors: EjectError[] = []

    for (const featureName of featureNames) {
      if (!this.registry.hasFeature(featureName)) {
        errors.push({
          code: 'UNKNOWN_FEATURE',
          message: `Feature not found in registry: ${featureName}`,
          feature: featureName,
          severity: 'error',
        })
        continue
      }

      const feature = this.registry.getFeature(featureName)!

      if (!feature.removable) {
        errors.push({
          code: 'FEATURE_NOT_REMOVABLE',
          message: `Feature ${featureName} cannot be removed`,
          feature: featureName,
          severity: 'error',
        })
      }
    }

    return errors
  }

  validateDependencies(featureNames: string[]): EjectError[] {
    const errors: EjectError[] = []
    const toRemove = new Set(featureNames)

    for (const featureName of featureNames) {
      const dependencies = this.registry.checkDependencies(featureName)

      for (const dep of dependencies) {
        if (!toRemove.has(dep.name)) {
          errors.push({
            code: 'UNMET_DEPENDENCY',
            message: `Feature ${featureName} depends on ${dep.name}, which is not being removed`,
            feature: featureName,
            severity: 'warning',
          })
        }
      }
    }

    return errors
  }

  validateConflicts(featureNames: string[]): EjectError[] {
    const errors: EjectError[] = []

    for (const featureName of featureNames) {
      const conflicts = this.registry.checkConflicts(featureName, featureNames)

      for (const conflict of conflicts) {
        errors.push({
          code: 'CONFLICTING_FEATURES',
          message: `Feature ${featureName} conflicts with ${conflict.name}`,
          feature: featureName,
          severity: 'error',
        })
      }
    }

    return errors
  }

  validateAll(featureNames: string[], options: EjectOptions): EjectError[] {
    const errors: EjectError[] = []

    errors.push(...this.validateOptions(options))
    errors.push(...this.validateFeatures(featureNames))
    errors.push(...this.validateDependencies(featureNames))
    errors.push(...this.validateConflicts(featureNames))

    return errors
  }

  hasErrors(errors: EjectError[]): boolean {
    return errors.some((e) => e.severity === 'error')
  }

  hasWarnings(errors: EjectError[]): boolean {
    return errors.some((e) => e.severity === 'warning')
  }

  groupErrorsByFeature(errors: EjectError[]): Map<string, EjectError[]> {
    const grouped = new Map<string, EjectError[]>()

    for (const error of errors) {
      if (!grouped.has(error.feature)) {
        grouped.set(error.feature, [])
      }
      grouped.get(error.feature)!.push(error)
    }

    return grouped
  }

  formatErrors(errors: EjectError[]): string {
    const lines: string[] = []

    const grouped = this.groupErrorsByFeature(errors)

    for (const [feature, featureErrors] of grouped) {
      lines.push(`\n${feature}:`)
      for (const error of featureErrors) {
        lines.push(`  [${error.severity.toUpperCase()}] ${error.code}: ${error.message}`)
      }
    }

    return lines.join('\n')
  }
}
