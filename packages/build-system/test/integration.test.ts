/**
 * Basic integration tests for the build system
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { BuildModule } from '../src/build.module';
import { BuildService } from '../src/services/build.service';
import { AdapterRegistry } from '../src/adapters/adapter.registry';
import { INestApplicationContext } from '@nestjs/common';

describe('Build System Integration', () => {
  let buildService: BuildService;
  let adapterRegistry: AdapterRegistry;
  let app: INestApplicationContext;

  beforeAll(async () => {
    app = await NestFactory.createApplicationContext(BuildModule, {
      logger: false,
    });
    buildService = app.get(BuildService);
    adapterRegistry = app.get(AdapterRegistry);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Adapter Registry', () => {
    it('should have registered adapters', () => {
      const adapters = adapterRegistry.list();
      expect(adapters).toBeDefined();
      expect(adapters.length).toBeGreaterThan(0);
    });

    it('should have bun adapter registered', () => {
      const bunAdapter = adapterRegistry.get('bun');
      expect(bunAdapter).toBeDefined();
      expect(bunAdapter?.name).toBe('bun');
    });

    it('should return best available adapter', async () => {
      const bestAdapter = await adapterRegistry.getBest();
      expect(bestAdapter).toBeDefined();
    });
  });

  describe('Build Service', () => {
    it('should list packages', async () => {
      const packages = await buildService.listPackages();
      expect(packages).toBeDefined();
      expect(Array.isArray(packages)).toBe(true);
      expect(packages.length).toBeGreaterThan(0);
    });

    it('should find build-system package', async () => {
      const packages = await buildService.listPackages();
      const buildSystemPkg = packages.find((p) => p.name === '@repo/build-system');
      expect(buildSystemPkg).toBeDefined();
      expect(buildSystemPkg?.supported).toBe(true);
    });
  });
});
