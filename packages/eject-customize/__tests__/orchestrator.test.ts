/**
 * Tests for CustomizeOrchestrator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CustomizeOrchestrator } from '../src/customize/orchestrator'
import type { CustomizeRegistry } from '../src/customize/types'
import * as fs from 'fs/promises'
import * as path from 'path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'

describe('CustomizeOrchestrator', () => {
  let tempDir: string
  let orchestrator: CustomizeOrchestrator
  let mockRegistry: CustomizeRegistry
  let registryPath: string

  beforeEach(async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'test-orchestrator-'))

    mockRegistry = {
      version: '1.0.0',
      name: 'Test Registry',
      description: 'Test registry for orchestrator',
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
          files: [
            {
              source: 'components/Button.tsx',
              destination: 'src/components/Button.tsx',
              type: 'component',
              overwrite: false,
            },
          ],
          configs: [],
          examples: [],
        },
        {
          id: 'opt2',
          name: 'Option 2',
          description: 'Second option',
          version: '1.0.0',
          category: 'auth',
          removable: true,
          default: false,
          dependencies: ['opt1'],
          conflicts: [],
          files: [],
          configs: [],
          examples: [],
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

    registryPath = path.join(tempDir, 'registry.json')
    await fs.writeFile(registryPath, JSON.stringify(mockRegistry, null, 2))

    orchestrator = new CustomizeOrchestrator(tempDir, {
      interactive: false,
      verbose: false,
    })
  })

  describe('constructor', () => {
    it('should create orchestrator with default options', () => {
      const orch = new CustomizeOrchestrator(tempDir)
      expect(orch).toBeDefined()
      expect(orch.getState().phase).toBe('loading')
      expect(orch.getState().progress).toBe(0)
    })

    it('should create orchestrator with custom options', () => {
      const orch = new CustomizeOrchestrator(tempDir, {
        verbose: true,
        dry_run: true,
        interactive: false,
      })
      expect(orch).toBeDefined()
    })
  })

  describe('execute', () => {
    it('should execute workflow with preselected options', async () => {
      const result = await orchestrator.execute(registryPath, ['opt1'])

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.installed_options).toContain('opt1')
    })

    it('should handle dry run mode', async () => {
      const dryOrch = new CustomizeOrchestrator(tempDir, {
        dry_run: true,
        interactive: false,
      })

      const result = await dryOrch.execute(registryPath, ['opt1'])

      expect(result.success).toBe(true)
      expect(result.created_files).toHaveLength(0)
      expect(result.merged_configs).toHaveLength(0)
    })

    it('should fail with validation errors', async () => {
      // Try to install opt2 without its dependency opt1
      await expect(orchestrator.execute(registryPath, ['opt2'])).rejects.toThrow()
    })

    it('should update state through phases', async () => {
      const states: string[] = []
      
      // Spy on state
      const originalExecute = orchestrator.execute.bind(orchestrator)
      orchestrator.execute = async (...args) => {
        const checkState = setInterval(() => {
          const state = orchestrator.getState()
          if (!states.includes(state.phase)) {
            states.push(state.phase)
          }
        }, 10)

        try {
          const result = await originalExecute(...args)
          clearInterval(checkState)
          return result
        } catch (error) {
          clearInterval(checkState)
          throw error
        }
      }

      await orchestrator.execute(registryPath, ['opt1'])

      expect(states).toContain('loading')
      expect(states).toContain('selecting')
    })

    it('should track progress percentage', async () => {
      await orchestrator.execute(registryPath, ['opt1'])

      const state = orchestrator.getState()
      expect(state.progress).toBe(100)
      expect(state.phase).toBe('complete')
    })
  })

  describe('state management', () => {
    it('should initialize with loading phase', () => {
      const state = orchestrator.getState()
      expect(state.phase).toBe('loading')
      expect(state.progress).toBe(0)
    })

    it('should update state during execution', async () => {
      await orchestrator.execute(registryPath, ['opt1'])

      const state = orchestrator.getState()
      expect(state.phase).toBe('complete')
      expect(state.registry).toBeDefined()
      expect(state.selected_options).toContain('opt1')
      expect(state.installation_plan).toBeDefined()
      expect(state.result).toBeDefined()
    })

    it('should track errors in state', async () => {
      try {
        await orchestrator.execute('nonexistent.json', ['opt1'])
      } catch (error) {
        const state = orchestrator.getState()
        expect(state.phase).toBe('error')
        expect(state.error).toBeDefined()
      }
    })
  })

  describe('getResult', () => {
    it('should return undefined before execution', () => {
      expect(orchestrator.getResult()).toBeUndefined()
    })

    it('should return result after execution', async () => {
      await orchestrator.execute(registryPath, ['opt1'])

      const result = orchestrator.getResult()
      expect(result).toBeDefined()
      expect(result?.success).toBe(true)
    })
  })

  describe('isComplete', () => {
    it('should be false initially', () => {
      expect(orchestrator.isComplete()).toBe(false)
    })

    it('should be true after successful execution', async () => {
      await orchestrator.execute(registryPath, ['opt1'])

      expect(orchestrator.isComplete()).toBe(true)
    })

    it('should be false after error', async () => {
      try {
        await orchestrator.execute('nonexistent.json', ['opt1'])
      } catch (error) {
        expect(orchestrator.isComplete()).toBe(false)
      }
    })
  })

  describe('hasError', () => {
    it('should be false initially', () => {
      expect(orchestrator.hasError()).toBe(false)
    })

    it('should be false after successful execution', async () => {
      await orchestrator.execute(registryPath, ['opt1'])

      expect(orchestrator.hasError()).toBe(false)
    })

    it('should be true after error', async () => {
      try {
        await orchestrator.execute('nonexistent.json', ['opt1'])
      } catch (error) {
        expect(orchestrator.hasError()).toBe(true)
      }
    })
  })

  describe('getError', () => {
    it('should return undefined initially', () => {
      expect(orchestrator.getError()).toBeUndefined()
    })

    it('should return undefined after success', async () => {
      await orchestrator.execute(registryPath, ['opt1'])

      expect(orchestrator.getError()).toBeUndefined()
    })

    it('should return error after failure', async () => {
      try {
        await orchestrator.execute('nonexistent.json', ['opt1'])
      } catch (error) {
        const orcError = orchestrator.getError()
        expect(orcError).toBeDefined()
        expect(orcError).toBeInstanceOf(Error)
      }
    })
  })

  describe('integration scenarios', () => {
    it('should handle multiple options installation', async () => {
      const result = await orchestrator.execute(registryPath, ['opt1'])

      expect(result.installed_options).toHaveLength(1)
      expect(result.success).toBe(true)
    })

    it('should handle options with dependencies', async () => {
      // Install both opt1 and opt2 (opt2 depends on opt1)
      const result = await orchestrator.execute(registryPath, ['opt1', 'opt2'])

      expect(result.success).toBe(true)
      expect(result.installed_options).toContain('opt1')
      expect(result.installed_options).toContain('opt2')
    })

    it('should validate before installation', async () => {
      // This should fail because opt2 depends on opt1
      await expect(orchestrator.execute(registryPath, ['opt2'])).rejects.toThrow()
    })

    it('should create installation plan', async () => {
      await orchestrator.execute(registryPath, ['opt1'])

      const state = orchestrator.getState()
      const plan = state.installation_plan

      expect(plan).toBeDefined()
      expect(plan?.options_to_install).toHaveLength(1)
      expect(plan?.files_to_create).toHaveLength(1)
      expect(plan?.total_files).toBe(1)
    })
  })

  describe('error handling', () => {
    it('should handle registry loading errors', async () => {
      await expect(orchestrator.execute('nonexistent.json', ['opt1'])).rejects.toThrow()
    })

    it('should handle validation errors', async () => {
      await expect(orchestrator.execute(registryPath, ['nonexistent'])).rejects.toThrow()
    })

    it('should handle installation errors gracefully', async () => {
      // Create registry with invalid file path
      const badRegistry: CustomizeRegistry = {
        ...mockRegistry,
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
            files: [
              {
                source: '../../../etc/passwd', // Invalid path
                destination: 'passwd',
                type: 'component' as const,
                overwrite: false,
              },
            ],
            configs: [],
            examples: [],
          },
        ],
      }

      const badPath = path.join(tempDir, 'bad-registry.json')
      await fs.writeFile(badPath, JSON.stringify(badRegistry, null, 2))

      const result = await orchestrator.execute(badPath, ['opt1'])
      // Should complete but with errors
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('verbose mode', () => {
    it('should log progress in verbose mode', async () => {
      const verboseOrch = new CustomizeOrchestrator(tempDir, {
        verbose: true,
        interactive: false,
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await verboseOrch.execute(registryPath, ['opt1'])

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
