import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import * as path from 'path'

describe('TypeScript Config', () => {
  const configs = [
    'base.json',
    'nextjs.json',
    'react-library.json',
    'scripts.json',
    'nestjs.json'
  ]
  
  const configsFolder = path.join(__dirname, '../', 'config')

  describe('Configuration Files', () => {
    configs.forEach(configFile => {
      describe(`${configFile}`, () => {
        const configPath = path.join(configsFolder, configFile)
        
        it('should exist', () => {
          expect(existsSync(configPath)).toBe(true)
        })

        it('should be valid JSON', () => {
          if (existsSync(configPath)) {
            expect(() => {
              JSON.parse(readFileSync(configPath, 'utf8'))
            }).not.toThrow()
          }
        })

        it('should have valid TypeScript configuration structure', () => {
          if (existsSync(configPath)) {
            const config = JSON.parse(readFileSync(configPath, 'utf8'))
            
            // Should have compilerOptions or extends
            const hasValidStructure = 
              config.compilerOptions || 
              config.extends || 
              config.include || 
              config.exclude
            
            expect(hasValidStructure).toBeTruthy()
          }
        })

        if (configFile !== 'base.json') {
          it('should extend from a base configuration', () => {
            if (existsSync(configPath)) {
              const config = JSON.parse(readFileSync(configPath, 'utf8'))
              
              if (config.extends) {
                expect(typeof config.extends).toBe('string')
                expect(config.extends.length).toBeGreaterThan(0)
              }
            }
          })
        }
      })
    })
  })

  describe('Base Configuration', () => {
    const baseConfigPath = path.join(__dirname, 'config', 'base.json')
    
    it('should have essential compiler options', () => {
      if (existsSync(baseConfigPath)) {
        const config = JSON.parse(readFileSync(baseConfigPath, 'utf8'))
        
        if (config.compilerOptions) {
          // Should have target
          expect(config.compilerOptions.target).toBeDefined()
          
          // Should have module system
          expect(config.compilerOptions.module || config.compilerOptions.moduleResolution).toBeDefined()
          
          // Should have strict mode settings
          if (config.compilerOptions.strict !== undefined) {
            expect(typeof config.compilerOptions.strict).toBe('boolean')
          }
        }
      }
    })

    it('should have reasonable defaults', () => {
      if (existsSync(baseConfigPath)) {
        const config = JSON.parse(readFileSync(baseConfigPath, 'utf8'))
        
        if (config.compilerOptions) {
          // Target should be reasonable
          if (config.compilerOptions.target) {
            expect(['ES5', 'ES6', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020', 'ES2021', 'ES2022', 'ESNext'])
              .toContain(config.compilerOptions.target)
          }
          
          // Module should be reasonable
          if (config.compilerOptions.module) {
            expect(['CommonJS', 'AMD', 'System', 'UMD', 'ES6', 'ES2015', 'ES2020', 'ESNext', 'None'])
              .toContain(config.compilerOptions.module)
          }
        }
      }
    })
  })

  describe('Next.js Configuration', () => {
    const nextConfigPath = path.join(__dirname, 'config', 'nextjs.json')
    
    it('should have Next.js specific settings if exists', () => {
      if (existsSync(nextConfigPath)) {
        const config = JSON.parse(readFileSync(nextConfigPath, 'utf8'))
        
        if (config.compilerOptions) {
          // Should support JSX
          if (config.compilerOptions.jsx) {
            expect(['react', 'react-jsx', 'react-jsxdev', 'preserve']).toContain(config.compilerOptions.jsx)
          }
          
          // Should have lib array with DOM
          if (config.compilerOptions.lib) {
            expect(Array.isArray(config.compilerOptions.lib)).toBe(true)
          }
        }
      }
    })
  })

  describe('React Library Configuration', () => {
    const reactLibConfigPath = path.join(__dirname, 'config', 'react-library.json')
    
    it('should have library-specific settings if exists', () => {
      if (existsSync(reactLibConfigPath)) {
        const config = JSON.parse(readFileSync(reactLibConfigPath, 'utf8'))
        
        if (config.compilerOptions) {
          // Should support declaration files for libraries
          if (config.compilerOptions.declaration !== undefined) {
            expect(typeof config.compilerOptions.declaration).toBe('boolean')
          }
          
          // Should have proper module settings for libraries
          if (config.compilerOptions.module) {
            expect(typeof config.compilerOptions.module).toBe('string')
          }
        }
      }
    })
  })

  describe('Package Structure', () => {
    it('should have correct package.json metadata', () => {
      const packageJsonPath = path.join(__dirname, '../', 'package.json')
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      
      expect(packageJson.name).toBe('@repo/tsconfig')
      expect(packageJson.version).toBeDefined()
    })

    it('should be marked as private', () => {
      const packageJsonPath = path.join(__dirname, '../', 'package.json')
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      
      expect(packageJson.private).toBe(true)
    })
  })

  describe('Configuration Validation', () => {
    configs.forEach(configFile => {
      it(`${configFile} should not have circular extends`, () => {
        const configPath = path.join(configsFolder, configFile)
        if (existsSync(configPath)) {
          const config = JSON.parse(readFileSync(configPath, 'utf8'))
          
          if (config.extends) {
            // Extract just the filename from the extends path
            const extendsFilename = path.basename(config.extends)
            // Should not extend itself
            expect(extendsFilename).not.toBe(configFile)
          }
        }
      })
    })

    configs.forEach(configFile => {
      it(`${configFile} should be valid for TypeScript compiler`, () => {
        const configPath = path.join(configsFolder, configFile)
        if (existsSync(configPath)) {
          const config = JSON.parse(readFileSync(configPath, 'utf8'))
          
          // Should not have unknown top-level properties
          const validTopLevelKeys = [
            'compilerOptions', 'extends', 'include', 'exclude', 
            'files', 'references', 'typeAcquisition', 'ts-node',
            '$schema', 'display'
          ]
          
          Object.keys(config).forEach(key => {
            expect(validTopLevelKeys).toContain(key)
          })
        }
      })
    })
  })

  describe('File Access', () => {
    configs.forEach(configFile => {
      it(`should be able to read ${configFile}`, () => {
        const configPath = path.join(configsFolder, configFile)
        if (existsSync(configPath)) {
          expect(() => {
            readFileSync(configPath, 'utf8')
          }).not.toThrow()
        }
      })
    })
  })
})
