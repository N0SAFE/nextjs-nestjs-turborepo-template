/**
 * End-to-end build tests
 * Tests actual builds with all adapters and various configurations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { BuildModule } from '../src/build.module';
import { BuildService } from '../src/services/build.service';
import { BuildStatus } from '../src/types';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('End-to-End Build Tests', () => {
  let app: INestApplicationContext;
  let buildService: BuildService;

  beforeAll(async () => {
    app = await NestFactory.createApplicationContext(BuildModule, {
      logger: false,
    });
    buildService = app.get(BuildService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clean up dist directories before each test
    const fixtures = [
      'bun-single-entry',
      'bun-multi-entry',
      'esbuild-single-entry',
      'esbuild-multi-entry',
      'tsc-single-entry',
      'rollup-single-entry',
      'rollup-multi-entry',
    ];

    for (const fixture of fixtures) {
      const distPath = path.join(FIXTURES_DIR, fixture, 'dist');
      try {
        await fs.rm(distPath, { recursive: true, force: true });
      } catch {
        // Ignore if doesn't exist
      }
    }
  });

  describe('Bun Adapter', () => {
    it('should build single entry point package', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'bun-single-entry');
      
      const result = await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
      });

      expect(result.status).toBe(BuildStatus.SUCCESS);
      expect(result.exitCode).toBe(0);
      expect(result.artifacts.length).toBeGreaterThan(0);

      // Verify output file exists
      const distPath = path.join(packagePath, 'dist');
      const files = await fs.readdir(distPath);
      expect(files.length).toBeGreaterThan(0);
      expect(files.some(f => f.endsWith('.js'))).toBe(true);
    });

    it('should build multi entry point package with code splitting', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'bun-multi-entry');
      
      const result = await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
      });

      expect(result.status).toBe(BuildStatus.SUCCESS);
      expect(result.artifacts.length).toBeGreaterThan(0);

      // Verify multiple output files
      const distPath = path.join(packagePath, 'dist');
      const files = await fs.readdir(distPath);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThanOrEqual(2); // At least index and utils
    });
  });

  describe('esbuild Adapter', () => {
    it('should build single entry point with bundling', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'esbuild-single-entry');
      
      const result = await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
      });

      expect(result.status).toBe(BuildStatus.SUCCESS);
      expect(result.exitCode).toBe(0);
      expect(result.artifacts.length).toBeGreaterThan(0);

      // Verify output structure
      const distPath = path.join(packagePath, 'dist');
      const files = await fs.readdir(distPath);
      expect(files).toContain('index.js');
    });

    it('should build multi entry points without bundling', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'esbuild-multi-entry');
      
      const result = await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
      });

      expect(result.status).toBe(BuildStatus.SUCCESS);
      expect(result.artifacts.length).toBeGreaterThan(0);

      // Verify both entry points are built
      const distPath = path.join(packagePath, 'dist');
      const files = await fs.readdir(distPath);
      expect(files).toContain('main.js');
      expect(files).toContain('lib.js');
    });
  });

  describe('TypeScript Compiler Adapter', () => {
    it('should build with declaration files', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'tsc-single-entry');
      
      const result = await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
      });

      expect(result.status).toBe(BuildStatus.SUCCESS);
      expect(result.exitCode).toBe(0);
      expect(result.artifacts.length).toBeGreaterThan(0);

      // Verify output includes .js and .d.ts files
      const distPath = path.join(packagePath, 'dist');
      const files = await fs.readdir(distPath);
      expect(files.some(f => f.endsWith('.js'))).toBe(true);
      expect(files.some(f => f.endsWith('.d.ts'))).toBe(true);
      
      // Verify sourcemaps
      const hasSourceMaps = files.some(f => f.endsWith('.js.map'));
      expect(hasSourceMaps).toBe(true);
    });
  });

  describe('Rollup Adapter', () => {
    it('should build single entry point', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'rollup-single-entry');
      
      const result = await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
      });

      expect(result.status).toBe(BuildStatus.SUCCESS);
      expect(result.exitCode).toBe(0);
      expect(result.artifacts.length).toBeGreaterThan(0);

      // Verify output
      const distPath = path.join(packagePath, 'dist');
      const files = await fs.readdir(distPath);
      expect(files.some(f => f.endsWith('.js'))).toBe(true);
      
      // Verify sourcemaps
      const hasSourceMaps = files.some(f => f.endsWith('.js.map'));
      expect(hasSourceMaps).toBe(true);
    });

    it('should build multi entry points with named outputs', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'rollup-multi-entry');
      
      const result = await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
      });

      expect(result.status).toBe(BuildStatus.SUCCESS);
      expect(result.artifacts.length).toBeGreaterThan(0);

      // Verify named outputs
      const distPath = path.join(packagePath, 'dist');
      const files = await fs.readdir(distPath);
      expect(files).toContain('alpha.js');
      expect(files).toContain('beta.js');
    });
  });

  describe('Build Artifacts', () => {
    it('should include checksums for all artifacts', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'esbuild-single-entry');
      
      const result = await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
      });

      expect(result.artifacts.length).toBeGreaterThan(0);
      
      for (const artifact of result.artifacts) {
        expect(artifact.path).toBeDefined();
        expect(artifact.size).toBeGreaterThan(0);
        expect(artifact.checksum).toBeDefined();
        expect(artifact.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
      }
    });

    it('should report correct file sizes', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'bun-single-entry');
      
      const result = await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
      });

      for (const artifact of result.artifacts) {
        const fullPath = path.join(packagePath, artifact.path);
        const stats = await fs.stat(fullPath);
        expect(artifact.size).toBe(stats.size);
      }
    });
  });

  describe('Build Logs', () => {
    it('should capture build logs', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'esbuild-single-entry');
      
      const result = await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
        verbose: true,
      });

      expect(result.logs).toBeDefined();
      expect(result.logs!.length).toBeGreaterThan(0);
      
      // Logs should contain adapter name
      const logsText = result.logs!.join(' ');
      expect(logsText).toContain('esbuild');
    });
  });

  describe('Error Handling', () => {
    it('should fail gracefully with invalid configuration', async () => {
      // Try to build a non-existent package
      const packagePath = path.join(FIXTURES_DIR, 'non-existent');
      
      await expect(
        buildService.buildPackage(packagePath, {
          package: packagePath,
        })
      ).rejects.toThrow();
    });
  });

  describe('Clean Build', () => {
    it('should remove existing dist before building', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'bun-single-entry');
      const distPath = path.join(packagePath, 'dist');

      // First build
      await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: false,
      });

      // Create a marker file
      await fs.mkdir(distPath, { recursive: true });
      await fs.writeFile(path.join(distPath, 'marker.txt'), 'old build');

      // Build with clean flag
      await buildService.buildPackage(packagePath, {
        package: packagePath,
        clean: true,
      });

      // Marker file should be gone
      const files = await fs.readdir(distPath);
      expect(files).not.toContain('marker.txt');
    });
  });
});
