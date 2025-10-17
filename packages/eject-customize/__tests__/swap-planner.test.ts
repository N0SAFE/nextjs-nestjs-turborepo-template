/**
 * Tests for Framework Swap Planner
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SwapPlanner } from '../src/swap/planner'
import type {
  FrameworkSwapConfig,
  DetectedFramework,
  FrameworkCompatibility,
  FrameworkVersion,
} from '../src/swap/types'

describe('SwapPlanner', () => {
  let planner: SwapPlanner
  let mockDetectedFramework: DetectedFramework
  let mockCompatibility: FrameworkCompatibility

  beforeEach(() => {
    planner = new SwapPlanner({ verbose: false })

    const version: FrameworkVersion = {
      major: 13,
      minor: 0,
      patch: 0,
      full: '13.0.0',
    }

    mockDetectedFramework = {
      type: 'nextjs',
      version,
      confidence: 95,
      evidence: [],
      dependencies: ['next', 'react', 'react-dom'],
      devDependencies: [],
      config_files: ['next.config.js'],
    }

    mockCompatibility = {
      from: 'nextjs',
      to: 'react',
      compatible: true,
      difficulty: 'medium',
      compatibility_score: 75,
      issues: [],
      recommendations: [],
    }
  })

  describe('generatePlan', () => {
    it('should generate a complete swap plan', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan).toBeDefined()
      expect(plan.config).toEqual(config)
      expect(plan.dependencies_to_add).toBeDefined()
      expect(plan.dependencies_to_remove).toBeDefined()
      expect(plan.files_to_create).toBeDefined()
      expect(plan.files_to_modify).toBeDefined()
      expect(plan.configs_to_update).toBeDefined()
      expect(plan.scripts_to_update).toBeDefined()
      expect(plan.estimated_time).toBeGreaterThan(0)
    })

    it('should include warnings from compatibility issues', async () => {
      mockCompatibility.compatible = false
      mockCompatibility.difficulty = 'very-hard'
      mockCompatibility.issues = [
        {
          severity: 'critical',
          category: 'framework',
          description: 'Incompatible routing systems',
          impact: 'High',
          suggestion: 'Manual migration required',
        },
      ]

      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'angular',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.warnings.length).toBeGreaterThan(0)
      expect(plan.warnings.some((w) => w.includes('compatibility issues'))).toBe(true)
      expect(plan.warnings.some((w) => w.includes('very-hard'))).toBe(true)
      expect(plan.warnings.some((w) => w.includes('CRITICAL'))).toBe(true)
    })

    it('should estimate time correctly', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      // Should have base time + dependency changes + file changes + config changes + script changes
      expect(plan.estimated_time).toBeGreaterThan(60) // base time
      expect(typeof plan.estimated_time).toBe('number')
    })
  })

  describe('dependency planning', () => {
    it('should plan dependency removals', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.dependencies_to_remove).toContain('next')
    })

    it('should plan dependency additions', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'vue',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.dependencies_to_add.some((d) => d.package === 'vue')).toBe(true)
    })

    it('should skip dependency planning when migrate_dependencies is false', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: false,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.dependencies_to_add).toHaveLength(0)
      expect(plan.dependencies_to_remove).toHaveLength(0)
    })

    it('should plan TypeScript updates for frameworks requiring it', async () => {
      const config: FrameworkSwapConfig = {
        from: 'react',
        to: 'angular',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.dependencies_to_update.some((d) => d.package === 'typescript')).toBe(true)
    })

    it('should plan Vite updates for Vite-based frameworks', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'vue',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.dependencies_to_update.some((d) => d.package === 'vite')).toBe(true)
    })

    it('should include reasons for dependency changes', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'vue',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      const vueDep = plan.dependencies_to_add.find((d) => d.package === 'vue')
      expect(vueDep).toBeDefined()
      expect(vueDep!.reason).toContain('vue')
    })
  })

  describe('file planning', () => {
    it('should plan entry file changes', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      // Should delete Next.js entry file
      expect(plan.files_to_delete).toContain('pages/_app.tsx')

      // Should create React entry file
      expect(plan.files_to_create.some((f) => f.path === 'src/index.tsx')).toBe(true)
    })

    it('should modify entry file when path stays the same', async () => {
      const config: FrameworkSwapConfig = {
        from: 'vue',
        to: 'svelte',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      // Both use src/main.ts, so should modify instead of create/delete
      expect(plan.files_to_modify.some((f) => f.path === 'src/main.ts')).toBe(true)
    })

    it('should include framework-specific entry file templates', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      const entryFile = plan.files_to_create.find((f) => f.path === 'src/index.tsx')
      expect(entryFile).toBeDefined()
      expect(entryFile!.content).toContain('ReactDOM')
      expect(entryFile!.content).toContain('createRoot')
    })

    it('should plan config file deletions', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.files_to_delete).toContain('next.config.js')
    })

    it('should plan config file creations', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.files_to_create.some((f) => f.path === 'vite.config.ts')).toBe(true)
    })

    it('should include descriptions for file changes', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      for (const file of plan.files_to_create) {
        expect(file.description).toBeDefined()
        expect(file.description.length).toBeGreaterThan(0)
      }
    })
  })

  describe('config planning', () => {
    it('should plan package.json updates', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.configs_to_update.some((c) => c.file === 'package.json')).toBe(true)
    })

    it('should plan tsconfig.json updates', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.configs_to_update.some((c) => c.file === 'tsconfig.json')).toBe(true)
    })

    it('should skip config updates when update_configs is false', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: false,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.configs_to_update).toHaveLength(0)
    })

    it('should include Angular-specific TypeScript config', async () => {
      const config: FrameworkSwapConfig = {
        from: 'react',
        to: 'angular',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      const tsConfig = plan.configs_to_update.find((c) => c.file === 'tsconfig.json')
      expect(tsConfig).toBeDefined()
      expect(tsConfig!.changes).toBeDefined()
    })

    it('should set module type for ESM frameworks', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'astro',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      const pkgConfig = plan.configs_to_update.find((c) => c.file === 'package.json')
      expect(pkgConfig).toBeDefined()
      expect(pkgConfig!.changes.type).toBe('module')
    })
  })

  describe('script planning', () => {
    it('should update dev script', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.scripts_to_update.some((s) => s.name === 'dev')).toBe(true)
      const devScript = plan.scripts_to_update.find((s) => s.name === 'dev')
      expect(devScript!.to_command).toContain('vite')
    })

    it('should update build script', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.scripts_to_update.some((s) => s.name === 'build')).toBe(true)
    })

    it('should include descriptions for script changes', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      for (const script of plan.scripts_to_update) {
        expect(script.description).toBeDefined()
        expect(script.description.length).toBeGreaterThan(0)
      }
    })

    it('should use framework-specific scripts for Angular', async () => {
      const config: FrameworkSwapConfig = {
        from: 'react',
        to: 'angular',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      const devScript = plan.scripts_to_update.find((s) => s.name === 'dev')
      expect(devScript!.to_command).toContain('ng serve')
    })

    it('should use framework-specific scripts for Nuxt', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'nuxt',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      const devScript = plan.scripts_to_update.find((s) => s.name === 'dev')
      expect(devScript!.to_command).toContain('nuxt dev')
    })
  })

  describe('manual steps', () => {
    it('should add manual steps for critical issues', async () => {
      mockCompatibility.issues = [
        {
          severity: 'critical',
          category: 'routing',
          description: 'Routing incompatibility',
          impact: 'High',
          suggestion: 'Rewrite routing',
          documentation_url: 'https://example.com',
        },
      ]

      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'angular',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.manual_steps.length).toBeGreaterThan(0)
      expect(plan.manual_steps.some((s) => s.title === 'Routing incompatibility')).toBe(true)
    })

    it('should add Angular-specific manual steps', async () => {
      const config: FrameworkSwapConfig = {
        from: 'react',
        to: 'angular',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(
        plan.manual_steps.some((s) => s.description.toLowerCase().includes('decorator'))
      ).toBe(true)
    })

    it('should add Qwik-specific manual steps', async () => {
      const config: FrameworkSwapConfig = {
        from: 'react',
        to: 'qwik',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(
        plan.manual_steps.some((s) => s.description.toLowerCase().includes('resumability'))
      ).toBe(true)
    })

    it('should skip manual steps when option is disabled', async () => {
      const customPlanner = new SwapPlanner({ include_manual_steps: false })

      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'angular',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await customPlanner.generatePlan(
        config,
        mockDetectedFramework,
        mockCompatibility
      )

      expect(plan.manual_steps).toHaveLength(0)
    })

    it('should include documentation URLs for manual steps', async () => {
      mockCompatibility.issues = [
        {
          severity: 'critical',
          category: 'routing',
          description: 'Routing issue',
          impact: 'High',
          suggestion: 'Fix routing',
          documentation_url: 'https://example.com/routing',
        },
      ]

      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      const routingStep = plan.manual_steps.find((s) => s.title === 'Routing issue')
      expect(routingStep).toBeDefined()
      expect(routingStep!.documentation_url).toBe('https://example.com/routing')
    })

    it('should add routing migration manual step when routing types differ', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(
        plan.manual_steps.some((s) => s.title.toLowerCase().includes('routing'))
      ).toBe(true)
    })
  })

  describe('plan validation', () => {
    it('should validate a valid plan', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)
      const validation = planner.validatePlan(plan)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect circular dependencies', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      // Artificially add circular dependency
      plan.dependencies_to_add.push({
        package: 'next',
        to_version: 'latest',
        type: 'dependencies',
        reason: 'test',
      })
      plan.dependencies_to_remove.push('next')

      const validation = planner.validatePlan(plan)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('circular'))).toBe(true)
    })

    it('should detect file conflicts', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      // Artificially add file conflict
      plan.files_to_create.push({
        path: 'src/test.ts',
        action: 'create',
        description: 'test',
      })
      plan.files_to_delete.push('src/test.ts')

      const validation = planner.validatePlan(plan)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('created and deleted'))).toBe(true)
    })

    it('should detect missing dependencies', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: false, // Don't migrate dependencies
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      const validation = planner.validatePlan(plan)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('No dependencies'))).toBe(true)
    })
  })

  describe('time estimation', () => {
    it('should disable time estimation when option is false', async () => {
      const customPlanner = new SwapPlanner({ estimate_time: false })

      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await customPlanner.generatePlan(
        config,
        mockDetectedFramework,
        mockCompatibility
      )

      expect(plan.estimated_time).toBe(0)
    })

    it('should scale time with number of changes', async () => {
      const config1: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const config2: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'angular',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      // Add critical issues to second config to increase manual steps
      mockCompatibility.issues = [
        {
          severity: 'critical',
          category: 'framework',
          description: 'Issue 1',
          impact: 'High',
          suggestion: 'Fix',
        },
        {
          severity: 'critical',
          category: 'routing',
          description: 'Issue 2',
          impact: 'High',
          suggestion: 'Fix',
        },
      ]

      const plan1 = await planner.generatePlan(config1, mockDetectedFramework, {
        ...mockCompatibility,
        issues: [],
      })

      mockCompatibility.to = 'angular'
      const plan2 = await planner.generatePlan(config2, mockDetectedFramework, mockCompatibility)

      // Angular swap should take longer due to more manual steps
      expect(plan2.estimated_time).toBeGreaterThan(plan1.estimated_time)
    })
  })

  describe('framework-specific behavior', () => {
    it('should handle Next.js to React swap', async () => {
      const config: FrameworkSwapConfig = {
        from: 'nextjs',
        to: 'react',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.dependencies_to_remove).toContain('next')
      expect(plan.dependencies_to_add.some((d) => d.package === 'react')).toBe(true)
      expect(plan.files_to_delete).toContain('next.config.js')
      expect(plan.files_to_create.some((f) => f.path === 'vite.config.ts')).toBe(true)
    })

    it('should handle Vue to Nuxt swap', async () => {
      mockDetectedFramework.type = 'vue'

      const config: FrameworkSwapConfig = {
        from: 'vue',
        to: 'nuxt',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.dependencies_to_add.some((d) => d.package === 'nuxt')).toBe(true)
      expect(plan.scripts_to_update.some((s) => s.to_command.includes('nuxt'))).toBe(true)
    })

    it('should handle React to Solid swap', async () => {
      mockDetectedFramework.type = 'react'
      mockCompatibility.from = 'react'
      mockCompatibility.to = 'solid'

      const config: FrameworkSwapConfig = {
        from: 'react',
        to: 'solid',
        preserve_features: true,
        migrate_dependencies: true,
        update_configs: true,
        create_backup: true,
      }

      const plan = await planner.generatePlan(config, mockDetectedFramework, mockCompatibility)

      expect(plan.dependencies_to_add.some((d) => d.package === 'solid-js')).toBe(true)
      // React and Solid both use src/index.tsx, so it's modified not created
      expect(plan.files_to_modify.some((f) => f.path === 'src/index.tsx')).toBe(true)
    })
  })
})
