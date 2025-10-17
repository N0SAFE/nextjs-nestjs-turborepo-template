/**
 * Framework Detector - Detect framework used in project
 * Part of Phase 6: Framework Swapping
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { existsSync } from 'node:fs'
import type {
  DetectedFramework,
  DetectionOptions,
  FrameworkEvidence,
  FrameworkType,
  FrameworkVersion,
} from './types'

/**
 * Detects the framework used in a project
 */
export class FrameworkDetector {
  private projectRoot: string
  private options: Required<DetectionOptions>

  constructor(options: DetectionOptions = {}) {
    this.projectRoot = options.project_root ?? process.cwd()
    this.options = {
      project_root: this.projectRoot,
      confidence_threshold: options.confidence_threshold ?? 70,
      scan_depth: options.scan_depth ?? 3,
      include_implicit: options.include_implicit ?? true,
      verbose: options.verbose ?? false,
    }
  }

  /**
   * Detect framework in project
   */
  async detect(): Promise<DetectedFramework> {
    const evidence: FrameworkEvidence[] = []

    // Check package.json dependencies
    const pkgEvidence = await this.checkPackageJson()
    evidence.push(...pkgEvidence)

    // Check config files
    const configEvidence = await this.checkConfigFiles()
    evidence.push(...configEvidence)

    // Check file patterns
    if (this.options.include_implicit) {
      const fileEvidence = await this.checkFilePatterns()
      evidence.push(...fileEvidence)
    }

    // Determine framework type from evidence
    const frameworkType = this.determineFramework(evidence)

    // Get version information
    const version = await this.detectVersion(frameworkType)

    // Calculate confidence score
    const confidence = this.calculateConfidence(evidence, frameworkType)

    // Get dependencies
    const { dependencies, devDependencies } = await this.getDependencies()

    // Get config files
    const configFiles = await this.getConfigFiles(frameworkType)

    return {
      type: frameworkType,
      version,
      confidence,
      evidence,
      dependencies,
      devDependencies,
      config_files: configFiles,
    }
  }

  /**
   * Check package.json for framework dependencies
   */
  private async checkPackageJson(): Promise<FrameworkEvidence[]> {
    const evidence: FrameworkEvidence[] = []
    const pkgPath = path.join(this.projectRoot, 'package.json')

    if (!existsSync(pkgPath)) {
      return evidence
    }

    try {
      const content = await fs.readFile(pkgPath, 'utf-8')
      const pkg = JSON.parse(content)

      // Check dependencies
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      }

      // Next.js
      if (allDeps.next) {
        evidence.push({
          type: 'dependency',
          value: 'next',
          weight: 100,
          description: 'Next.js dependency found',
        })
      }

      // React
      if (allDeps.react) {
        evidence.push({
          type: 'dependency',
          value: 'react',
          weight: 80,
          description: 'React dependency found',
        })
      }

      // Vue
      if (allDeps.vue) {
        evidence.push({
          type: 'dependency',
          value: 'vue',
          weight: 100,
          description: 'Vue dependency found',
        })
      }

      // Nuxt
      if (allDeps.nuxt) {
        evidence.push({
          type: 'dependency',
          value: 'nuxt',
          weight: 100,
          description: 'Nuxt dependency found',
        })
      }

      // Angular
      if (allDeps['@angular/core']) {
        evidence.push({
          type: 'dependency',
          value: '@angular/core',
          weight: 100,
          description: 'Angular dependency found',
        })
      }

      // Svelte
      if (allDeps.svelte) {
        evidence.push({
          type: 'dependency',
          value: 'svelte',
          weight: 100,
          description: 'Svelte dependency found',
        })
      }

      // Solid
      if (allDeps['solid-js']) {
        evidence.push({
          type: 'dependency',
          value: 'solid-js',
          weight: 100,
          description: 'Solid.js dependency found',
        })
      }

      // Qwik
      if (allDeps['@builder.io/qwik']) {
        evidence.push({
          type: 'dependency',
          value: '@builder.io/qwik',
          weight: 100,
          description: 'Qwik dependency found',
        })
      }

      // Astro
      if (allDeps.astro) {
        evidence.push({
          type: 'dependency',
          value: 'astro',
          weight: 100,
          description: 'Astro dependency found',
        })
      }

      // Remix
      if (allDeps['@remix-run/react']) {
        evidence.push({
          type: 'dependency',
          value: '@remix-run/react',
          weight: 100,
          description: 'Remix dependency found',
        })
      }

      // Check scripts for framework-specific commands
      if (pkg.scripts) {
        Object.entries(pkg.scripts).forEach(([name, command]) => {
          if (typeof command === 'string') {
            if (command.includes('next')) {
              evidence.push({
                type: 'script',
                value: `${name}: ${command}`,
                weight: 60,
                description: 'Next.js script found',
              })
            }
            if (command.includes('vite')) {
              evidence.push({
                type: 'script',
                value: `${name}: ${command}`,
                weight: 40,
                description: 'Vite script found',
              })
            }
          }
        })
      }
    } catch (error) {
      if (this.options.verbose) {
        console.error('Error reading package.json:', error)
      }
    }

    return evidence
  }

  /**
   * Check for framework-specific config files
   */
  private async checkConfigFiles(): Promise<FrameworkEvidence[]> {
    const evidence: FrameworkEvidence[] = []

    const configChecks = [
      { file: 'next.config.js', framework: 'Next.js', weight: 90 },
      { file: 'next.config.ts', framework: 'Next.js', weight: 90 },
      { file: 'nuxt.config.js', framework: 'Nuxt', weight: 90 },
      { file: 'nuxt.config.ts', framework: 'Nuxt', weight: 90 },
      { file: 'vue.config.js', framework: 'Vue', weight: 80 },
      { file: 'angular.json', framework: 'Angular', weight: 90 },
      { file: 'svelte.config.js', framework: 'Svelte', weight: 90 },
      { file: 'astro.config.mjs', framework: 'Astro', weight: 90 },
      { file: 'remix.config.js', framework: 'Remix', weight: 90 },
    ]

    for (const check of configChecks) {
      const filePath = path.join(this.projectRoot, check.file)
      if (existsSync(filePath)) {
        evidence.push({
          type: 'file',
          value: check.file,
          weight: check.weight,
          description: `${check.framework} config file found`,
        })
      }
    }

    return evidence
  }

  /**
   * Check file patterns to infer framework
   */
  private async checkFilePatterns(): Promise<FrameworkEvidence[]> {
    const evidence: FrameworkEvidence[] = []

    // Check for Next.js app directory
    const nextAppDir = path.join(this.projectRoot, 'app')
    if (existsSync(nextAppDir)) {
      evidence.push({
        type: 'file',
        value: 'app/',
        weight: 70,
        description: 'Next.js app directory found',
      })
    }

    // Check for Next.js pages directory
    const nextPagesDir = path.join(this.projectRoot, 'pages')
    if (existsSync(nextPagesDir)) {
      evidence.push({
        type: 'file',
        value: 'pages/',
        weight: 60,
        description: 'Next.js pages directory found',
      })
    }

    // Check for Angular src structure
    const angularSrc = path.join(this.projectRoot, 'src', 'app', 'app.component.ts')
    if (existsSync(angularSrc)) {
      evidence.push({
        type: 'file',
        value: 'src/app/app.component.ts',
        weight: 70,
        description: 'Angular component structure found',
      })
    }

    return evidence
  }

  /**
   * Determine framework type from evidence
   */
  private determineFramework(evidence: FrameworkEvidence[]): FrameworkType {
    const scores = new Map<FrameworkType, number>()

    // Initialize scores
    const frameworks: FrameworkType[] = [
      'nextjs',
      'react',
      'vue',
      'nuxt',
      'angular',
      'svelte',
      'solid',
      'qwik',
      'astro',
      'remix',
    ]

    frameworks.forEach((fw) => scores.set(fw, 0))

    // First pass: check which frameworks are present
    const hasNuxt = evidence.some((ev) => ev.value.toLowerCase().includes('nuxt'))
    const hasNext = evidence.some((ev) => {
      const val = ev.value.toLowerCase()
      return val.includes('next') && !val.includes('nuxt')
    })
    const hasRemix = evidence.some((ev) => ev.value.toLowerCase().includes('remix'))

    // Calculate scores based on evidence
    evidence.forEach((ev) => {
      const value = ev.value.toLowerCase()

      if (value.includes('next') && !value.includes('nuxt')) {
        scores.set('nextjs', (scores.get('nextjs') ?? 0) + ev.weight)
      }
      if (value.includes('nuxt')) {
        scores.set('nuxt', (scores.get('nuxt') ?? 0) + ev.weight)
      }
      // Only score vue if nuxt is not present in the project
      if (value.includes('vue') && !hasNuxt) {
        scores.set('vue', (scores.get('vue') ?? 0) + ev.weight)
      }
      if (value.includes('angular')) {
        scores.set('angular', (scores.get('angular') ?? 0) + ev.weight)
      }
      if (value.includes('svelte')) {
        scores.set('svelte', (scores.get('svelte') ?? 0) + ev.weight)
      }
      if (value.includes('solid')) {
        scores.set('solid', (scores.get('solid') ?? 0) + ev.weight)
      }
      if (value.includes('qwik')) {
        scores.set('qwik', (scores.get('qwik') ?? 0) + ev.weight)
      }
      if (value.includes('astro')) {
        scores.set('astro', (scores.get('astro') ?? 0) + ev.weight)
      }
      if (value.includes('remix')) {
        scores.set('remix', (scores.get('remix') ?? 0) + ev.weight)
      }
      // Only score react if neither next nor remix is present
      if (value.includes('react') && !hasNext && !hasRemix) {
        scores.set('react', (scores.get('react') ?? 0) + ev.weight)
      }
    })

    // Find framework with highest score
    let maxScore = 0
    let detectedFramework: FrameworkType = 'unknown'

    scores.forEach((score, framework) => {
      if (score > maxScore) {
        maxScore = score
        detectedFramework = framework
      }
    })

    return detectedFramework
  }

  /**
   * Detect framework version
   */
  private async detectVersion(frameworkType: FrameworkType): Promise<FrameworkVersion> {
    const pkgPath = path.join(this.projectRoot, 'package.json')

    if (!existsSync(pkgPath)) {
      return this.getDefaultVersion()
    }

    try {
      const content = await fs.readFile(pkgPath, 'utf-8')
      const pkg = JSON.parse(content)

      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      }

      // Map framework type to package name
      const packageName = this.getPackageName(frameworkType)
      const version = allDeps[packageName]

      if (version) {
        return this.parseVersion(version)
      }
    } catch (error) {
      if (this.options.verbose) {
        console.error('Error detecting version:', error)
      }
    }

    return this.getDefaultVersion()
  }

  /**
   * Get package name for framework
   */
  private getPackageName(frameworkType: FrameworkType): string {
    const packageMap: Record<FrameworkType, string> = {
      nextjs: 'next',
      react: 'react',
      vue: 'vue',
      nuxt: 'nuxt',
      angular: '@angular/core',
      svelte: 'svelte',
      solid: 'solid-js',
      qwik: '@builder.io/qwik',
      astro: 'astro',
      remix: '@remix-run/react',
      unknown: '',
    }

    return packageMap[frameworkType]
  }

  /**
   * Parse version string
   */
  private parseVersion(versionStr: string): FrameworkVersion {
    // Remove ^ or ~ prefix
    const cleanVersion = versionStr.replace(/^[\^~]/, '')

    // Split on hyphen first to separate version from prerelease
    const mainParts = cleanVersion.split('-')
    const versionPart = mainParts[0]
    const prereleasePart = mainParts.length > 1 ? mainParts.slice(1).join('-') : undefined

    // Now split version part
    const parts = versionPart.split('.')
    const [majorStr = '0', minorStr = '0', patchStr = '0'] = parts

    return {
      major: parseInt(majorStr, 10),
      minor: parseInt(minorStr, 10),
      patch: parseInt(patchStr, 10),
      full: cleanVersion,
      prerelease: prereleasePart,
    }
  }

  /**
   * Get default version when detection fails
   */
  private getDefaultVersion(): FrameworkVersion {
    return {
      major: 0,
      minor: 0,
      patch: 0,
      full: '0.0.0',
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    evidence: FrameworkEvidence[],
    frameworkType: FrameworkType
  ): number {
    if (frameworkType === 'unknown') {
      return 0
    }

    // Map framework types to their common names in descriptions
    const frameworkNameMap: Record<FrameworkType, string[]> = {
      nextjs: ['next.js', 'next'],
      react: ['react'],
      vue: ['vue'],
      nuxt: ['nuxt'],
      angular: ['angular', '@angular'],
      svelte: ['svelte'],
      solid: ['solid', 'solid-js'],
      qwik: ['qwik', '@builder.io/qwik'],
      astro: ['astro'],
      remix: ['remix', '@remix-run'],
      unknown: [],
    }

    const names = frameworkNameMap[frameworkType]
    const relevantEvidence = evidence.filter((ev) => {
      const lowerDesc = ev.description.toLowerCase()
      const lowerValue = ev.value.toLowerCase()
      return names.some(
        (name) => lowerDesc.includes(name.toLowerCase()) || lowerValue.includes(name.toLowerCase())
      )
    })

    const totalWeight = relevantEvidence.reduce((sum, ev) => sum + ev.weight, 0)

    // Normalize to 0-100 scale
    // Dependency alone should give ~70% confidence, with configs/patterns boosting to 100%
    const maxPossibleWeight = 140 // Balanced threshold for realistic confidence scores
    const confidence = Math.min(100, (totalWeight / maxPossibleWeight) * 100)

    return Math.round(confidence)
  }

  /**
   * Get dependencies from package.json
   */
  private async getDependencies(): Promise<{
    dependencies: string[]
    devDependencies: string[]
  }> {
    const pkgPath = path.join(this.projectRoot, 'package.json')

    if (!existsSync(pkgPath)) {
      return { dependencies: [], devDependencies: [] }
    }

    try {
      const content = await fs.readFile(pkgPath, 'utf-8')
      const pkg = JSON.parse(content)

      return {
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {}),
      }
    } catch (error) {
      return { dependencies: [], devDependencies: [] }
    }
  }

  /**
   * Get config files for framework
   */
  private async getConfigFiles(frameworkType: FrameworkType): Promise<string[]> {
    const configMap: Record<FrameworkType, string[]> = {
      nextjs: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
      react: ['vite.config.js', 'vite.config.ts', 'webpack.config.js'],
      vue: ['vue.config.js', 'vite.config.js', 'vite.config.ts'],
      nuxt: ['nuxt.config.js', 'nuxt.config.ts'],
      angular: ['angular.json', 'tsconfig.json'],
      svelte: ['svelte.config.js', 'vite.config.js', 'vite.config.ts'],
      solid: ['vite.config.js', 'vite.config.ts'],
      qwik: ['vite.config.js', 'vite.config.ts'],
      astro: ['astro.config.mjs', 'astro.config.js'],
      remix: ['remix.config.js', 'remix.config.ts'],
      unknown: [],
    }

    const possibleConfigs = configMap[frameworkType]
    const foundConfigs: string[] = []

    for (const config of possibleConfigs) {
      const filePath = path.join(this.projectRoot, config)
      if (existsSync(filePath)) {
        foundConfigs.push(config)
      }
    }

    return foundConfigs
  }
}
