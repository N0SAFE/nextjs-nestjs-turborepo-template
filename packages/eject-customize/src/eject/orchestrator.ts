/**
 * Eject orchestrator for coordinating the entire ejection workflow
 */

import { FeatureRegistry } from './registry.js'
import { ManifestLoader } from './manifest-loader.js'
import { FeatureRemover } from './remover.js'
import { EjectValidator } from './validator.js'
import { DocumentationUpdater } from './doc-updater.js'
import { EjectOptions, EjectResult, EjectManifest, EjectException } from './types.js'
import { createBackup, BackupInfo } from '../utils/backup-utils.js'
import { isGitRepository, isGitClean, getGitHead, getCurrentBranch } from '../utils/git-utils.js'

export class OrchestratorError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Orchestrator Error: ${message}`)
    this.name = 'OrchestratorError'
    if (cause) this.cause = cause
  }
}

export class EjectOrchestrator {
  constructor(
    private registry: FeatureRegistry,
    private manifestLoader: ManifestLoader,
    private remover: FeatureRemover,
    private validator: EjectValidator,
    private docUpdater: DocumentationUpdater,
    private projectRoot: string
  ) {}

  async executeEject(options: EjectOptions): Promise<EjectResult> {
    const result: EjectResult = {
      success: false,
      featuresEjected: [],
      filesRemoved: 0,
      filesModified: 0,
      manifest: {} as EjectManifest,
      errors: [],
    }

    try {
      // 1. Validate options
      let validationErrors = this.validator.validateAll(options.features, options)

      if (this.validator.hasErrors(validationErrors)) {
        result.errors = validationErrors
        throw new OrchestratorError(
          `Validation failed: ${validationErrors.length} error(s)`
        )
      }

      // 2. Check git status
      if (!options.dryRun && !options.noInteractive) {
        const isGit = isGitRepository(this.projectRoot)
        if (isGit && !isGitClean(this.projectRoot)) {
          result.errors.push({
            code: 'GIT_NOT_CLEAN',
            message: 'Git repository has uncommitted changes. Please commit or stash changes before ejecting.',
            feature: 'general',
            severity: 'error',
          })
          throw new OrchestratorError('Git repository is not clean')
        }
      }

      // 3. Create backup if requested
      let backupInfo: BackupInfo | null = null
      if (options.backup && !options.dryRun) {
        const backupDir = options.outputDir || './.eject-backups'
        backupInfo = await createBackup(this.projectRoot, backupDir)
        result.backupPath = backupInfo.backupPath
      }

      // 4. Get git info for manifest
      const isGit = isGitRepository(this.projectRoot)
      let gitBranch = 'unknown'
      let gitHead = 'unknown'

      if (isGit) {
        try {
          gitBranch = getCurrentBranch(this.projectRoot)
          gitHead = getGitHead(this.projectRoot)
        } catch {
          // Continue with unknown values
        }
      }

      // 5. Create manifest
      const manifest = await this.manifestLoader.create(
        this.projectRoot,
        '1.0.0', // This should come from package.json in real implementation
        options.features,
        backupInfo?.backupPath || 'N/A',
        gitBranch
      )

      // 6. Get files to remove for each feature
      const allChanges = []
      let totalFilesRemoved = 0
      let totalDirsRemoved = 0

      for (const feature of options.features) {
        const featureData = this.registry.getFeature(feature)
        if (!featureData) continue

        // Remove feature directory/files
        if (featureData.type === 'framework' || featureData.type === 'library') {
          // This is simplified - real implementation would have a map of features to files
          const removeResult = await this.remover.removeDirectoryTree(
            `src/${feature}`,
            this.projectRoot,
            { dryRun: options.dryRun }
          )

          allChanges.push(...removeResult.changes)
          totalFilesRemoved += removeResult.filesRemoved.length
          totalDirsRemoved += removeResult.dirsRemoved.length
          result.filesRemoved += removeResult.filesRemoved.length
        }

        result.featuresEjected.push(feature)
      }

      // 7. Update documentation if not dry run
      if (!options.dryRun) {
        await this.manifestLoader.addChanges(allChanges)

        // Update README
        try {
          await this.docUpdater.updateReadme(
            `${this.projectRoot}/README.md`,
            options.features.map((f) => ({ feature: f, action: 'removed' as const }))
          )
        } catch {
          // Continue even if README update fails
        }
      }

      result.manifest = manifest
      result.success = true

      return result
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      throw new OrchestratorError(`Eject operation failed: ${error}`, error as Error)
    }
  }

  async validateBeforeEject(options: EjectOptions): Promise<boolean> {
    const errors = this.validator.validateAll(options.features, options)

    if (this.validator.hasErrors(errors)) {
      return false
    }

    return true
  }

  async simulateEject(options: EjectOptions): Promise<EjectResult> {
    // Run eject with dryRun enabled
    return this.executeEject({
      ...options,
      dryRun: true,
      backup: false,
    })
  }
}
