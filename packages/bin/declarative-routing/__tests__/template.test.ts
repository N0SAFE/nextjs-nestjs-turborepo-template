import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as path from 'path'
import { buildStringFromTemplate, buildFileFromTemplate } from '../src/template'
import { readFileSyncMock, writeFileSyncMock } from '../vitest.setup'

describe('template', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buildStringFromTemplate', () => {
    it('should compile and render template', async () => {
      const templateContent = 'Hello {{name}}!'
      readFileSyncMock.mockReturnValue(templateContent)

      const result = await buildStringFromTemplate('test.hbs', { name: 'World' })

      expect(result).toBe('Hello World!')
    })

    it('should cache compiled templates', async () => {
      const templateContent = 'Count: {{count}}'
      readFileSyncMock.mockReturnValue(templateContent)

      // First call
      await buildStringFromTemplate('counter.hbs', { count: 1 })
      
      // Second call should use cache
      await buildStringFromTemplate('counter.hbs', { count: 2 })

      // File should only be read once (template is cached)
      expect(readFileSyncMock).toHaveBeenCalledTimes(1)
    })

    it('should handle complex template with loops', async () => {
      const templateContent = '{{#each items}}{{this}},{{/each}}'
      readFileSyncMock.mockReturnValue(templateContent)

      const result = await buildStringFromTemplate('list.hbs', { 
        items: ['a', 'b', 'c'] 
      })

      expect(result).toBe('a,b,c,')
    })

    it('should handle template with conditionals', async () => {
      const templateContent = '{{#if show}}Visible{{else}}Hidden{{/if}}'
      readFileSyncMock.mockReturnValue(templateContent)

      const resultTrue = await buildStringFromTemplate('conditional.hbs', { show: true })
      expect(resultTrue).toBe('Visible')

      readFileSyncMock.mockReturnValue(templateContent)
      const resultFalse = await buildStringFromTemplate('conditional.hbs', { show: false })
      expect(resultFalse).toBe('Hidden')
    })

    it('should load template from assets directory', async () => {
      const templateContent = 'Template content'
      readFileSyncMock.mockReturnValue(templateContent)

      await buildStringFromTemplate('openapi.yml.hbs', {})

      const callArg = readFileSyncMock.mock.calls[0][0] as string
      expect(callArg).toContain('assets/openapi.yml.hbs')
    })
  })

  describe('buildFileFromTemplate', () => {
    it('should compile template and write to file', async () => {
      const templateContent = 'Generated: {{value}}'
      readFileSyncMock.mockReturnValue(templateContent)
      writeFileSyncMock.mockImplementation(() => {})

      await buildFileFromTemplate('output.hbs', 'dist/output.txt', { value: 42 })

      expect(writeFileSyncMock).toHaveBeenCalledWith('dist/output.txt', 'Generated: 42')
    })

    it('should handle nested data in template', async () => {
      const templateContent = '{{user.name}} - {{user.email}}'
      readFileSyncMock.mockReturnValue(templateContent)
      writeFileSyncMock.mockImplementation(() => {})

      await buildFileFromTemplate(
        'user.hbs',
        'output/user.txt',
        { user: { name: 'John', email: 'john@example.com' } }
      )

      expect(writeFileSyncMock).toHaveBeenCalledWith(
        'output/user.txt',
        'John - john@example.com'
      )
    })

    it('should write to specified destination path', async () => {
      const templateContent = 'Content'
      readFileSyncMock.mockReturnValue(templateContent)
      writeFileSyncMock.mockImplementation(() => {})

      const destinationPath = path.join('custom', 'path', 'file.txt')
      await buildFileFromTemplate('template.hbs', destinationPath, {})

      expect(writeFileSyncMock).toHaveBeenCalledWith(destinationPath, 'Content')
    })

    it('should handle empty data object', async () => {
      const templateContent = 'Static content'
      readFileSyncMock.mockReturnValue(templateContent)
      writeFileSyncMock.mockImplementation(() => {})

      await buildFileFromTemplate('static.hbs', 'output.txt', {})

      expect(writeFileSyncMock).toHaveBeenCalledWith('output.txt', 'Static content')
    })
  })
})
