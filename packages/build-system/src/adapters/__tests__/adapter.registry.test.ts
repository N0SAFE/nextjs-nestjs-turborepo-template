/**
 * Tests for AdapterRegistry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdapterRegistry } from '../adapter.registry';
import { BuilderAdapter } from '../adapter.interface';
import { BuildResult, PackageBuildConfig, BuildOptions, BuildStatus } from '../../types';

// Mock adapter for testing
class MockAdapter implements BuilderAdapter {
  constructor(public readonly name: string, private available: boolean = true) {}

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async build(
    packagePath: string,
    config: PackageBuildConfig,
    options: BuildOptions,
  ): Promise<BuildResult> {
    return {
      status: BuildStatus.SUCCESS,
      exitCode: 0,
      durationMs: 100,
      artifacts: [],
      logs: [],
      errors: [],
      startTime: new Date(),
      endTime: new Date(),
    };
  }

  async discoverArtifacts(): Promise<Array<{ path: string; size: number; checksum: string }>> {
    return [];
  }
}

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;

  beforeEach(() => {
    registry = new AdapterRegistry();
  });

  it('should register an adapter', () => {
    const adapter = new MockAdapter('test');
    registry.register(adapter);
    
    expect(registry.get('test')).toBe(adapter);
  });

  it('should return undefined for unregistered adapter', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('should list all registered adapters', () => {
    const adapter1 = new MockAdapter('test1');
    const adapter2 = new MockAdapter('test2');
    
    registry.register(adapter1);
    registry.register(adapter2);
    
    const adapters = registry.list();
    expect(adapters).toHaveLength(2);
    expect(adapters).toContain(adapter1);
    expect(adapters).toContain(adapter2);
  });

  it('should return best available adapter based on priority', async () => {
    const bunAdapter = new MockAdapter('bun', false);
    const esbuildAdapter = new MockAdapter('esbuild', true);
    const tscAdapter = new MockAdapter('tsc', true);
    
    registry.register(bunAdapter);
    registry.register(esbuildAdapter);
    registry.register(tscAdapter);
    
    const best = await registry.getBest();
    expect(best).toBe(esbuildAdapter);
  });

  it('should return undefined when no adapter is available', async () => {
    const adapter = new MockAdapter('test', false);
    registry.register(adapter);
    
    const best = await registry.getBest();
    expect(best).toBeUndefined();
  });

  it('should follow priority order: bun > esbuild > tsc > rollup', async () => {
    const rollupAdapter = new MockAdapter('rollup', true);
    const tscAdapter = new MockAdapter('tsc', true);
    const esbuildAdapter = new MockAdapter('esbuild', false);
    const bunAdapter = new MockAdapter('bun', false);
    
    registry.register(rollupAdapter);
    registry.register(tscAdapter);
    registry.register(esbuildAdapter);
    registry.register(bunAdapter);
    
    const best = await registry.getBest();
    expect(best).toBe(tscAdapter);
  });
});
