/**
 * Manifest loader for managing eject operation records
 */

import { readFile, writeFile, fileExists } from '../utils/fs-utils.js'
import { EjectManifest, EjectChange } from './types.js'
import path from 'path'

export class ManifestError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Manifest Error: ${message}`)
    this.name = 'ManifestError'
    if (cause) this.cause = cause
  }
}

export class ManifestLoader {
  private manifestPath: string

  constructor(manifestPath: string) {
    this.manifestPath = manifestPath
  }

  async create(
    projectName: string,
    projectVersion: string,
    features: string[],
    backupPath: string,
    gitBranch: string
  ): Promise<EjectManifest> {
    const manifest: EjectManifest = {
      projectName,
      projectVersion,
      ejectedFeatures: features,
      ejectionDate: new Date().toISOString(),
      backupPath,
      gitBranch,
      changes: [],
    }

    try {
      await writeFile(this.manifestPath, JSON.stringify(manifest, null, 2))
      return manifest
    } catch (error) {
      throw new ManifestError(`Failed to create manifest at ${this.manifestPath}`, error as Error)
    }
  }

  async load(): Promise<EjectManifest> {
    try {
      const exists = await fileExists(this.manifestPath)
      if (!exists) {
        throw new ManifestError(`Manifest not found at ${this.manifestPath}`)
      }

      const content = await readFile(this.manifestPath)
      const manifest = JSON.parse(content) as EjectManifest

      this.validateManifest(manifest)

      return manifest
    } catch (error) {
      if (error instanceof ManifestError) {
        throw error
      }
      throw new ManifestError(`Failed to load manifest from ${this.manifestPath}`, error as Error)
    }
  }

  async save(manifest: EjectManifest): Promise<void> {
    try {
      await writeFile(this.manifestPath, JSON.stringify(manifest, null, 2))
    } catch (error) {
      throw new ManifestError(`Failed to save manifest to ${this.manifestPath}`, error as Error)
    }
  }

  async addChange(change: EjectChange): Promise<void> {
    try {
      const manifest = await this.load()
      manifest.changes.push(change)
      await this.save(manifest)
    } catch (error) {
      throw new ManifestError(`Failed to add change to manifest`, error as Error)
    }
  }

  async addChanges(changes: EjectChange[]): Promise<void> {
    try {
      const manifest = await this.load()
      manifest.changes.push(...changes)
      await this.save(manifest)
    } catch (error) {
      throw new ManifestError(`Failed to add changes to manifest`, error as Error)
    }
  }

  private validateManifest(manifest: EjectManifest): void {
    if (!manifest.projectName) {
      throw new ManifestError('Manifest missing projectName field')
    }

    if (!manifest.ejectedFeatures) {
      throw new ManifestError('Manifest missing ejectedFeatures field')
    }

    if (!Array.isArray(manifest.ejectedFeatures)) {
      throw new ManifestError('ejectedFeatures must be an array')
    }

    if (!manifest.changes) {
      throw new ManifestError('Manifest missing changes field')
    }

    if (!Array.isArray(manifest.changes)) {
      throw new ManifestError('changes must be an array')
    }
  }

  getManifestPath(): string {
    return this.manifestPath
  }
}
