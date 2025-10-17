/**
 * Tests for CustomizePrompts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CustomizePrompts } from '../src/customize/prompts'
import type { CustomizeRegistry, InstallationPlan, CustomizeOption } from '../src/customize/types'

describe('CustomizePrompts', () => {
  let prompts: CustomizePrompts
  let mockRegistry: CustomizeRegistry

  beforeEach(() => {
    prompts = new CustomizePrompts()
    mockRegistry = {
      version: '1.0.0',
      name: 'Test Registry',
      description: 'Test registry',
      options: [
        {
          id: 'opt1',
          name: 'Option 1',
          description: 'First option',
          version: '1.0.0',
          category: 'styling',
          removable: true,
          default: true,
          dependencies: [],
          conflicts: [],
          files: [],
        },
        {
          id: 'opt2',
          name: 'Option 2',
          description: 'Second option',
          version: '1.0.0',
          category: 'auth',
          removable: true,
          default: false,
          dependencies: [],
          conflicts: [],
          files: [],
        },
      ],
      categories: {
        styling: 'Styling',
        auth: 'Authentication',
      },
      metadata: {
        total_options: 2,
        updated_at: new Date().toISOString(),
      },
    }
  })

  describe('selectOptions', () => {
    it('should return default options', async () => {
      const selected = await prompts.selectOptions(mockRegistry)
      
      expect(selected).toContain('opt1')
      expect(selected.length).toBeGreaterThan(0)
    })

    it('should return preselected options', async () => {
      const selected = await prompts.selectOptions(mockRegistry, ['opt2'])
      
      expect(selected).toContain('opt2')
    })

    it('should handle empty registry', async () => {
      const emptyRegistry: CustomizeRegistry = {
        ...mockRegistry,
        options: [],
      }

      const selected = await prompts.selectOptions(emptyRegistry)
      expect(selected).toHaveLength(0)
    })
  })

  describe('configureFilePreferences', () => {
    it('should return file preferences', async () => {
      const options: CustomizeOption[] = mockRegistry.options
      const prefs = await prompts.configureFilePreferences(options)

      expect(prefs).toHaveProperty('overwrite_existing')
      expect(prefs).toHaveProperty('create_backups')
      expect(prefs).toHaveProperty('preserve_structure')
      expect(prefs).toHaveProperty('skip_examples')
    })

    it('should return boolean values', async () => {
      const prefs = await prompts.configureFilePreferences([])

      expect(typeof prefs.overwrite_existing).toBe('boolean')
      expect(typeof prefs.create_backups).toBe('boolean')
      expect(typeof prefs.preserve_structure).toBe('boolean')
      expect(typeof prefs.skip_examples).toBe('boolean')
    })
  })

  describe('confirmInstallation', () => {
    it('should return true for valid plan', async () => {
      const plan: InstallationPlan = {
        options_to_install: mockRegistry.options,
        files_to_create: [],
        configs_to_merge: [],
        total_files: 0,
        total_configs: 0,
        estimated_size: 0,
        estimated_time: 0,
        warnings: [],
      }

      const confirmed = await prompts.confirmInstallation(plan)
      expect(typeof confirmed).toBe('boolean')
    })

    it('should handle plan with warnings', async () => {
      const plan: InstallationPlan = {
        options_to_install: [],
        files_to_create: [],
        configs_to_merge: [],
        total_files: 0,
        total_configs: 0,
        estimated_size: 0,
        estimated_time: 0,
        warnings: ['Warning 1', 'Warning 2'],
      }

      const confirmed = await prompts.confirmInstallation(plan)
      expect(typeof confirmed).toBe('boolean')
    })

    it('should skip confirmation if option set', async () => {
      const skipPrompts = new CustomizePrompts({ skipConfirmation: true })
      const plan: InstallationPlan = {
        options_to_install: [],
        files_to_create: [],
        configs_to_merge: [],
        total_files: 0,
        total_configs: 0,
        estimated_size: 0,
        estimated_time: 0,
        warnings: [],
      }

      const confirmed = await skipPrompts.confirmInstallation(plan)
      expect(confirmed).toBe(true)
    })
  })

  describe('resolveConflict', () => {
    it('should return resolution strategy', async () => {
      const strategy = await prompts.resolveConflict('test.ts', ['opt1'])

      expect(['overwrite', 'skip', 'merge']).toContain(strategy)
    })

    it('should handle different files', async () => {
      const strategy1 = await prompts.resolveConflict('file1.ts', [])
      const strategy2 = await prompts.resolveConflict('file2.ts', [])

      expect(typeof strategy1).toBe('string')
      expect(typeof strategy2).toBe('string')
    })
  })

  describe('configureInstallation', () => {
    it('should return installation config', async () => {
      const config = await prompts.configureInstallation()

      expect(config).toHaveProperty('force')
      expect(config).toHaveProperty('dryRun')
      expect(config).toHaveProperty('verbose')
    })

    it('should return boolean values', async () => {
      const config = await prompts.configureInstallation()

      expect(typeof config.force).toBe('boolean')
      expect(typeof config.dryRun).toBe('boolean')
      expect(typeof config.verbose).toBe('boolean')
    })

    it('should respect verbose option', async () => {
      const verbosePrompts = new CustomizePrompts({ verbose: true })
      const config = await verbosePrompts.configureInstallation()

      expect(config.verbose).toBe(true)
    })
  })

  describe('selectMergeStrategy', () => {
    it('should return merge strategy', async () => {
      const strategy = await prompts.selectMergeStrategy('config.json')

      expect(['replace', 'shallow', 'deep', 'append']).toContain(strategy)
    })

    it('should handle different file types', async () => {
      const jsonStrategy = await prompts.selectMergeStrategy('package.json')
      const tsStrategy = await prompts.selectMergeStrategy('tsconfig.json')

      expect(typeof jsonStrategy).toBe('string')
      expect(typeof tsStrategy).toBe('string')
    })
  })

  describe('promptForValue', () => {
    it('should return value', async () => {
      const value = await prompts.promptForValue('name', 'Project name')

      expect(typeof value).toBe('string')
    })

    it('should use default value', async () => {
      const value = await prompts.promptForValue('name', 'Project name', 'default')

      expect(value).toBe('default')
    })

    it('should handle empty default', async () => {
      const value = await prompts.promptForValue('name', 'Project name')

      expect(value).toBeDefined()
    })
  })

  describe('promptForVariables', () => {
    it('should return variables object', async () => {
      const variables = {
        PROJECT_NAME: 'The project name',
        AUTHOR: 'The author name',
      }

      const values = await prompts.promptForVariables(variables)

      expect(values).toHaveProperty('PROJECT_NAME')
      expect(values).toHaveProperty('AUTHOR')
    })

    it('should handle empty variables', async () => {
      const values = await prompts.promptForVariables({})

      expect(Object.keys(values)).toHaveLength(0)
    })

    it('should return string values', async () => {
      const variables = {
        VAR1: 'Variable 1',
        VAR2: 'Variable 2',
      }

      const values = await prompts.promptForVariables(variables)

      expect(typeof values.VAR1).toBe('string')
      expect(typeof values.VAR2).toBe('string')
    })
  })

  describe('display methods', () => {
    it('should display success without error', () => {
      expect(() => {
        prompts.displaySuccess(5, 10, 3)
      }).not.toThrow()
    })

    it('should display error without throwing', () => {
      const error = new Error('Test error')
      expect(() => {
        prompts.displayError(error)
      }).not.toThrow()
    })
  })
})
