/**
 * Framework Compatibility Analyzer
 * 
 * Analyzes compatibility between source and target frameworks for migration.
 */

import type {
  FrameworkType,
  FrameworkCompatibility,
  CompatibilityIssue,
  FrameworkFeatureMap,
} from './types'

const FRAMEWORK_FEATURES: Record<FrameworkType, FrameworkFeatureMap> = {
  nextjs: {
    routing: 'file-based',
    ssr: true,
    ssg: true,
    api_routes: true,
    middleware: true,
    image_optimization: true,
    i18n: true,
    typescript: true,
    css_modules: true,
    sass: true,
    tailwind: true,
  },
  react: {
    routing: 'library',
    ssr: false,
    ssg: false,
    api_routes: false,
    middleware: false,
    image_optimization: false,
    i18n: false,
    typescript: true,
    css_modules: true,
    sass: true,
    tailwind: true,
  },
  vue: {
    routing: 'library',
    ssr: false,
    ssg: false,
    api_routes: false,
    middleware: false,
    image_optimization: false,
    i18n: false,
    typescript: true,
    css_modules: true,
    sass: true,
    tailwind: true,
  },
  nuxt: {
    routing: 'file-based',
    ssr: true,
    ssg: true,
    api_routes: true,
    middleware: true,
    image_optimization: true,
    i18n: true,
    typescript: true,
    css_modules: true,
    sass: true,
    tailwind: true,
  },
  angular: {
    routing: 'module-based',
    ssr: true,
    ssg: false,
    api_routes: false,
    middleware: false,
    image_optimization: false,
    i18n: true,
    typescript: true,
    css_modules: false,
    sass: true,
    tailwind: true,
  },
  svelte: {
    routing: 'library',
    ssr: false,
    ssg: false,
    api_routes: false,
    middleware: false,
    image_optimization: false,
    i18n: false,
    typescript: true,
    css_modules: true,
    sass: true,
    tailwind: true,
  },
  solid: {
    routing: 'library',
    ssr: false,
    ssg: false,
    api_routes: false,
    middleware: false,
    image_optimization: false,
    i18n: false,
    typescript: true,
    css_modules: true,
    sass: true,
    tailwind: true,
  },
  qwik: {
    routing: 'file-based',
    ssr: true,
    ssg: true,
    api_routes: true,
    middleware: true,
    image_optimization: false,
    i18n: false,
    typescript: true,
    css_modules: true,
    sass: true,
    tailwind: true,
  },
  astro: {
    routing: 'file-based',
    ssr: true,
    ssg: true,
    api_routes: true,
    middleware: true,
    image_optimization: true,
    i18n: true,
    typescript: true,
    css_modules: true,
    sass: true,
    tailwind: true,
  },
  remix: {
    routing: 'file-based',
    ssr: true,
    ssg: false,
    api_routes: true,
    middleware: false,
    image_optimization: false,
    i18n: false,
    typescript: true,
    css_modules: true,
    sass: true,
    tailwind: true,
  },
  unknown: {
    routing: 'unknown',
    ssr: false,
    ssg: false,
    api_routes: false,
    middleware: false,
    image_optimization: false,
    i18n: false,
    typescript: false,
    css_modules: false,
    sass: false,
    tailwind: false,
  },
}

/**
 * Analyzes compatibility between two frameworks
 */
export class CompatibilityAnalyzer {
  /**
   * Analyze compatibility between source and target frameworks
   */
  async analyze(from: FrameworkType, to: FrameworkType): Promise<FrameworkCompatibility> {
    const issues = this.detectIssues(from, to)
    const compatibilityScore = this.calculateCompatibilityScore(from, to, issues)
    const difficulty = this.assessDifficulty(from, to, issues)
    const recommendations = this.generateRecommendations(from, to, issues)

    return {
      from,
      to,
      compatible: issues.filter((i) => i.severity === 'critical').length === 0,
      difficulty,
      compatibility_score: compatibilityScore,
      issues,
      recommendations,
    }
  }

  /**
   * Detect compatibility issues between frameworks
   */
  private detectIssues(from: FrameworkType, to: FrameworkType): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = []
    const fromFeatures = FRAMEWORK_FEATURES[from]
    const toFeatures = FRAMEWORK_FEATURES[to]

    // Check if migration from/to unknown framework
    if (from === 'unknown') {
      issues.push({
        severity: 'critical',
        category: 'framework',
        description: 'Source framework is unknown - cannot analyze compatibility',
        impact: 'Cannot proceed with migration without identifying source framework',
        suggestion: 'Run framework detection to identify the source framework',
      })
      return issues
    }

    if (to === 'unknown') {
      issues.push({
        severity: 'critical',
        category: 'framework',
        description: 'Target framework is unknown',
        impact: 'Cannot proceed with migration to unknown framework',
        suggestion: 'Specify a valid target framework',
      })
      return issues
    }

    // Same framework check
    if (from === to) {
      issues.push({
        severity: 'low',
        category: 'framework',
        description: 'Source and target frameworks are the same',
        impact: 'No migration needed',
        suggestion: 'This operation will have no effect',
      })
      return issues
    }

    // Routing compatibility
    if (fromFeatures.routing !== toFeatures.routing) {
      const severity = fromFeatures.routing === 'file-based' && toFeatures.routing === 'library' ? 'high' : 'medium'
      issues.push({
        severity,
        category: 'routing',
        description: `Routing systems differ: ${fromFeatures.routing} → ${toFeatures.routing}`,
        impact: 'All routes will need to be recreated in the new routing system',
        suggestion:
          toFeatures.routing === 'library'
            ? 'Consider using React Router or similar routing library'
            : 'Restructure routes into file-based system',
      })
    }

    // SSR/SSG compatibility
    if (fromFeatures.ssr && !toFeatures.ssr) {
      issues.push({
        severity: 'high',
        category: 'rendering',
        description: 'Target framework does not support server-side rendering',
        impact: 'SSR pages will need to be converted to client-side rendering',
        suggestion: 'Evaluate if SSR is required for your use case',
      })
    }

    if (fromFeatures.ssg && !toFeatures.ssg) {
      issues.push({
        severity: 'medium',
        category: 'rendering',
        description: 'Target framework does not support static site generation',
        impact: 'SSG pages will need alternative rendering strategy',
        suggestion: 'Consider pre-rendering at build time with alternative tools',
      })
    }

    // API routes compatibility
    if (fromFeatures.api_routes && !toFeatures.api_routes) {
      issues.push({
        severity: 'high',
        category: 'api',
        description: 'Target framework does not have built-in API routes',
        impact: 'API routes will need to be moved to separate backend service',
        suggestion: 'Set up Express, Fastify, or similar backend framework',
      })
    }

    // Middleware compatibility
    if (fromFeatures.middleware && !toFeatures.middleware) {
      issues.push({
        severity: 'medium',
        category: 'middleware',
        description: 'Target framework does not support middleware',
        impact: 'Middleware logic will need alternative implementation',
        suggestion: 'Implement middleware logic at component or route level',
      })
    }

    // Image optimization
    if (fromFeatures.image_optimization && !toFeatures.image_optimization) {
      issues.push({
        severity: 'low',
        category: 'assets',
        description: 'Target framework lacks built-in image optimization',
        impact: 'Images may need manual optimization or external service',
        suggestion: 'Consider using Cloudinary, Imgix, or similar service',
      })
    }

    // i18n compatibility
    if (fromFeatures.i18n && !toFeatures.i18n) {
      issues.push({
        severity: 'medium',
        category: 'i18n',
        description: 'Target framework lacks built-in internationalization',
        impact: 'i18n will need to be implemented with external library',
        suggestion: 'Use react-i18next, vue-i18n, or similar library',
      })
    }

    // TypeScript compatibility
    if (fromFeatures.typescript && !toFeatures.typescript) {
      issues.push({
        severity: 'low',
        category: 'typescript',
        description: 'Target framework has limited TypeScript support',
        impact: 'May need additional TypeScript configuration',
        suggestion: 'Verify TypeScript setup in target framework',
      })
    }

    return issues
  }

  /**
   * Calculate compatibility score (0-100)
   */
  private calculateCompatibilityScore(
    from: FrameworkType,
    to: FrameworkType,
    issues: CompatibilityIssue[]
  ): number {
    // Base score starts at 100
    let score = 100

    // Deduct points based on issue severity
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 40
          break
        case 'high':
          score -= 20
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    }

    // Framework similarity bonuses
    const similarFrameworks = [
      ['nextjs', 'remix'],
      ['nextjs', 'astro'],
      ['nextjs', 'nuxt'],
      ['react', 'solid'],
      ['vue', 'svelte'],
      ['nuxt', 'astro'],
    ]

    const isSimilar = similarFrameworks.some(
      ([f1, f2]) => (from === f1 && to === f2) || (from === f2 && to === f1)
    )

    if (isSimilar) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Assess migration difficulty
   */
  private assessDifficulty(
    from: FrameworkType,
    to: FrameworkType,
    issues: CompatibilityIssue[]
  ): 'easy' | 'medium' | 'hard' | 'very-hard' {
    // Same framework is always easy
    if (from === to) {
      return 'easy'
    }

    const criticalIssues = issues.filter((i) => i.severity === 'critical').length
    const highIssues = issues.filter((i) => i.severity === 'high').length
    const mediumIssues = issues.filter((i) => i.severity === 'medium').length

    if (criticalIssues > 0) {
      return 'very-hard'
    }

    if (highIssues >= 3) {
      return 'very-hard'
    }

    // Check if this is an "upgrade" scenario (adding features)
    // React -> Next.js, Vue -> Nuxt, etc. should be easy even with routing changes
    const isUpgrade = this.isUpgradeScenario(from, to)
    
    if (isUpgrade) {
      // For upgrade scenarios, only high/critical issues make it harder
      if (highIssues >= 1) {
        return 'medium'
      }
      return 'easy'
    }

    // For other scenarios, use standard difficulty assessment
    if (highIssues >= 1 || mediumIssues >= 3) {
      return 'hard'
    }

    if (mediumIssues >= 1) {
      return 'medium'
    }

    return 'easy'
  }

  /**
   * Check if migration is an upgrade scenario (adding features)
   */
  private isUpgradeScenario(from: FrameworkType, to: FrameworkType): boolean {
    const upgradePaths: Record<string, string[]> = {
      react: ['nextjs', 'remix'],
      vue: ['nuxt'],
    }

    return upgradePaths[from]?.includes(to) ?? false
  }

  /**
   * Generate migration recommendations
   */
  private generateRecommendations(
    from: FrameworkType,
    to: FrameworkType,
    issues: CompatibilityIssue[]
  ): string[] {
    const recommendations: string[] = []

    // Add general recommendations
    recommendations.push('Create a backup of your project before starting migration')
    recommendations.push('Set up the target framework in a separate branch')
    recommendations.push('Migrate incrementally, testing each component')

    // Add issue-specific recommendations
    const routingIssues = issues.filter((i) => i.category === 'routing')
    if (routingIssues.length > 0) {
      recommendations.push('Plan your routing structure before migrating')
    }

    const ssrIssues = issues.filter((i) => i.category === 'rendering')
    if (ssrIssues.length > 0) {
      recommendations.push('Identify which pages require server-side rendering')
      recommendations.push('Consider hydration strategies for interactive components')
    }

    const apiIssues = issues.filter((i) => i.category === 'api')
    if (apiIssues.length > 0) {
      recommendations.push('Plan API migration to separate backend service')
      recommendations.push('Ensure API contracts remain consistent during migration')
    }

    // Framework-specific recommendations
    if (to === 'react') {
      recommendations.push('Choose a routing solution (React Router, TanStack Router, etc.)')
      recommendations.push('Decide on state management approach (Context, Zustand, Redux, etc.)')
    }

    if (to === 'nextjs') {
      recommendations.push('Familiarize yourself with Next.js App Router vs Pages Router')
      recommendations.push('Leverage Next.js built-in features for optimization')
    }

    if (to === 'vue' || to === 'nuxt') {
      recommendations.push('Learn Vue composition API for modern component structure')
    }

    if (to === 'angular') {
      recommendations.push('Understand Angular module system and dependency injection')
      recommendations.push('Set up RxJS for reactive programming patterns')
    }

    return recommendations
  }

  /**
   * Quick compatibility check
   */
  async isCompatible(from: FrameworkType, to: FrameworkType): Promise<boolean> {
    const analysis = await this.analyze(from, to)
    return analysis.compatible
  }

  /**
   * Get feature comparison between frameworks
   */
  getFeatureComparison(from: FrameworkType, to: FrameworkType): {
    from_features: FrameworkFeatureMap
    to_features: FrameworkFeatureMap
    missing_features: string[]
    gained_features: string[]
  } {
    const fromFeatures = FRAMEWORK_FEATURES[from]
    const toFeatures = FRAMEWORK_FEATURES[to]

    const missing_features: string[] = []
    const gained_features: string[] = []

    for (const [feature, value] of Object.entries(fromFeatures)) {
      const toValue = toFeatures[feature as keyof FrameworkFeatureMap]
      if (value && !toValue) {
        missing_features.push(feature)
      } else if (!value && toValue) {
        gained_features.push(feature)
      }
    }

    return {
      from_features: fromFeatures,
      to_features: toFeatures,
      missing_features,
      gained_features,
    }
  }
}
