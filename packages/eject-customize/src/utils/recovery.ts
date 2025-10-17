/**
 * Recovery utilities
 */

import { EjectManifest } from '../types/index.js'
import { readFile, writeFile } from './fs-utils.js'

export class RecoveryError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Recovery Error: ${message}`)
    this.name = 'RecoveryError'
    if (cause) this.cause = cause
  }
}

export async function saveRecoveryManifest(filePath: string, manifest: EjectManifest): Promise<void> {
  try {
    const content = JSON.stringify(manifest, null, 2)
    await writeFile(filePath, content)
  } catch (error) {
    throw new RecoveryError('Failed to save recovery manifest', error as Error)
  }
}

export async function loadRecoveryManifest(filePath: string): Promise<EjectManifest> {
  try {
    const content = await readFile(filePath)
    return JSON.parse(content) as EjectManifest
  } catch (error) {
    throw new RecoveryError('Failed to load recovery manifest', error as Error)
  }
}

export async function verifyRecoveryManifest(manifest: EjectManifest): Promise<boolean> {
  try {
    // Validate required fields
    if (!manifest.version) return false
    if (!manifest.timestamp) return false
    if (!manifest.projectRoot) return false
    if (!Array.isArray(manifest.ejectedFeatures)) return false
    if (!Array.isArray(manifest.changes)) return false

    return true
  } catch {
    return false
  }
}
