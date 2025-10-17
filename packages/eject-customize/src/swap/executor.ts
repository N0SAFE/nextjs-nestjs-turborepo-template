/**
 * Framework Swap Executor
 * Executes framework swap plans with dry-run support
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { existsSync } from 'node:fs'
import type {
  FrameworkSwapPlan,
  FrameworkSwapResult,
  FrameworkType,
  SwapOptions,
  FileChange,
  ConfigChange,
  ScriptChange,
  DependencyChange,
} from './types'

export interface SwapExecutorOptions {
  project_root?: string
  verbose?: boolean
  dry_run?: boolean
}

export class SwapExecutor {
  private projectRoot: string
  private options: Required<SwapExecutorOptions>

  constructor(options: SwapExecutorOptions = {}) {
    this.projectRoot = options.project_root ?? process.cwd()
    this.options = {
      project_root: this.projectRoot,
      verbose: options.verbose ?? false,
      dry_run: options.dry_run ?? false,
    }
  }

  /**
   * Execute a framework swap plan
   */
  async execute(plan: FrameworkSwapPlan): Promise<FrameworkSwapResult> {
    const startTime = Date.now()
    const result: FrameworkSwapResult = {
      success: false,
      from_framework: plan.config.from,
      to_framework: plan.config.to,
      dependencies_changed: 0,
      files_changed: 0,
      configs_changed: 0,
      scripts_changed: 0,
      errors: [],
      warnings: plan.warnings,
      manual_steps: plan.manual_steps,
      duration: 0,
    }

    try {
      // Create backup if requested
      if (plan.config.create_backup && !this.options.dry_run) {
        const backupPath = await this.createBackup()
        result.backup_path = backupPath
      }

      // Execute dependency changes
      await this.executeDependencyChanges(plan, result)

      // Execute file changes
      await this.executeFileChanges(plan, result)

      // Execute config changes
      await this.executeConfigChanges(plan, result)

      // Execute script changes
      await this.executeScriptChanges(plan, result)

      result.success = result.errors.length === 0
    } catch (error) {
      result.errors.push(error instanceof Error ? error : new Error(String(error)))
      result.success = false
    } finally {
      result.duration = Date.now() - startTime
    }

    return result
  }

  /**
   * Create backup of current project state
   */
  private async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(this.projectRoot, '.backups', `swap-${timestamp}`)

    if (this.options.verbose) {
      console.log(`Creating backup at ${backupDir}`)
    }

    await fs.mkdir(backupDir, { recursive: true })

    // Backup important files
    const filesToBackup = [
      'package.json',
      'tsconfig.json',
      'next.config.js',
      'next.config.ts',
      'vite.config.ts',
      'vite.config.js',
      'nuxt.config.ts',
      'angular.json',
      'svelte.config.js',
      'astro.config.mjs',
      'remix.config.js',
    ]

    for (const file of filesToBackup) {
      const filePath = path.join(this.projectRoot, file)
      if (existsSync(filePath)) {
        const backupPath = path.join(backupDir, file)
        await fs.copyFile(filePath, backupPath)
      }
    }

    return backupDir
  }

  /**
   * Execute dependency changes
   */
  private async executeDependencyChanges(
    plan: FrameworkSwapPlan,
    result: FrameworkSwapResult
  ): Promise<void> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json')

    if (!existsSync(packageJsonPath)) {
      result.errors.push(new Error('package.json not found'))
      return
    }

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))

      // Remove dependencies
      for (const dep of plan.dependencies_to_remove) {
        if (packageJson.dependencies?.[dep]) {
          if (!this.options.dry_run) {
            delete packageJson.dependencies[dep]
          }
          result.dependencies_changed++
          if (this.options.verbose) {
            console.log(`Removed dependency: ${dep}`)
          }
        }
        if (packageJson.devDependencies?.[dep]) {
          if (!this.options.dry_run) {
            delete packageJson.devDependencies[dep]
          }
          result.dependencies_changed++
          if (this.options.verbose) {
            console.log(`Removed dev dependency: ${dep}`)
          }
        }
      }

      // Add dependencies
      for (const change of plan.dependencies_to_add) {
        if (!packageJson[change.type]) {
          packageJson[change.type] = {}
        }

        if (!this.options.dry_run) {
          packageJson[change.type][change.package] = change.to_version
        }
        result.dependencies_changed++

        if (this.options.verbose) {
          console.log(`Added ${change.type}: ${change.package}@${change.to_version}`)
        }
      }

      // Update dependencies
      for (const change of plan.dependencies_to_update) {
        if (packageJson[change.type]?.[change.package]) {
          if (!this.options.dry_run) {
            packageJson[change.type][change.package] = change.to_version
          }
          result.dependencies_changed++

          if (this.options.verbose) {
            console.log(`Updated ${change.package}: ${change.from_version} → ${change.to_version}`)
          }
        }
      }

      // Write updated package.json
      if (!this.options.dry_run) {
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error
          ? error
          : new Error('Failed to update dependencies in package.json')
      )
    }
  }

  /**
   * Execute file changes
   */
  private async executeFileChanges(
    plan: FrameworkSwapPlan,
    result: FrameworkSwapResult
  ): Promise<void> {
    // Delete files
    for (const filePath of plan.files_to_delete) {
      try {
        const fullPath = path.join(this.projectRoot, filePath)
        if (existsSync(fullPath)) {
          if (!this.options.dry_run) {
            await fs.unlink(fullPath)
          }
          result.files_changed++

          if (this.options.verbose) {
            console.log(`Deleted file: ${filePath}`)
          }
        }
      } catch (error) {
        result.errors.push(
          error instanceof Error ? error : new Error(`Failed to delete ${filePath}`)
        )
      }
    }

    // Create files
    for (const file of plan.files_to_create) {
      try {
        await this.createFile(file, result)
      } catch (error) {
        result.errors.push(
          error instanceof Error ? error : new Error(`Failed to create ${file.path}`)
        )
      }
    }

    // Modify files
    for (const file of plan.files_to_modify) {
      try {
        await this.modifyFile(file, result)
      } catch (error) {
        result.errors.push(
          error instanceof Error ? error : new Error(`Failed to modify ${file.path}`)
        )
      }
    }
  }

  /**
   * Create a new file
   */
  private async createFile(file: FileChange, result: FrameworkSwapResult): Promise<void> {
    // Validate path is relative and doesn't escape project root
    if (path.isAbsolute(file.path)) {
      throw new Error(`Invalid file path: ${file.path} - absolute paths not allowed`)
    }

    // Check for path traversal
    const fullPath = path.join(this.projectRoot, file.path)
    const normalizedPath = path.normalize(fullPath)
    if (!normalizedPath.startsWith(this.projectRoot)) {
      throw new Error(`Invalid file path: ${file.path} - path escapes project root`)
    }

    const dir = path.dirname(fullPath)

    // Create directory if needed
    if (!this.options.dry_run) {
      await fs.mkdir(dir, { recursive: true })
    }

    // Write file content
    if (!this.options.dry_run && file.content) {
      await fs.writeFile(fullPath, file.content, 'utf-8')
    }

    result.files_changed++

    if (this.options.verbose) {
      console.log(`Created file: ${file.path}`)
    }
  }

  /**
   * Modify an existing file
   */
  private async modifyFile(file: FileChange, result: FrameworkSwapResult): Promise<void> {
    const fullPath = path.join(this.projectRoot, file.path)

    if (!existsSync(fullPath)) {
      // If file doesn't exist, create it
      await this.createFile(file, result)
      return
    }

    // For now, replace the entire file content
    // In a more sophisticated implementation, this could do partial updates
    if (!this.options.dry_run && file.content) {
      await fs.writeFile(fullPath, file.content, 'utf-8')
    }

    result.files_changed++

    if (this.options.verbose) {
      console.log(`Modified file: ${file.path}`)
    }
  }

  /**
   * Execute config changes
   */
  private async executeConfigChanges(
    plan: FrameworkSwapPlan,
    result: FrameworkSwapResult
  ): Promise<void> {
    for (const config of plan.configs_to_update) {
      try {
        await this.updateConfig(config, result)
      } catch (error) {
        result.errors.push(
          error instanceof Error ? error : new Error(`Failed to update ${config.file}`)
        )
      }
    }
  }

  /**
   * Update a configuration file
   */
  private async updateConfig(config: ConfigChange, result: FrameworkSwapResult): Promise<void> {
    const configPath = path.join(this.projectRoot, config.file)

    if (!existsSync(configPath)) {
      result.warnings.push(`Config file not found: ${config.file}`)
      return
    }

    try {
      const content = await fs.readFile(configPath, 'utf-8')
      const configObj = JSON.parse(content)

      // Apply changes based on merge strategy
      let updated: any
      switch (config.merge_strategy) {
        case 'replace':
          updated = { ...configObj, ...config.changes }
          break
        case 'merge':
          updated = this.deepMerge(configObj, config.changes)
          break
        case 'append':
          updated = { ...configObj, ...config.changes }
          break
        default:
          updated = this.deepMerge(configObj, config.changes)
      }

      // Write updated config
      if (!this.options.dry_run) {
        await fs.writeFile(configPath, JSON.stringify(updated, null, 2) + '\n', 'utf-8')
      }

      result.configs_changed++

      if (this.options.verbose) {
        console.log(`Updated config: ${config.file}`)
      }
    } catch (error) {
      // If JSON parsing fails, add warning but don't fail the swap
      result.warnings.push(`Could not parse ${config.file} as JSON`)
    }
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target }

    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        output[key] = this.deepMerge(target[key], source[key])
      } else {
        output[key] = source[key]
      }
    }

    return output
  }

  /**
   * Execute script changes
   */
  private async executeScriptChanges(
    plan: FrameworkSwapPlan,
    result: FrameworkSwapResult
  ): Promise<void> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json')

    if (!existsSync(packageJsonPath)) {
      result.errors.push(new Error('package.json not found for script updates'))
      return
    }

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))

      if (!packageJson.scripts) {
        packageJson.scripts = {}
      }

      for (const script of plan.scripts_to_update) {
        if (!this.options.dry_run) {
          packageJson.scripts[script.name] = script.to_command
        }
        result.scripts_changed++

        if (this.options.verbose) {
          console.log(`Updated script "${script.name}": ${script.to_command}`)
        }
      }

      // Write updated package.json
      if (!this.options.dry_run) {
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error : new Error('Failed to update scripts in package.json')
      )
    }
  }

  /**
   * Validate execution environment
   */
  async validateEnvironment(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Check if project root exists
    if (!existsSync(this.projectRoot)) {
      errors.push(`Project root does not exist: ${this.projectRoot}`)
    }

    // Check if package.json exists
    const packageJsonPath = path.join(this.projectRoot, 'package.json')
    if (!existsSync(packageJsonPath)) {
      errors.push('package.json not found in project root')
    }

    // Check write permissions
    try {
      await fs.access(this.projectRoot, fs.constants.W_OK)
    } catch {
      errors.push('No write permission for project root')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get dry-run preview of changes
   */
  async preview(plan: FrameworkSwapPlan): Promise<string> {
    const lines: string[] = []

    lines.push('Framework Swap Preview')
    lines.push('='.repeat(50))
    lines.push(`From: ${plan.config.from}`)
    lines.push(`To: ${plan.config.to}`)
    lines.push('')

    // Dependency changes
    if (
      plan.dependencies_to_add.length > 0 ||
      plan.dependencies_to_remove.length > 0 ||
      plan.dependencies_to_update.length > 0
    ) {
      lines.push('Dependency Changes:')
      lines.push('-'.repeat(50))

      for (const dep of plan.dependencies_to_remove) {
        lines.push(`  - Remove: ${dep}`)
      }

      for (const dep of plan.dependencies_to_add) {
        lines.push(`  + Add: ${dep.package}@${dep.to_version} (${dep.type})`)
      }

      for (const dep of plan.dependencies_to_update) {
        lines.push(`  ~ Update: ${dep.package} ${dep.from_version || '*'} → ${dep.to_version}`)
      }

      lines.push('')
    }

    // File changes
    if (
      plan.files_to_create.length > 0 ||
      plan.files_to_modify.length > 0 ||
      plan.files_to_delete.length > 0
    ) {
      lines.push('File Changes:')
      lines.push('-'.repeat(50))

      for (const file of plan.files_to_delete) {
        lines.push(`  - Delete: ${file}`)
      }

      for (const file of plan.files_to_create) {
        lines.push(`  + Create: ${file.path}`)
      }

      for (const file of plan.files_to_modify) {
        lines.push(`  ~ Modify: ${file.path}`)
      }

      lines.push('')
    }

    // Config changes
    if (plan.configs_to_update.length > 0) {
      lines.push('Config Changes:')
      lines.push('-'.repeat(50))

      for (const config of plan.configs_to_update) {
        lines.push(`  ~ Update: ${config.file} (${config.merge_strategy})`)
      }

      lines.push('')
    }

    // Script changes
    if (plan.scripts_to_update.length > 0) {
      lines.push('Script Changes:')
      lines.push('-'.repeat(50))

      for (const script of plan.scripts_to_update) {
        lines.push(`  ~ Update: ${script.name} → ${script.to_command}`)
      }

      lines.push('')
    }

    // Warnings
    if (plan.warnings.length > 0) {
      lines.push('Warnings:')
      lines.push('-'.repeat(50))
      for (const warning of plan.warnings) {
        lines.push(`  ⚠ ${warning}`)
      }
      lines.push('')
    }

    // Manual steps
    if (plan.manual_steps.length > 0) {
      lines.push('Manual Steps Required:')
      lines.push('-'.repeat(50))
      for (const step of plan.manual_steps) {
        lines.push(`  [${step.priority.toUpperCase()}] ${step.title}`)
        lines.push(`    ${step.description}`)
        if (step.documentation_url) {
          lines.push(`    Docs: ${step.documentation_url}`)
        }
      }
      lines.push('')
    }

    // Summary
    lines.push('Summary:')
    lines.push('-'.repeat(50))
    lines.push(`  Dependencies: ${plan.dependencies_to_add.length + plan.dependencies_to_remove.length + plan.dependencies_to_update.length} changes`)
    lines.push(`  Files: ${plan.files_to_create.length + plan.files_to_modify.length + plan.files_to_delete.length} changes`)
    lines.push(`  Configs: ${plan.configs_to_update.length} updates`)
    lines.push(`  Scripts: ${plan.scripts_to_update.length} updates`)
    lines.push(`  Manual Steps: ${plan.manual_steps.length}`)
    lines.push(`  Estimated Time: ${Math.ceil(plan.estimated_time / 60)} minutes`)

    return lines.join('\n')
  }
}
