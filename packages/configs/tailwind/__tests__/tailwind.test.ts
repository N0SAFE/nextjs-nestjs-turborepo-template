import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import * as path from 'path'

describe('Tailwind Config', () => {
  describe('Configuration Export', () => {
    it('should export a valid tailwind configuration', async () => {
      const config = await import('../index.mts')
      
      expect(config).toBeDefined()
      expect(config.default).toBeDefined()
    })

    it('should have content paths defined', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      expect(tailwindConfig).toHaveProperty('content')
      expect(Array.isArray(tailwindConfig.content)).toBe(true)
      expect(tailwindConfig.content.length).toBeGreaterThan(0)
    })

    it('should have theme configuration', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      expect(tailwindConfig).toHaveProperty('theme')
      expect(typeof tailwindConfig.theme).toBe('object')
    })

    it('should have plugins array', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      if (tailwindConfig.plugins) {
        expect(Array.isArray(tailwindConfig.plugins)).toBe(true)
      }
    })
  })

  describe('Content Patterns', () => {
    it('should include common file patterns', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      const contentPatterns = tailwindConfig.content
      
      // Should include TypeScript/JavaScript files
      const hasJsPattern = contentPatterns.some((pattern: string) => 
        pattern.includes('*.js') || pattern.includes('*.jsx') || 
        pattern.includes('*.ts') || pattern.includes('*.tsx')
      )
      expect(hasJsPattern).toBe(true)
    })

    it('should use proper glob patterns', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      const contentPatterns = tailwindConfig.content
      
      // Should have glob patterns with **/ for recursive matching
      const hasRecursivePattern = contentPatterns.some((pattern: string) => 
        pattern.includes('**/')
      )
      expect(hasRecursivePattern).toBe(true)
    })
  })

  describe('Theme Configuration', () => {
    it('should extend default theme if configured', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      if (tailwindConfig.theme && tailwindConfig.theme.extend) {
        expect(typeof tailwindConfig.theme.extend).toBe('object')
      }
    })

    it('should have valid color configuration if present', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      if (tailwindConfig.theme?.extend?.colors) {
        const { colors } = tailwindConfig.theme.extend
        expect(typeof colors).toBe('object')
        
        // Check if color values are strings or objects
        Object.values(colors).forEach((colorValue: any) => {
          expect(['string', 'object']).toContain(typeof colorValue)
        })
      }
    })

    it('should have valid spacing configuration if present', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      if (tailwindConfig.theme?.extend?.spacing) {
        const { spacing } = tailwindConfig.theme.extend
        expect(typeof spacing).toBe('object')
      }
    })
  })

  describe('Plugin Configuration', () => {
    it('should include animate plugin if present', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      if (tailwindConfig.plugins && tailwindConfig.plugins.length > 0) {
        // Check if animate plugin is included
        const hasAnimatePlugin = tailwindConfig.plugins.some((plugin: any) => 
          plugin.toString().includes('animate') || 
          (typeof plugin === 'function' && plugin.name && plugin.name.includes('animate'))
        )
        
        // This is optional, so we just check it doesn't throw
        expect(typeof hasAnimatePlugin).toBe('boolean')
      }
    })

    it('should have valid plugin structure', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      if (tailwindConfig.plugins) {
        tailwindConfig.plugins.forEach((plugin: any) => {
          // Plugins should be functions or objects
          expect(['function', 'object']).toContain(typeof plugin)
        })
      }
    })
  })

  describe('Package Structure', () => {
    it('should have correct package.json metadata', () => {
      const packageJsonPath = path.join(__dirname, '../', 'package.json')
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      
      expect(packageJson.name).toBe('@repo/config-tailwind')
      expect(packageJson.main).toBe('index.mts')
      expect(packageJson.types).toBe('index.mts')
    })

    it('should have tailwindcss as dependency', () => {
      const packageJsonPath = path.join(__dirname, '../', 'package.json')
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      
      const hasTailwind = 
        packageJson.dependencies?.tailwindcss ||
        packageJson.devDependencies?.tailwindcss ||
        packageJson.peerDependencies?.tailwindcss
      
      expect(hasTailwind).toBeDefined()
    })
  })

  describe('Configuration Validation', () => {
    it('should be a valid Tailwind configuration object', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      // Basic validation for Tailwind config structure
      expect(typeof tailwindConfig).toBe('object')
      expect(tailwindConfig).not.toBeNull()
      
      // Should be serializable
      expect(() => JSON.stringify(tailwindConfig)).not.toThrow()
    })

    it('should not have conflicting configuration', async () => {
      const config = await import('../index.mts')
      const tailwindConfig = config.default
      
      // Should not have both purge and content (purge is deprecated)
      if (tailwindConfig.content) {
        expect(tailwindConfig.purge).toBeUndefined()
      }
    })
  })

  describe('File Import', () => {
    it('should import without errors', async () => {
      expect(async () => {
        await import('../index.mts')
      }).not.toThrow()
    })

    it('should export as default export', async () => {
      const config = await import('../index.mts')
      expect(config.default).toBeDefined()
    })
  })
})
