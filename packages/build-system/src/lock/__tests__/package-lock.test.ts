/**
 * Tests for PackageLock
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PackageLock } from '../package-lock';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('PackageLock', () => {
  let lock: PackageLock;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'build-lock-test-'));
    lock = new PackageLock(tempDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should acquire and release a lock', async () => {
    const release = await lock.acquire('test-package');
    expect(release).toBeDefined();
    expect(typeof release).toBe('function');

    await release();
  });

  it('should prevent concurrent access to same package', async () => {
    const release1 = await lock.acquire('test-package', 1000);

    // Try to acquire same lock immediately - should timeout
    const startTime = Date.now();
    await expect(lock.acquire('test-package', 500)).rejects.toThrow('Timeout waiting for lock');
    const duration = Date.now() - startTime;
    
    // Should have waited for timeout
    expect(duration).toBeGreaterThanOrEqual(500);

    await release1();
  });

  it('should allow concurrent access to different packages', async () => {
    const release1 = await lock.acquire('package-1');
    const release2 = await lock.acquire('package-2');

    expect(release1).toBeDefined();
    expect(release2).toBeDefined();

    await release1();
    await release2();
  });

  it('should allow reacquiring lock after release', async () => {
    const release1 = await lock.acquire('test-package');
    await release1();

    // Should be able to acquire again
    const release2 = await lock.acquire('test-package');
    expect(release2).toBeDefined();
    await release2();
  });

  it('should handle stale locks', async () => {
    // Create a stale lock by manually creating lock directory
    const lockPath = path.join(tempDir, 'test-package'.replace(/[^a-zA-Z0-9-_]/g, '_'));
    await fs.mkdir(lockPath, { recursive: true });
    
    // Create lock metadata with old timestamp
    const oldDate = new Date();
    oldDate.setMinutes(oldDate.getMinutes() - 10); // 10 minutes ago
    await fs.writeFile(
      path.join(lockPath, 'lock.json'),
      JSON.stringify({
        pid: 99999,
        acquiredAt: oldDate.toISOString(),
        packageName: 'test-package',
      })
    );

    // Should be able to acquire lock (stale lock removed)
    const release = await lock.acquire('test-package', 2000);
    expect(release).toBeDefined();
    await release();
  });
});
