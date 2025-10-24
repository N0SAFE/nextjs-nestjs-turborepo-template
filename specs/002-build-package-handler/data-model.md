# Data Model — Build package handler (Phase 1 input)

This document defines the core entities, fields, and relationships used by the build system.

## Entities

### BuildJob
Represents a build invocation.

Fields:
- id: string (UUID)
- packageName: string
- packagePath: string
- builder: string (e.g., 'bun'|'esbuild'|'tsc'|'rollup'|'custom')
- inputHash: string  // computed hash of inputs used for caching
- startTime: ISO timestamp
- endTime: ISO timestamp | null
- status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
- exitCode: number | null
- durationMs: number | null
- artifacts: BuildArtifact[]
- logs: string (or path to stored logs)
- metadata: Record<string, unknown> (arbitrary key/value)

### BuildArtifact
Descriptor for produced files.

Fields:
- path: string (relative to repo root or absolute)
- size: number (bytes)
- checksum: string (sha256 hex)
- mimeType?: string
- publishedUri?: string // optional when uploaded to remote storage

### PackageBuildConfig
Per-package configuration (exported as TypeScript `buildConfig`)

Core fields:
- name: string
- friendlyName?: string
- builder?: 'bun'|'esbuild'|'tsc'|'rollup'|'custom'
- builderOptions?: Record<string, unknown>
- entry: string | string[]
- outputDir: string
- artifactGlobs?: string[]
- cache: {
  enabled?: boolean
  include?: string[]
  exclude?: string[]
  strategy?: 'default'|'custom'
}
- prebuild?: string | { cmd: string } | (() => Promise<void>)
- postbuild?: string | { cmd: string } | (() => Promise<void>)
- clean?: string | { cmd: string }
- env?: Record<string,string>
- runtimeValidationSchema?: unknown // e.g. Zod schema exported alongside

### CacheEntry
Metadata about cached build outputs

- key: string (inputHash)
- packageName: string
- artifactPaths: string[]
- createdAt: ISO timestamp
- expiresAt?: ISO timestamp

## Relationships

- BuildJob.artifacts -> BuildArtifact[]
- BuildJob may reference a CacheEntry via inputHash

## Validation rules

- `packageName` must match the package's `package.json` name
- `builder` if provided must be one of allowed values
- `outputDir` must be a path under the package root
- `artifactGlobs` must be array of globs; if absent defaults provided (`dist/**`, `build/**`, `lib/**`, `*.tgz`)

## Sample TypeScript types (sketch)

```ts
export type BuilderName = 'bun'|'esbuild'|'tsc'|'rollup'|'custom'

export interface BuildArtifact {
  path: string
  size: number
  checksum: string
  mimeType?: string
  publishedUri?: string
}

export interface BuildJob {
  id: string
  packageName: string
  packagePath: string
  builder: BuilderName
  inputHash: string
  startTime: string
  endTime?: string
  status: 'pending'|'running'|'success'|'failed'|'cancelled'
  exitCode?: number
  durationMs?: number
  artifacts: BuildArtifact[]
  logs?: string
}
```

## Notes
- For MVP this data is ephemeral and stored in memory + local JSON files under `.build-cache/` per package. If long-term persistence is required later, persist to Postgres via a repository layer that owns BuildJob data.
