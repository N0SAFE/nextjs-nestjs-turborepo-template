/**
 * Tests for Framework Swap Executor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs/promises'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import * as path from 'path'
import { SwapExecutor } from '../src/swap/executor'
import type {
  FrameworkSwapPlan,
  FrameworkSwapResult,
  FileChange,
  ConfigChange,
  DependencyChange,
  ScriptChange,
} from '../src/swap/types'

// Test directory
const TEST_DIR = path.join(__dirname, '__test-swap-executor__')

// Mock plan
const createMockPlan = (): FrameworkSwapPlan => ({
  config: {
    from: 'nextjs',
    to: 'react',
    preserve_features: true,
    migrate_dependencies: true,
    update_configs: true,
    create_backup: false,
  },
  dependencies_to_add: [
    {
      package: 'react',
      to_version: '^18.2.0',
      type: 'dependencies',
      reason: 'Core React library',
    },
    {
      package: 'react-dom',
      to_version: '^18.2.0',
      type: 'dependencies',
      reason: 'React DOM library',
    },
  ],
  dependencies_to_remove: ['next'],
  dependencies_to_update: [
    {
      package: 'typescript',
      from_version: '^4.9.0',
      to_version: '^5.0.0',
      type: 'devDependencies',
      reason: 'TypeScript 5.x required',
    },
  ],
  files_to_create: [
    {
      path: 'src/main.tsx',
      action: 'create',
      content: 'import React from "react"\nimport ReactDOM from "react-dom/client"\n',
      description: 'Create React entry file',
    },
  ],
  files_to_modify: [],
  files_to_delete: ['next.config.js'],
  configs_to_update: [
    {
      file: 'package.json',
      changes: { type: 'module' },
      merge_strategy: 'merge',
      description: 'Set package type to module',
    },
    {
      file: 'tsconfig.json',
      changes: { compilerOptions: { jsx: 'react-jsx' } },
      merge_strategy: 'merge',
      description: 'Update TypeScript JSX mode',
    },
  ],
  scripts_to_update: [
    { name: 'dev', from_command: 'next dev', to_command: 'vite', description: 'Update dev script' },
    { name: 'build', from_command: 'next build', to_command: 'vite build', description: 'Update build script' },
  ],
  manual_steps: [],
  warnings: [],
  estimated_time: 300,
})

describe('SwapExecutor', () => {
  let executor: SwapExecutor

  beforeEach(() => {
    // Create test directory
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true })
    }

    // Create initial package.json
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        next: '13.0.0',
      },
      devDependencies: {
        typescript: '^4.9.0',
      },
      scripts: {
        dev: 'next dev',
        build: 'next build',
      },
    }
    writeFileSync(path.join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

    // Create next.config.js
    writeFileSync(path.join(TEST_DIR, 'next.config.js'), 'module.exports = {}')

    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        jsx: 'preserve',
        target: 'es2015',
      },
    }
    writeFileSync(path.join(TEST_DIR, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))

    executor = new SwapExecutor({
      project_root: TEST_DIR,
      verbose: false,
      dry_run: false,
    })
  })

  afterEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  describe('execute', () => {
    it('should execute a complete swap plan', async () => {
      const plan = createMockPlan()
      const result = await executor.execute(plan)

      expect(result.success).toBe(true)
      expect(result.from_framework).toBe('nextjs')
      expect(result.to_framework).toBe('react')
      expect(result.errors).toHaveLength(0)
    })

    it('should track dependencies changed', async () => {
      const plan = createMockPlan()
      const result = await executor.execute(plan)

      expect(result.dependencies_changed).toBeGreaterThan(0)
    })

    it('should track files changed', async () => {
      const plan = createMockPlan()
      const result = await executor.execute(plan)

      expect(result.files_changed).toBeGreaterThan(0)
    })

    it('should track configs changed', async () => {
      const plan = createMockPlan()
      const result = await executor.execute(plan)

      expect(result.configs_changed).toBeGreaterThan(0)
    })

    it('should track scripts changed', async () => {
      const plan = createMockPlan()
      const result = await executor.execute(plan)

      expect(result.scripts_changed).toBeGreaterThan(0)
    })

    it('should include manual steps in result', async () => {
      const plan = createMockPlan()
      plan.manual_steps = [
        {
          title: 'Update routing',
          description: 'Migrate file-based routing to React Router',
          priority: 'high',
          category: 'code',
        },
      ]

      const result = await executor.execute(plan)
      expect(result.manual_steps).toHaveLength(1)
    })

    it('should include warnings in result', async () => {
      const plan = createMockPlan()
      plan.warnings = ['Some features may not work']

      const result = await executor.execute(plan)
      expect(result.warnings).toHaveLength(1)
    })

    it('should record execution duration', async () => {
      const plan = createMockPlan()
      const result = await executor.execute(plan)

      expect(result.duration).toBeGreaterThan(0)
    })
  })

  describe('dependency changes', () => {
    it('should remove dependencies', async () => {
      const plan = createMockPlan()
      await executor.execute(plan)

      const packageJson = JSON.parse(
        await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8')
      )

      expect(packageJson.dependencies.next).toBeUndefined()
    })

    it('should add dependencies', async () => {
      const plan = createMockPlan()
      await executor.execute(plan)

      const packageJson = JSON.parse(
        await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8')
      )

      expect(packageJson.dependencies.react).toBe('^18.2.0')
      expect(packageJson.dependencies['react-dom']).toBe('^18.2.0')
    })

    it('should update dependencies', async () => {
      const plan = createMockPlan()
      await executor.execute(plan)

      const packageJson = JSON.parse(
        await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8')
      )

      expect(packageJson.devDependencies.typescript).toBe('^5.0.0')
    })

    it('should create dependencies object if missing', async () => {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8')
      )
      delete packageJson.dependencies
      await fs.writeFile(path.join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

      const plan = createMockPlan()
      await executor.execute(plan)

      const updated = JSON.parse(await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8'))
      expect(updated.dependencies).toBeDefined()
      expect(updated.dependencies.react).toBe('^18.2.0')
    })
  })

  describe('file changes', () => {
    it('should create new files', async () => {
      const plan = createMockPlan()
      await executor.execute(plan)

      const filePath = path.join(TEST_DIR, 'src/main.tsx')
      expect(existsSync(filePath)).toBe(true)

      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toContain('import React')
    })

    it('should delete files', async () => {
      const plan = createMockPlan()
      await executor.execute(plan)

      const filePath = path.join(TEST_DIR, 'next.config.js')
      expect(existsSync(filePath)).toBe(false)
    })

    it('should create nested directories for files', async () => {
      const plan = createMockPlan()
      plan.files_to_create.push({
        path: 'src/components/App.tsx',
        action: 'create',
        content: 'export default function App() { return <div>App</div> }',
        description: 'Create App component',
      })

      await executor.execute(plan)

      const filePath = path.join(TEST_DIR, 'src/components/App.tsx')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should modify existing files', async () => {
      // Create a file to modify
      mkdirSync(path.join(TEST_DIR, 'src'), { recursive: true })
      writeFileSync(path.join(TEST_DIR, 'src/index.ts'), 'console.log("old")')

      const plan = createMockPlan()
      plan.files_to_modify.push({
        path: 'src/index.ts',
        action: 'modify',
        content: 'console.log("new")',
        description: 'Modify index file',
      })

      await executor.execute(plan)

      const content = await fs.readFile(path.join(TEST_DIR, 'src/index.ts'), 'utf-8')
      expect(content).toContain('new')
      expect(content).not.toContain('old')
    })

    it('should create file if modify target does not exist', async () => {
      const plan = createMockPlan()
      plan.files_to_modify.push({
        path: 'src/new-file.ts',
        action: 'modify',
        content: 'export const x = 1',
        description: 'Create new file',
      })

      await executor.execute(plan)

      const filePath = path.join(TEST_DIR, 'src/new-file.ts')
      expect(existsSync(filePath)).toBe(true)
    })
  })

  describe('config changes', () => {
    it('should update package.json with merge strategy', async () => {
      const plan = createMockPlan()
      await executor.execute(plan)

      const packageJson = JSON.parse(
        await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8')
      )

      expect(packageJson.type).toBe('module')
    })

    it('should update tsconfig.json with merge strategy', async () => {
      const plan = createMockPlan()
      await executor.execute(plan)

      const tsconfig = JSON.parse(await fs.readFile(path.join(TEST_DIR, 'tsconfig.json'), 'utf-8'))

      expect(tsconfig.compilerOptions.jsx).toBe('react-jsx')
      expect(tsconfig.compilerOptions.target).toBe('es2015') // Preserved
    })

    it('should deep merge nested config objects', async () => {
      const plan = createMockPlan()
      plan.configs_to_update.push({
        file: 'tsconfig.json',
        changes: {
          compilerOptions: {
            strict: true,
          },
        },
        merge_strategy: 'merge',
        description: 'Enable strict mode',
      })

      await executor.execute(plan)

      const tsconfig = JSON.parse(await fs.readFile(path.join(TEST_DIR, 'tsconfig.json'), 'utf-8'))

      expect(tsconfig.compilerOptions.jsx).toBe('react-jsx')
      expect(tsconfig.compilerOptions.strict).toBe(true)
      expect(tsconfig.compilerOptions.target).toBe('es2015')
    })

    it('should replace config with replace strategy', async () => {
      const plan = createMockPlan()
      if (plan.configs_to_update[1]) {
        plan.configs_to_update[1].merge_strategy = 'replace'
        plan.configs_to_update[1].changes = {
          compilerOptions: {
            jsx: 'react-jsx',
          },
        }
      }

      await executor.execute(plan)

      const tsconfig = JSON.parse(await fs.readFile(path.join(TEST_DIR, 'tsconfig.json'), 'utf-8'))

      expect(tsconfig.compilerOptions.jsx).toBe('react-jsx')
      expect(tsconfig.compilerOptions.target).toBeUndefined() // Not preserved
    })

    it('should warn if config file not found', async () => {
      const plan = createMockPlan()
      plan.configs_to_update.push({
        file: 'vite.config.ts',
        changes: {},
        merge_strategy: 'merge',
        description: 'Add Vite config',
      })

      const result = await executor.execute(plan)

      expect(result.warnings.some((w) => w.includes('vite.config.ts'))).toBe(true)
    })
  })

  describe('script changes', () => {
    it('should update npm scripts', async () => {
      const plan = createMockPlan()
      await executor.execute(plan)

      const packageJson = JSON.parse(
        await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8')
      )

      expect(packageJson.scripts.dev).toBe('vite')
      expect(packageJson.scripts.build).toBe('vite build')
    })

    it('should create scripts object if missing', async () => {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8')
      )
      delete packageJson.scripts
      await fs.writeFile(path.join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

      const plan = createMockPlan()
      await executor.execute(plan)

      const updated = JSON.parse(await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8'))
      expect(updated.scripts).toBeDefined()
      expect(updated.scripts.dev).toBe('vite')
    })
  })

  describe('dry run mode', () => {
    beforeEach(() => {
      executor = new SwapExecutor({
        project_root: TEST_DIR,
        dry_run: true,
      })
    })

    it('should not modify files in dry run', async () => {
      const original = await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8')

      const plan = createMockPlan()
      await executor.execute(plan)

      const after = await fs.readFile(path.join(TEST_DIR, 'package.json'), 'utf-8')
      expect(after).toBe(original)
    })

    it('should not create files in dry run', async () => {
      const plan = createMockPlan()
      await executor.execute(plan)

      const filePath = path.join(TEST_DIR, 'src/main.tsx')
      expect(existsSync(filePath)).toBe(false)
    })

    it('should not delete files in dry run', async () => {
      const plan = createMockPlan()
      await executor.execute(plan)

      const filePath = path.join(TEST_DIR, 'next.config.js')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should still return accurate change counts in dry run', async () => {
      const plan = createMockPlan()
      const result = await executor.execute(plan)

      expect(result.dependencies_changed).toBeGreaterThan(0)
      expect(result.files_changed).toBeGreaterThan(0)
      expect(result.configs_changed).toBeGreaterThan(0)
      expect(result.scripts_changed).toBeGreaterThan(0)
    })
  })

  describe('backup creation', () => {
    beforeEach(() => {
      executor = new SwapExecutor({
        project_root: TEST_DIR,
        dry_run: false,
      })
    })

    it('should create backup when requested', async () => {
      const plan = createMockPlan()
      plan.config.create_backup = true

      const result = await executor.execute(plan)

      expect(result.backup_path).toBeDefined()
      expect(existsSync(result.backup_path!)).toBe(true)
    })

    it('should backup package.json', async () => {
      const plan = createMockPlan()
      plan.config.create_backup = true

      const result = await executor.execute(plan)

      const backupPath = path.join(result.backup_path!, 'package.json')
      expect(existsSync(backupPath)).toBe(true)
    })

    it('should backup config files', async () => {
      const plan = createMockPlan()
      plan.config.create_backup = true

      const result = await executor.execute(plan)

      const backupPath = path.join(result.backup_path!, 'next.config.js')
      expect(existsSync(backupPath)).toBe(true)
    })

    it('should not create backup in dry run mode', async () => {
      executor = new SwapExecutor({
        project_root: TEST_DIR,
        dry_run: true,
      })

      const plan = createMockPlan()
      plan.config.create_backup = true

      const result = await executor.execute(plan)

      expect(result.backup_path).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('should handle missing package.json gracefully', async () => {
      rmSync(path.join(TEST_DIR, 'package.json'), { force: true })

      const plan = createMockPlan()
      const result = await executor.execute(plan)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should continue execution after file deletion error', async () => {
      const plan = createMockPlan()
      plan.files_to_delete.push('non-existent-file.txt')

      const result = await executor.execute(plan)

      // Should still succeed overall, just skip the missing file
      expect(result.success).toBe(true)
    })

    it('should track errors during execution', async () => {
      const plan = createMockPlan()
      plan.files_to_create.push({
        path: '/invalid-absolute-path.txt',
        action: 'create',
        content: 'test',
        description: 'Invalid file path test',
      })

      const result = await executor.execute(plan)

      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateEnvironment', () => {
    it('should validate a correct environment', async () => {
      const validation = await executor.validateEnvironment()

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing project root', async () => {
      executor = new SwapExecutor({
        project_root: '/non-existent-directory',
      })

      const validation = await executor.validateEnvironment()

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('does not exist'))).toBe(true)
    })

    it('should detect missing package.json', async () => {
      rmSync(path.join(TEST_DIR, 'package.json'), { force: true })

      const validation = await executor.validateEnvironment()

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('package.json'))).toBe(true)
    })
  })

  describe('preview', () => {
    it('should generate preview string', async () => {
      const plan = createMockPlan()
      const preview = await executor.preview(plan)

      expect(preview).toContain('Framework Swap Preview')
      expect(preview).toContain('From: nextjs')
      expect(preview).toContain('To: react')
    })

    it('should show dependency changes in preview', async () => {
      const plan = createMockPlan()
      const preview = await executor.preview(plan)

      expect(preview).toContain('Dependency Changes')
      expect(preview).toContain('Remove: next')
      expect(preview).toContain('Add: react')
    })

    it('should show file changes in preview', async () => {
      const plan = createMockPlan()
      const preview = await executor.preview(plan)

      expect(preview).toContain('File Changes')
      expect(preview).toContain('Create: src/main.tsx')
      expect(preview).toContain('Delete: next.config.js')
    })

    it('should show config changes in preview', async () => {
      const plan = createMockPlan()
      const preview = await executor.preview(plan)

      expect(preview).toContain('Config Changes')
      expect(preview).toContain('package.json')
      expect(preview).toContain('tsconfig.json')
    })

    it('should show script changes in preview', async () => {
      const plan = createMockPlan()
      const preview = await executor.preview(plan)

      expect(preview).toContain('Script Changes')
      expect(preview).toContain('dev')
      expect(preview).toContain('vite')
    })

    it('should show manual steps in preview', async () => {
      const plan = createMockPlan()
      plan.manual_steps.push({
        title: 'Update routing',
        description: 'Migrate to React Router',
        priority: 'high',
        category: 'code',
        documentation_url: 'https://reactrouter.com/en/main',
      })

      const preview = await executor.preview(plan)

      expect(preview).toContain('Manual Steps Required')
      expect(preview).toContain('Update routing')
    })

    it('should show warnings in preview', async () => {
      const plan = createMockPlan()
      plan.warnings.push('Some features may not work')

      const preview = await executor.preview(plan)

      expect(preview).toContain('Warnings')
      expect(preview).toContain('Some features may not work')
    })

    it('should show summary statistics', async () => {
      const plan = createMockPlan()
      const preview = await executor.preview(plan)

      expect(preview).toContain('Summary')
      expect(preview).toContain('Dependencies')
      expect(preview).toContain('Files')
      expect(preview).toContain('Configs')
      expect(preview).toContain('Scripts')
    })
  })
})
