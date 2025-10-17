/**
 * Framework Swap Planner
 * Generates detailed execution plans for framework swaps
 */

import type {
  FrameworkSwapConfig,
  FrameworkSwapPlan,
  DependencyChange,
  FileChange,
  ConfigChange,
  ScriptChange,
  ManualStep,
  FrameworkType,
  FrameworkCompatibility,
  DetectedFramework,
} from './types'
import type { CompatibilityAnalyzer } from './compatibility-analyzer'

export interface SwapPlannerOptions {
  verbose?: boolean
  include_manual_steps?: boolean
  estimate_time?: boolean
}

export class SwapPlanner {
  constructor(private options: SwapPlannerOptions = {}) {}

  /**
   * Generate a complete swap plan
   */
  async generatePlan(
    config: FrameworkSwapConfig,
    fromFramework: DetectedFramework,
    compatibility: FrameworkCompatibility
  ): Promise<FrameworkSwapPlan> {
    const plan: FrameworkSwapPlan = {
      config,
      dependencies_to_add: [],
      dependencies_to_remove: [],
      dependencies_to_update: [],
      files_to_create: [],
      files_to_modify: [],
      files_to_delete: [],
      configs_to_update: [],
      scripts_to_update: [],
      warnings: [],
      manual_steps: [],
      estimated_time: 0,
    }

    // Add warnings from compatibility issues
    this.addCompatibilityWarnings(plan, compatibility)

    // Plan dependency changes
    this.planDependencyChanges(plan, fromFramework, config)

    // Plan file changes
    this.planFileChanges(plan, config)

    // Plan config updates
    this.planConfigUpdates(plan, config)

    // Plan script updates
    this.planScriptUpdates(plan, config)

    // Add manual steps
    if (this.options.include_manual_steps !== false) {
      this.addManualSteps(plan, config, compatibility)
    }

    // Estimate time
    if (this.options.estimate_time !== false) {
      plan.estimated_time = this.estimateSwapTime(plan)
    }

    return plan
  }

  /**
   * Add warnings from compatibility analysis
   */
  private addCompatibilityWarnings(
    plan: FrameworkSwapPlan,
    compatibility: FrameworkCompatibility
  ): void {
    if (!compatibility.compatible) {
      plan.warnings.push(
        `Swapping from ${compatibility.from} to ${compatibility.to} may have compatibility issues`
      )
    }

    if (compatibility.difficulty === 'hard' || compatibility.difficulty === 'very-hard') {
      plan.warnings.push(
        `This swap is rated as ${compatibility.difficulty}. Manual intervention will be required.`
      )
    }

    // Add critical and high severity issues as warnings
    const criticalIssues = compatibility.issues.filter(
      (issue) => issue.severity === 'critical' || issue.severity === 'high'
    )

    for (const issue of criticalIssues) {
      plan.warnings.push(`[${issue.severity.toUpperCase()}] ${issue.description}`)
    }
  }

  /**
   * Plan dependency changes
   */
  private planDependencyChanges(
    plan: FrameworkSwapPlan,
    fromFramework: DetectedFramework,
    config: FrameworkSwapConfig
  ): void {
    if (!config.migrate_dependencies) {
      return
    }

    // Get old and new framework dependencies
    const oldDeps = this.getFrameworkDependencies(config.from)
    const newDeps = this.getFrameworkDependencies(config.to)
    const newDepsSet = new Set(newDeps)

    // Only remove dependencies that are NOT needed in the new framework
    const depsToRemove = oldDeps.filter((dep) => !newDepsSet.has(dep))
    plan.dependencies_to_remove.push(...depsToRemove)

    // Add new framework dependencies
    for (const dep of newDeps) {
      plan.dependencies_to_add.push({
        package: dep,
        to_version: 'latest',
        type: 'dependencies',
        reason: `Required for ${config.to} framework`,
      })
    }

    // Update common dependencies
    this.planCommonDependencyUpdates(plan, config)
  }

  /**
   * Get framework-specific dependencies
   */
  private getFrameworkDependencies(framework: FrameworkType): string[] {
    const deps: Record<FrameworkType, string[]> = {
      nextjs: ['next', 'react', 'react-dom'],
      react: ['react', 'react-dom'],
      vue: ['vue'],
      nuxt: ['nuxt'],
      angular: ['@angular/core', '@angular/common', '@angular/platform-browser'],
      svelte: ['svelte'],
      solid: ['solid-js'],
      qwik: ['@builder.io/qwik'],
      astro: ['astro'],
      remix: ['@remix-run/node', '@remix-run/react', '@remix-run/serve'],
      unknown: [],
    }

    return deps[framework] || []
  }

  /**
   * Plan updates for common dependencies that need version changes
   */
  private planCommonDependencyUpdates(
    plan: FrameworkSwapPlan,
    config: FrameworkSwapConfig
  ): void {
    // TypeScript might need update
    if (this.needsTypeScriptUpdate(config)) {
      plan.dependencies_to_update.push({
        package: 'typescript',
        to_version: '^5.0.0',
        type: 'devDependencies',
        reason: `${config.to} requires TypeScript 5.x`,
      })
    }

    // Build tools might need update
    if (this.needsBuildToolUpdate(config)) {
      plan.dependencies_to_update.push({
        package: 'vite',
        to_version: '^5.0.0',
        type: 'devDependencies',
        reason: `${config.to} uses Vite 5.x`,
      })
    }
  }

  /**
   * Check if TypeScript needs update
   */
  private needsTypeScriptUpdate(config: FrameworkSwapConfig): boolean {
    const tsRequiringFrameworks: FrameworkType[] = ['angular', 'qwik', 'astro', 'solid']
    return tsRequiringFrameworks.includes(config.to)
  }

  /**
   * Check if build tool needs update
   */
  private needsBuildToolUpdate(config: FrameworkSwapConfig): boolean {
    const viteFrameworks: FrameworkType[] = ['vue', 'svelte', 'solid', 'qwik']
    return viteFrameworks.includes(config.to)
  }

  /**
   * Plan file changes
   */
  private planFileChanges(plan: FrameworkSwapPlan, config: FrameworkSwapConfig): void {
    // Plan framework-specific entry files
    this.planEntryFileChanges(plan, config)

    // Plan config file changes
    this.planFrameworkConfigFiles(plan, config)

    // Plan routing file changes
    this.planRoutingChanges(plan, config)
  }

  /**
   * Plan entry file changes (index, app, main, etc.)
   */
  private planEntryFileChanges(plan: FrameworkSwapPlan, config: FrameworkSwapConfig): void {
    const fromEntry = this.getFrameworkEntryFile(config.from)
    const toEntry = this.getFrameworkEntryFile(config.to)

    if (fromEntry !== toEntry) {
      // Delete old entry
      plan.files_to_delete.push(fromEntry)

      // Create new entry
      plan.files_to_create.push({
        path: toEntry,
        action: 'create',
        content: this.getEntryFileTemplate(config.to),
        description: `Create ${config.to} entry file`,
      })
    } else {
      // Modify existing entry
      plan.files_to_modify.push({
        path: toEntry,
        action: 'modify',
        content: this.getEntryFileTemplate(config.to),
        description: `Update entry file for ${config.to}`,
      })
    }
  }

  /**
   * Get framework-specific entry file path
   */
  private getFrameworkEntryFile(framework: FrameworkType): string {
    const entries: Record<FrameworkType, string> = {
      nextjs: 'pages/_app.tsx',
      react: 'src/index.tsx',
      vue: 'src/main.ts',
      nuxt: 'app.vue',
      angular: 'src/main.ts',
      svelte: 'src/main.ts',
      solid: 'src/index.tsx',
      qwik: 'src/entry.ssr.tsx',
      astro: 'src/pages/index.astro',
      remix: 'app/root.tsx',
      unknown: 'src/index.ts',
    }

    return entries[framework] || 'src/index.ts'
  }

  /**
   * Get entry file template content
   */
  private getEntryFileTemplate(framework: FrameworkType): string {
    const templates: Record<FrameworkType, string> = {
      nextjs: `import type { AppProps } from 'next/app'\n\nexport default function App({ Component, pageProps }: AppProps) {\n  return <Component {...pageProps} />\n}\n`,
      react: `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n)\n`,
      vue: `import { createApp } from 'vue'\nimport App from './App.vue'\n\nconst app = createApp(App)\napp.mount('#app')\n`,
      nuxt: `<template>\n  <div>\n    <NuxtPage />\n  </div>\n</template>\n`,
      angular: `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';\nimport { AppModule } from './app/app.module';\n\nplatformBrowserDynamic().bootstrapModule(AppModule)\n  .catch(err => console.error(err));\n`,
      svelte: `import App from './App.svelte'\n\nconst app = new App({\n  target: document.getElementById('app')!\n})\n\nexport default app\n`,
      solid: `import { render } from 'solid-js/web'\nimport App from './App'\n\nrender(() => <App />, document.getElementById('root')!)\n`,
      qwik: `import { component$ } from '@builder.io/qwik'\n\nexport default component$(() => {\n  return <div>Hello Qwik</div>\n})\n`,
      astro: `---\n// Astro page\n---\n<html>\n  <head>\n    <title>Astro</title>\n  </head>\n  <body>\n    <h1>Welcome to Astro</h1>\n  </body>\n</html>\n`,
      remix: `import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react'\n\nexport default function App() {\n  return (\n    <html>\n      <head>\n        <Meta />\n        <Links />\n      </head>\n      <body>\n        <Outlet />\n        <ScrollRestoration />\n        <Scripts />\n        <LiveReload />\n      </body>\n    </html>\n  )\n}\n`,
      unknown: `// Entry file\n`,
    }

    return templates[framework] || '// Entry file\n'
  }

  /**
   * Plan framework config file changes
   */
  private planFrameworkConfigFiles(plan: FrameworkSwapPlan, config: FrameworkSwapConfig): void {
    // Remove old config files
    const oldConfigs = this.getFrameworkConfigFiles(config.from)
    plan.files_to_delete.push(...oldConfigs)

    // Create new config files
    const newConfigs = this.getFrameworkConfigFiles(config.to)
    for (const configFile of newConfigs) {
      plan.files_to_create.push({
        path: configFile,
        action: 'create',
        content: this.getConfigFileTemplate(config.to, configFile),
        description: `Create ${config.to} configuration file`,
      })
    }
  }

  /**
   * Get framework-specific config files
   */
  private getFrameworkConfigFiles(framework: FrameworkType): string[] {
    const configs: Record<FrameworkType, string[]> = {
      nextjs: ['next.config.js'],
      react: ['vite.config.ts'],
      vue: ['vite.config.ts'],
      nuxt: ['nuxt.config.ts'],
      angular: ['angular.json'],
      svelte: ['svelte.config.js', 'vite.config.ts'],
      solid: ['vite.config.ts'],
      qwik: ['vite.config.ts'],
      astro: ['astro.config.mjs'],
      remix: ['remix.config.js'],
      unknown: [],
    }

    return configs[framework] || []
  }

  /**
   * Get config file template
   */
  private getConfigFileTemplate(framework: FrameworkType, configFile: string): string {
    // Return basic templates for each config file
    if (configFile.includes('next.config')) {
      return `/** @type {import('next').NextConfig} */\nconst nextConfig = {}\n\nmodule.exports = nextConfig\n`
    }
    if (configFile.includes('vite.config')) {
      return `import { defineConfig } from 'vite'\n\nexport default defineConfig({})\n`
    }
    if (configFile.includes('nuxt.config')) {
      return `export default defineNuxtConfig({})\n`
    }
    if (configFile.includes('astro.config')) {
      return `import { defineConfig } from 'astro/config'\n\nexport default defineConfig({})\n`
    }
    return '// Configuration file\n'
  }

  /**
   * Plan routing changes
   */
  private planRoutingChanges(plan: FrameworkSwapPlan, config: FrameworkSwapConfig): void {
    const fromRouting = this.getRoutingType(config.from)
    const toRouting = this.getRoutingType(config.to)

    // Only add manual step if include_manual_steps is not explicitly disabled
    if (fromRouting !== toRouting && this.options.include_manual_steps !== false) {
      plan.manual_steps.push({
        title: 'Migrate routing system',
        description: `Convert from ${fromRouting} routing to ${toRouting} routing`,
        priority: 'high',
        category: 'code',
        documentation_url: this.getRoutingDocUrl(config.to),
      })
    }
  }

  /**
   * Get routing type for framework
   */
  private getRoutingType(framework: FrameworkType): string {
    const routing: Record<FrameworkType, string> = {
      nextjs: 'file-based',
      react: 'library-based',
      vue: 'library-based',
      nuxt: 'file-based',
      angular: 'module-based',
      svelte: 'library-based',
      solid: 'library-based',
      qwik: 'file-based',
      astro: 'file-based',
      remix: 'file-based',
      unknown: 'unknown',
    }

    return routing[framework] || 'unknown'
  }

  /**
   * Get routing documentation URL
   */
  private getRoutingDocUrl(framework: FrameworkType): string {
    const urls: Record<FrameworkType, string> = {
      nextjs: 'https://nextjs.org/docs/routing/introduction',
      react: 'https://reactrouter.com/docs/en/v6',
      vue: 'https://router.vuejs.org/',
      nuxt: 'https://nuxt.com/docs/getting-started/routing',
      angular: 'https://angular.io/guide/router',
      svelte: 'https://kit.svelte.dev/docs/routing',
      solid: 'https://docs.solidjs.com/guides/how-to-guides/routing-in-solid/solid-router',
      qwik: 'https://qwik.builder.io/docs/routing/',
      astro: 'https://docs.astro.build/en/core-concepts/routing/',
      remix: 'https://remix.run/docs/en/main/guides/routing',
      unknown: '',
    }

    return urls[framework] || ''
  }

  /**
   * Plan config updates
   */
  private planConfigUpdates(plan: FrameworkSwapPlan, config: FrameworkSwapConfig): void {
    if (!config.update_configs) {
      return
    }

    // Update package.json
    plan.configs_to_update.push({
      file: 'package.json',
      changes: {
        type: this.getPackageType(config.to),
      },
      merge_strategy: 'merge',
      description: 'Update package.json for new framework',
    })

    // Update tsconfig.json
    plan.configs_to_update.push({
      file: 'tsconfig.json',
      changes: this.getTsConfigChanges(config.to),
      merge_strategy: 'merge',
      description: 'Update TypeScript configuration',
    })
  }

  /**
   * Get package type for framework
   */
  private getPackageType(framework: FrameworkType): string {
    const moduleFrameworks: FrameworkType[] = ['astro', 'svelte', 'solid', 'qwik']
    return moduleFrameworks.includes(framework) ? 'module' : 'commonjs'
  }

  /**
   * Get TypeScript config changes
   */
  private getTsConfigChanges(framework: FrameworkType): Record<string, unknown> {
    const baseConfig = {
      compilerOptions: {
        jsx: 'preserve',
        moduleResolution: 'bundler',
      },
    }

    const frameworkConfigs: Record<FrameworkType, Record<string, unknown>> = {
      nextjs: {
        compilerOptions: {
          jsx: 'preserve',
          lib: ['dom', 'dom.iterable', 'esnext'],
        },
      },
      react: {
        compilerOptions: {
          jsx: 'react-jsx',
        },
      },
      vue: {
        compilerOptions: {
          jsx: 'preserve',
        },
      },
      angular: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
      svelte: {
        compilerOptions: {
          types: ['svelte'],
        },
      },
      solid: {
        compilerOptions: {
          jsx: 'preserve',
          jsxImportSource: 'solid-js',
        },
      },
      qwik: {
        compilerOptions: {
          jsx: 'preserve',
          jsxImportSource: '@builder.io/qwik',
        },
      },
      astro: {
        compilerOptions: {
          jsx: 'preserve',
          types: ['astro/client'],
        },
      },
      nuxt: baseConfig,
      remix: baseConfig,
      unknown: baseConfig,
    }

    return frameworkConfigs[framework] || baseConfig
  }

  /**
   * Plan script updates
   */
  private planScriptUpdates(plan: FrameworkSwapPlan, config: FrameworkSwapConfig): void {
    const scripts = this.getFrameworkScripts(config.to)

    for (const [name, command] of Object.entries(scripts)) {
      plan.scripts_to_update.push({
        name,
        to_command: command,
        description: `Update ${name} script for ${config.to}`,
      })
    }
  }

  /**
   * Get framework-specific scripts
   */
  private getFrameworkScripts(framework: FrameworkType): Record<string, string> {
    const scripts: Record<FrameworkType, Record<string, string>> = {
      nextjs: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      react: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      vue: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      nuxt: {
        dev: 'nuxt dev',
        build: 'nuxt build',
        start: 'nuxt start',
      },
      angular: {
        dev: 'ng serve',
        build: 'ng build',
        test: 'ng test',
      },
      svelte: {
        dev: 'vite dev',
        build: 'vite build',
        preview: 'vite preview',
      },
      solid: {
        dev: 'vite',
        build: 'vite build',
        serve: 'vite preview',
      },
      qwik: {
        dev: 'vite --mode ssr',
        build: 'vite build',
        preview: 'vite preview',
      },
      astro: {
        dev: 'astro dev',
        build: 'astro build',
        preview: 'astro preview',
      },
      remix: {
        dev: 'remix dev',
        build: 'remix build',
        start: 'remix-serve build',
      },
      unknown: {},
    }

    return scripts[framework] || {}
  }

  /**
   * Add manual steps
   */
  private addManualSteps(
    plan: FrameworkSwapPlan,
    config: FrameworkSwapConfig,
    compatibility: FrameworkCompatibility
  ): void {
    // Add steps for critical issues
    const criticalIssues = compatibility.issues.filter((i) => i.severity === 'critical')
    for (const issue of criticalIssues) {
      plan.manual_steps.push({
        title: issue.description,
        description: issue.suggestion,
        priority: 'high',
        category: this.mapIssueCategoryToManualCategory(issue.category),
        documentation_url: issue.documentation_url,
      })
    }

    // Add framework-specific manual steps
    this.addFrameworkSpecificSteps(plan, config)
  }

  /**
   * Map compatibility issue category to manual step category
   */
  private mapIssueCategoryToManualCategory(
    category: string
  ): 'configuration' | 'code' | 'build' | 'deployment' {
    const mapping: Record<string, 'configuration' | 'code' | 'build' | 'deployment'> = {
      framework: 'configuration',
      routing: 'code',
      rendering: 'code',
      api: 'code',
      middleware: 'code',
      assets: 'build',
      i18n: 'configuration',
      typescript: 'configuration',
      dependency: 'build',
      feature: 'code',
      syntax: 'code',
      config: 'configuration',
      build: 'build',
    }

    return mapping[category] || 'configuration'
  }

  /**
   * Add framework-specific manual steps
   */
  private addFrameworkSpecificSteps(
    plan: FrameworkSwapPlan,
    config: FrameworkSwapConfig
  ): void {
    // If swapping to Angular, decorator setup is needed
    if (config.to === 'angular') {
      plan.manual_steps.push({
        title: 'Set up Angular decorators',
        description: 'Configure TypeScript decorators and Angular CLI',
        priority: 'high',
        category: 'configuration',
        documentation_url: 'https://angular.io/guide/typescript-configuration',
      })
    }

    // If swapping to Qwik, resumability setup needed
    if (config.to === 'qwik') {
      plan.manual_steps.push({
        title: 'Configure Qwik resumability',
        description:
          'Set up Qwik resumability feature, optimizer and SSR configuration for instant app startup',
        priority: 'medium',
        category: 'build',
        documentation_url: 'https://qwik.builder.io/docs/advanced/optimizer/',
      })
    }
  }

  /**
   * Estimate time for swap
   */
  private estimateSwapTime(plan: FrameworkSwapPlan): number {
    let time = 0

    // Base time: 60 seconds
    time += 60

    // Time per dependency change: 5 seconds each
    time +=
      (plan.dependencies_to_add.length +
        plan.dependencies_to_remove.length +
        plan.dependencies_to_update.length) *
      5

    // Time per file change: 3 seconds each
    time +=
      (plan.files_to_create.length + plan.files_to_modify.length + plan.files_to_delete.length) * 3

    // Time per config update: 10 seconds each
    time += plan.configs_to_update.length * 10

    // Time per script update: 2 seconds each
    time += plan.scripts_to_update.length * 2

    // Additional time for manual steps: 300 seconds each (5 minutes)
    time += plan.manual_steps.length * 300

    return time
  }

  /**
   * Validate plan before execution
   */
  validatePlan(plan: FrameworkSwapPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check for circular dependencies
    if (this.hasCircularDependencies(plan)) {
      errors.push('Plan contains circular dependency changes')
    }

    // Check for file conflicts
    const createPaths = new Set(plan.files_to_create.map((f) => f.path))
    const deletePaths = new Set(plan.files_to_delete)

    for (const path of createPaths) {
      if (deletePaths.has(path)) {
        errors.push(`File ${path} is both created and deleted in the same plan`)
      }
    }

    // Check for suspiciously empty dependency changes
    // If there are no adds, no removes, and no updates, the plan might be incomplete
    const hasNoDependencyChanges =
      plan.dependencies_to_add.length === 0 &&
      plan.dependencies_to_remove.length === 0 &&
      plan.dependencies_to_update.length === 0

    if (hasNoDependencyChanges) {
      errors.push('No dependencies to add, remove, or update - framework dependencies might be missing')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Check for circular dependencies
   */
  private hasCircularDependencies(plan: FrameworkSwapPlan): boolean {
    // Simple check: ensure we're not adding and removing the same package
    const toRemove = new Set(plan.dependencies_to_remove)
    const toAdd = new Set(plan.dependencies_to_add.map((d) => d.package))

    for (const pkg of toRemove) {
      if (toAdd.has(pkg)) {
        return true
      }
    }

    return false
  }
}
