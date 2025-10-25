/**
 * Basic integration tests for the build system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BuildService } from '../src/services/build.service';
import { AdapterRegistry } from '../src/adapters/adapter.registry';
import { PackageLock } from '../src/lock/package-lock';
import { BunAdapter } from '../src/adapters/bun.adapter';
import { EsbuildAdapter } from '../src/adapters/esbuild.adapter';
import { TscAdapter } from '../src/adapters/tsc.adapter';
import { RollupAdapter } from '../src/adapters/rollup.adapter';

describe('Build System Integration', () => {
  let buildService: BuildService;
  let adapterRegistry: AdapterRegistry;
  let packageLock: PackageLock;

  beforeEach(() => {
    // Create services manually without NestJS
    adapterRegistry = new AdapterRegistry();
    adapterRegistry.register(new BunAdapter());
    adapterRegistry.register(new EsbuildAdapter());
    adapterRegistry.register(new TscAdapter());
    adapterRegistry.register(new RollupAdapter());
    packageLock = new PackageLock();
    buildService = new BuildService(adapterRegistry, packageLock);
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
