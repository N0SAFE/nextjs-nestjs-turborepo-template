/**
 * Orchestrator for the customize command workflow
 * Coordinates all Phase 5 modules to execute the complete customize workflow
 */

import type {
  CustomizeRegistry,
  CustomizeOption,
  InstallationPlan,
  InstallationResult,
  FilePreferences,
  CustomizeOrchestratorState,
  CustomizeOrchestratorOptions,
  CustomizeValidationResult,
} from './types'
import { Installer } from './installer'
import { CustomizePrompts } from './prompts'
import { CustomizeValidator } from './validator'
import { RegistryLoader } from './registry-loader'

/**
 * Main orchestrator for customize workflow
 */
export class CustomizeOrchestrator {
  private installer: Installer
  private prompts: CustomizePrompts
  private validator: CustomizeValidator
  private loader: RegistryLoader
  private state: CustomizeOrchestratorState

  constructor(
    private targetDir: string,
    private options: CustomizeOrchestratorOptions = {}
  ) {
    this.installer = new Installer(targetDir)
    this.prompts = new CustomizePrompts({
      verbose: options.verbose,
      skipConfirmation: !options.interactive,
    })
    this.validator = new CustomizeValidator({
      projectRoot: targetDir,
      verbose: options.verbose,
    })
    this.loader = new RegistryLoader({
      verbose: options.verbose,
    })

    this.state = {
      phase: 'loading',
      progress: 0,
    }
  }

  /**
   * Execute the complete customize workflow
   */
  async execute(registryPath: string, preselectedOptions?: string[]): Promise<InstallationResult> {
    try {
      // Phase 1: Load Registry
      await this.updatePhase('loading', 10)
      const registry = await this.loadRegistry(registryPath)

      // Phase 2: Select Options
      await this.updatePhase('selecting', 25)
      const selectedIds = await this.selectOptions(registry, preselectedOptions)

      // Phase 3: Validate Selection
      await this.updatePhase('validating', 40)
      const validation = await this.validateSelection(selectedIds, registry)
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`)
      }

      // Phase 4: Create Installation Plan
      await this.updatePhase('planning', 55)
      const plan = await this.createPlan(selectedIds, registry)

      // Phase 5: Execute Installation
      await this.updatePhase('installing', 70)
      const result = await this.executeInstallation(plan)

      // Complete
      await this.updatePhase('complete', 100)
      this.state.result = result

      return result
    } catch (error) {
      await this.updatePhase('error', this.state.progress)
      this.state.error = error as Error
      throw error
    }
  }

  /**
   * Load customize registry
   */
  private async loadRegistry(registryPath: string): Promise<CustomizeRegistry> {
    const registry = await this.loader.load(`file://${registryPath}`)
    this.state.registry = registry
    return registry
  }

  /**
   * Select options to install
   */
  private async selectOptions(
    registry: CustomizeRegistry,
    preselectedOptions?: string[]
  ): Promise<string[]> {
    const selectedIds = await this.prompts.selectOptions(registry, preselectedOptions)
    this.state.selected_options = selectedIds
    return selectedIds
  }

  /**
   * Validate selected options
   */
  private async validateSelection(
    selectedIds: string[],
    registry: CustomizeRegistry
  ): Promise<CustomizeValidationResult> {
    // Get file preferences
    const selectedOptions = this.getSelectedOptions(selectedIds, registry)
    const filePreferences = await this.prompts.configureFilePreferences(selectedOptions)

    // Validate
    const validation = await this.validator.validate(selectedIds, registry, filePreferences)

    // Show warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        console.warn(`⚠️  ${warning.message}`)
      })
    }

    // Show suggestions if any
    if (validation.suggestions.length > 0 && this.options.verbose) {
      validation.suggestions.forEach((suggestion) => {
        console.log(`💡 ${suggestion}`)
      })
    }

    return validation
  }

  /**
   * Create installation plan
   */
  private async createPlan(
    selectedIds: string[],
    registry: CustomizeRegistry
  ): Promise<InstallationPlan> {
    const selectedOptions = this.getSelectedOptions(selectedIds, registry)
    const filePreferences = await this.prompts.configureFilePreferences(selectedOptions)

    // Build plan
    const plan: InstallationPlan = {
      options_to_install: selectedOptions,
      files_to_create: [],
      configs_to_merge: [],
      total_files: 0,
      total_configs: 0,
      estimated_size: 0,
      estimated_time: 0,
      warnings: [],
    }

    // Collect files and configs from all options
    for (const option of selectedOptions) {
      // Add files
      for (const file of option.files) {
        if (filePreferences.skip_examples && file.type === 'example') {
          continue
        }

        plan.files_to_create.push(file)
        plan.total_files++
        plan.estimated_size += 1024 // Estimate 1KB per file
      }

      // Add configs
      for (const config of option.configs || []) {
        plan.configs_to_merge.push(config)
        plan.total_configs++
      }
    }

    // Estimate time (1 second per file + 2 seconds per config)
    plan.estimated_time = plan.total_files * 1 + plan.total_configs * 2

    // Confirm installation
    const confirmed = await this.prompts.confirmInstallation(plan)
    if (!confirmed && this.options.interactive) {
      throw new Error('Installation cancelled by user')
    }

    this.state.installation_plan = plan
    return plan
  }

  /**
   * Execute installation
   */
  private async executeInstallation(plan: InstallationPlan): Promise<InstallationResult> {
    if (this.options.dry_run) {
      this.prompts.displaySuccess(
        plan.total_files,
        plan.total_configs,
        plan.options_to_install.length
      )

      return {
        success: true,
        installed_options: plan.options_to_install.map((opt) => opt.id),
        created_files: [],
        merged_configs: [],
        errors: [],
        warnings: [],
        summary: {
          total_files_created: 0,
          total_configs_merged: 0,
          total_time: 0,
          backups_created: [],
        },
      }
    }

    // Install all options
    const result = await this.installer.installMany(plan.options_to_install)

    // Display results
    if (result.success) {
      this.prompts.displaySuccess(
        result.created_files.length,
        result.merged_configs.length,
        result.installed_options.length
      )
    } else {
      this.prompts.displayError(new Error('Installation failed'))
      result.errors.forEach((error: Error) => {
        console.error(`❌ ${error.message}`)
      })
    }

    return result
  }

  /**
   * Get selected options from registry
   */
  private getSelectedOptions(selectedIds: string[], registry: CustomizeRegistry): CustomizeOption[] {
    return selectedIds
      .map((id) => registry.options.find((opt) => opt.id === id))
      .filter((opt): opt is CustomizeOption => opt !== undefined)
  }

  /**
   * Update orchestrator phase
   */
  private async updatePhase(
    phase: CustomizeOrchestratorState['phase'],
    progress: number
  ): Promise<void> {
    this.state.phase = phase
    this.state.progress = progress

    if (this.options.verbose) {
      console.log(`[Orchestrator] Phase: ${phase} (${progress}%)`)
    }

    // Small delay to ensure state changes are observable in tests
    // 15ms gives the 10ms interval time to fire at least once
    await new Promise(resolve => setTimeout(resolve, 15))
  }

  /**
   * Get current state
   */
  getState(): CustomizeOrchestratorState {
    return { ...this.state }
  }

  /**
   * Get installation result
   */
  getResult(): InstallationResult | undefined {
    return this.state.result
  }

  /**
   * Check if workflow is complete
   */
  isComplete(): boolean {
    return this.state.phase === 'complete'
  }

  /**
   * Check if workflow has error
   */
  hasError(): boolean {
    return this.state.phase === 'error'
  }

  /**
   * Get error if any
   */
  getError(): Error | undefined {
    return this.state.error
  }
}
