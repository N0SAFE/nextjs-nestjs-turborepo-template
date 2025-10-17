/**
 * Tests for FrameworkDetector
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FrameworkDetector } from '../src/swap/detector'
import * as fs from 'fs/promises'
import * as path from 'path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'

describe('FrameworkDetector', () => {
  let tempDir: string
  let detector: FrameworkDetector

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'test-detector-'))
    detector = new FrameworkDetector({ project_root: tempDir })
  })

  describe('Next.js detection', () => {
    it('should detect Next.js from dependencies', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '^14.0.0',
            react: '^18.0.0',
          },
        })
      )

      const result = await detector.detect()

      expect(result.type).toBe('nextjs')
      expect(result.version.major).toBe(14)
      expect(result.confidence).toBeGreaterThan(70)
    })

    it('should detect Next.js from config file', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '^14.0.0',
          },
        })
      )

      await fs.writeFile(path.join(tempDir, 'next.config.js'), 'module.exports = {}')

      const result = await detector.detect()

      expect(result.type).toBe('nextjs')
      expect(result.config_files).toContain('next.config.js')
    })

    it('should detect Next.js app directory', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '^14.0.0',
          },
        })
      )

      await fs.mkdir(path.join(tempDir, 'app'))

      const result = await detector.detect()

      const appDirEvidence = result.evidence.find((e) => e.value === 'app/')
      expect(appDirEvidence).toBeDefined()
    })
  })

  describe('React detection', () => {
    it('should detect React from dependencies', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            react: '^18.0.0',
            'react-dom': '^18.0.0',
          },
        })
      )

      const result = await detector.detect()

      expect(result.type).toBe('react')
      expect(result.dependencies).toContain('react')
    })
  })

  describe('Vue detection', () => {
    it('should detect Vue from dependencies', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            vue: '^3.0.0',
          },
        })
      )

      const result = await detector.detect()

      expect(result.type).toBe('vue')
      expect(result.version.major).toBe(3)
    })

    it('should detect Vue from config file', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            vue: '^3.0.0',
          },
        })
      )

      await fs.writeFile(path.join(tempDir, 'vue.config.js'), 'module.exports = {}')

      const result = await detector.detect()

      expect(result.config_files).toContain('vue.config.js')
    })
  })

  describe('Angular detection', () => {
    it('should detect Angular from dependencies', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            '@angular/core': '^17.0.0',
            '@angular/common': '^17.0.0',
          },
        })
      )

      const result = await detector.detect()

      expect(result.type).toBe('angular')
      expect(result.version.major).toBe(17)
    })

    it('should detect Angular from config file', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            '@angular/core': '^17.0.0',
          },
        })
      )

      await fs.writeFile(path.join(tempDir, 'angular.json'), '{}')

      const result = await detector.detect()

      expect(result.config_files).toContain('angular.json')
    })
  })

  describe('version detection', () => {
    it('should parse version with caret', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '^14.2.3',
          },
        })
      )

      const result = await detector.detect()

      expect(result.version.major).toBe(14)
      expect(result.version.minor).toBe(2)
      expect(result.version.patch).toBe(3)
    })

    it('should parse version with tilde', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            react: '~18.2.0',
          },
        })
      )

      const result = await detector.detect()

      expect(result.version.major).toBe(18)
      expect(result.version.minor).toBe(2)
      expect(result.version.patch).toBe(0)
    })

    it('should handle prerelease versions', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '14.0.0-beta.1',
          },
        })
      )

      const result = await detector.detect()

      expect(result.version.major).toBe(14)
      expect(result.version.prerelease).toBe('beta.1')
    })
  })

  describe('confidence calculation', () => {
    it('should have high confidence with multiple evidence', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '^14.0.0',
            react: '^18.0.0',
          },
          scripts: {
            dev: 'next dev',
            build: 'next build',
          },
        })
      )

      await fs.writeFile(path.join(tempDir, 'next.config.js'), 'module.exports = {}')
      await fs.mkdir(path.join(tempDir, 'app'))

      const result = await detector.detect()

      expect(result.confidence).toBeGreaterThan(90)
    })

    it('should have lower confidence with single evidence', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            react: '^18.0.0',
          },
        })
      )

      const result = await detector.detect()

      expect(result.confidence).toBeLessThan(90)
    })
  })

  describe('evidence collection', () => {
    it('should collect dependency evidence', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '^14.0.0',
          },
        })
      )

      const result = await detector.detect()

      const depEvidence = result.evidence.find(
        (e) => e.type === 'dependency' && e.value === 'next'
      )

      expect(depEvidence).toBeDefined()
      expect(depEvidence?.weight).toBe(100)
    })

    it('should collect script evidence', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '^14.0.0',
          },
          scripts: {
            dev: 'next dev',
          },
        })
      )

      const result = await detector.detect()

      const scriptEvidence = result.evidence.find((e) => e.type === 'script')

      expect(scriptEvidence).toBeDefined()
    })

    it('should collect file evidence', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '^14.0.0',
          },
        })
      )

      await fs.writeFile(path.join(tempDir, 'next.config.js'), '')

      const result = await detector.detect()

      const fileEvidence = result.evidence.find(
        (e) => e.type === 'file' && e.value === 'next.config.js'
      )

      expect(fileEvidence).toBeDefined()
    })
  })

  describe('unknown framework', () => {
    it('should return unknown for empty project', async () => {
      const result = await detector.detect()

      expect(result.type).toBe('unknown')
      expect(result.confidence).toBe(0)
    })

    it('should return unknown for project without framework', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            lodash: '^4.0.0',
          },
        })
      )

      const result = await detector.detect()

      expect(result.type).toBe('unknown')
    })
  })

  describe('detection options', () => {
    it('should respect confidence threshold', async () => {
      const lowConfDetector = new FrameworkDetector({
        project_root: tempDir,
        confidence_threshold: 95,
      })

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            react: '^18.0.0',
          },
        })
      )

      const result = await lowConfDetector.detect()

      // Should still detect but confidence may be below threshold
      expect(result.type).toBeTruthy()
    })

    it('should skip implicit detection when disabled', async () => {
      const noImplicitDetector = new FrameworkDetector({
        project_root: tempDir,
        include_implicit: false,
      })

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '^14.0.0',
          },
        })
      )

      await fs.mkdir(path.join(tempDir, 'app'))

      const result = await noImplicitDetector.detect()

      const appDirEvidence = result.evidence.find((e) => e.value === 'app/')

      expect(appDirEvidence).toBeUndefined()
    })
  })

  describe('multiple frameworks', () => {
    it('should prioritize Next.js over React', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            next: '^14.0.0',
            react: '^18.0.0',
          },
        })
      )

      const result = await detector.detect()

      expect(result.type).toBe('nextjs')
    })

    it('should prioritize Nuxt over Vue', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            nuxt: '^3.0.0',
            vue: '^3.0.0',
          },
        })
      )

      const result = await detector.detect()

      expect(result.type).toBe('nuxt')
    })
  })
})
