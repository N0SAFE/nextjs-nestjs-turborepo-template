/**
 * Simple file-based locking mechanism for per-package builds
 * Prevents concurrent builds of the same package from corrupting outputs
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class PackageLock {
  private lockDir: string;
  private readonly LOCK_TIMEOUT_MS = 300000; // 5 minutes default
  private readonly HEARTBEAT_INTERVAL_MS = 10000; // 10 seconds

  constructor(lockDir?: string) {
    this.lockDir = lockDir || path.join(os.tmpdir(), 'build-system-locks');
  }

  /**
   * Acquire a lock for a package
   * @param packageName Package name to lock
   * @param timeoutMs Maximum time to wait for lock
   * @returns Lock release function
   */
  async acquire(
    packageName: string,
    timeoutMs: number = this.LOCK_TIMEOUT_MS,
  ): Promise<() => Promise<void>> {
    const lockPath = this.getLockPath(packageName);
    const startTime = Date.now();

    // Ensure lock directory exists
    await fs.mkdir(this.lockDir, { recursive: true });

    // Try to acquire lock
    while (true) {
      try {
        // Try to create lock directory (atomic operation)
        await fs.mkdir(lockPath, { mode: 0o700 });

        // Write lock metadata
        const lockData = {
          pid: process.pid,
          acquiredAt: new Date().toISOString(),
          packageName,
        };
        await fs.writeFile(
          path.join(lockPath, 'lock.json'),
          JSON.stringify(lockData, null, 2),
        );

        // Return release function
        return async () => {
          try {
            await fs.rm(lockPath, { recursive: true, force: true });
          } catch (error) {
            // Best effort cleanup
            console.warn(`Failed to release lock for ${packageName}:`, error);
          }
        };
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock exists, check if stale
          const isStale = await this.isLockStale(lockPath);
          if (isStale) {
            // Remove stale lock
            await fs.rm(lockPath, { recursive: true, force: true });
            continue;
          }

          // Lock is valid, wait and retry
          if (Date.now() - startTime > timeoutMs) {
            throw new Error(
              `Timeout waiting for lock on package: ${packageName}`,
            );
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Check if a lock is stale (older than timeout)
   */
  private async isLockStale(lockPath: string): Promise<boolean> {
    try {
      const lockFile = path.join(lockPath, 'lock.json');
      const lockData = JSON.parse(await fs.readFile(lockFile, 'utf-8'));
      const acquiredAt = new Date(lockData.acquiredAt);
      const age = Date.now() - acquiredAt.getTime();
      return age > this.LOCK_TIMEOUT_MS;
    } catch {
      // If we can't read lock metadata, consider it stale
      return true;
    }
  }

  /**
   * Get the lock directory path for a package
   */
  private getLockPath(packageName: string): string {
    // Sanitize package name for filesystem
    const sanitized = packageName.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.lockDir, sanitized);
  }
}
