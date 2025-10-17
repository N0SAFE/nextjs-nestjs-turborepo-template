/**
 * Eject command type definitions
 */

export interface FeaturePackage {
  name: string
  version: string
  description: string
  type: 'framework' | 'library' | 'tool' | 'config'
  removable: boolean
  dependencies?: string[]
  conflicts?: string[]
  devDependencies?: string[]
}

export interface EjectRegistry {
  version: string
  features: FeaturePackage[]
  metadata: {
    created: string
    updated: string
    description: string
  }
}

export interface EjectManifest {
  projectName: string
  projectVersion: string
  ejectedFeatures: string[]
  ejectionDate: string
  backupPath: string
  gitBranch: string
  changes: EjectChange[]
}

export interface EjectChange {
  type: 'removed' | 'modified' | 'created'
  path: string
  description: string
  reversible: boolean
}

export interface EjectOptions {
  features: string[]
  dryRun: boolean
  backup: boolean
  commitChanges: boolean
  noInteractive: boolean
  verbose: boolean
  outputDir?: string
}

export interface EjectResult {
  success: boolean
  featuresEjected: string[]
  filesRemoved: number
  filesModified: number
  backupPath?: string
  manifest: EjectManifest
  errors: EjectError[]
}

export interface EjectError {
  code: string
  message: string
  feature: string
  severity: 'error' | 'warning' | 'info'
}

export class EjectException extends Error {
  constructor(
    message: string,
    public code: string,
    public feature: string,
    public cause?: Error
  ) {
    super(`Eject Error [${code}]: ${message}`)
    this.name = 'EjectException'
  }
}
