import { z } from 'zod/v4'

/**
 * Core type definitions for the eject-customize system
 */

// Feature registry schemas
export const FeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['auth', 'ui', 'database', 'cache', 'logging', 'monitoring', 'testing', 'other']),
  dependencies: z.array(z.string()).default([]),
  files: z.array(z.string()),
  removable: z.boolean().default(true),
  reversible: z.boolean().default(true),
  relatedFeatures: z.array(z.string()).default([]),
})

export type Feature = z.infer<typeof FeatureSchema>

// Eject manifest
export const EjectManifestSchema = z.object({
  version: z.string(),
  timestamp: z.string().datetime(),
  projectRoot: z.string(),
  ejectedFeatures: z.array(z.string()),
  backupPath: z.string(),
  recoveryFile: z.string(),
  changes: z.array(
    z.object({
      type: z.enum(['file-removed', 'file-modified', 'file-created', 'dependency-removed']),
      target: z.string(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
})

export type EjectManifest = z.infer<typeof EjectManifestSchema>

// Customization module
export const CustomModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  files: z.record(z.object({
    path: z.string(),
    content: z.string(),
    overwrite: z.boolean().default(false),
  })),
  configuration: z.record(z.unknown()).optional(),
  dependencies: z.array(z.string()).default([]),
  devDependencies: z.array(z.string()).default([]),
})

export type CustomModule = z.infer<typeof CustomModuleSchema>

// Error types
export const ErrorCodeSchema = z.enum([
  'EJECT_VALIDATION_FAILED',
  'EJECT_EXECUTION_FAILED',
  'EJECT_RECOVERY_FAILED',
  'CUSTOMIZE_NOT_FOUND',
  'CUSTOMIZE_CONFLICTS',
  'BACKUP_FAILED',
  'GIT_DIRTY',
  'INVALID_PROJECT',
  'UNKNOWN_ERROR',
])

export type ErrorCode = z.infer<typeof ErrorCodeSchema>

// Progress tracking
export const ProgressEventSchema = z.object({
  type: z.enum(['started', 'progress', 'completed', 'error', 'warning']),
  stage: z.string(),
  message: z.string(),
  progress: z.number().min(0).max(100).optional(),
  details: z.record(z.unknown()).optional(),
})

export type ProgressEvent = z.infer<typeof ProgressEventSchema>

// Options
export const EjectOptionsSchema = z.object({
  features: z.array(z.string()),
  force: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  backup: z.boolean().default(true),
  autoResolve: z.boolean().default(false),
})

export type EjectOptions = z.infer<typeof EjectOptionsSchema>

export const CustomizeOptionsSchema = z.object({
  modules: z.array(z.string()),
  force: z.boolean().default(false),
  dryRun: z.boolean().default(false),
})

export type CustomizeOptions = z.infer<typeof CustomizeOptionsSchema>
