/**
 * Bun builder adapter implementation
 * Uses Bun's native build API for better integration and error handling
 */

import { Injectable } from '@nestjs/common';
import { BuilderAdapter } from './adapter.interface';
import {
  BuildResult,
  PackageBuildConfig,
  BuildOptions,
  BuildStatus,
  BuildError,
} from '../types';
import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { glob } from 'glob';

@Injectable()
export class BunAdapter implements BuilderAdapter {
  readonly name = 'bun';

  async isAvailable(): Promise<boolean> {
    try {
      await execa('bun', ['--version']);
      return true;
    } catch {
      return false;
    }
  }

  async build(
    packagePath: string,
    config: PackageBuildConfig,
    options: BuildOptions,
  ): Promise<BuildResult> {
    const startTime = new Date();
    const logs: string[] = [];

    try {
      // Check if Bun SDK build is configured and available
      const builderOpts = config.builderOptions as Record<string, unknown> | undefined;
      const entryPoints = config.entryPoints || (builderOpts?.entryPoints as string[] | undefined);
      const hasBunRuntime = (global as { Bun?: unknown }).Bun !== undefined;
      const useSdk = entryPoints && Array.isArray(entryPoints) && entryPoints.length > 0 && hasBunRuntime;

      if (useSdk) {
        // Use Bun SDK build API
        logs.push(`[${this.name}] Using Bun.build() SDK with entry points: ${entryPoints.join(', ')}`);
        
        const result = await this.buildWithSdk(packagePath, config, logs);
        
        // If SDK build failed because API not available, fall back to CLI
        if (!result.success && result.errors?.some(e => e.message.includes('not available'))) {
          logs.push(`[${this.name}] SDK build not available, falling back to CLI`);
          return await this.buildWithCli(packagePath, config, options, logs, startTime);
        }
        
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();

        // Discover artifacts
        const artifacts = await this.discoverArtifacts(packagePath, config);

        return {
          status: result.success ? BuildStatus.SUCCESS : BuildStatus.FAILURE,
          exitCode: result.success ? 0 : 1,
          durationMs,
          artifacts,
          logs,
          errors: result.errors || [],
          startTime,
          endTime,
        };
      } else {
        // Fallback to CLI for packages using npm scripts or when Bun runtime not available
        if (!hasBunRuntime && entryPoints) {
          logs.push(`[${this.name}] Bun runtime not detected, using CLI build`);
        }
        return await this.buildWithCli(packagePath, config, options, logs, startTime);
      }
    } catch (error) {
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();

      return {
        status: BuildStatus.FAILURE,
        exitCode: 1,
        durationMs,
        artifacts: [],
        logs,
        errors: [
          {
            message: error.message || 'Unknown error',
            stack: error.stack,
          },
        ],
        startTime,
        endTime,
      };
    }
  }

  /**
   * Build using Bun's native SDK (Bun.build() API)
   */
  private async buildWithSdk(
    packagePath: string,
    config: PackageBuildConfig,
    logs: string[],
  ): Promise<{ success: boolean; errors?: BuildError[] }> {
    const builderOpts = config.builderOptions as Record<string, unknown> | undefined;
    const entryPoints = (config.entryPoints || (builderOpts?.entryPoints as string[] | undefined) || []) as string[];
    const outDir = path.join(packagePath, config.outDir);
    
    // Resolve entry points to absolute paths
    const absoluteEntryPoints = entryPoints.map((ep) => 
      path.isAbsolute(ep) ? ep : path.join(packagePath, ep)
    );

    try {
      // Use dynamic import to access Bun's build API
      // This works when running in Bun runtime
      const buildOptions = {
        entrypoints: absoluteEntryPoints,
        outdir: outDir,
        target: 'node',
        format: 'esm' as const,
        sourcemap: 'external' as const,
        minify: config.builderOptions?.minify || false,
        splitting: config.builderOptions?.splitting || false,
        ...config.builderOptions,
      };

      logs.push(`[${this.name}] Build options: ${JSON.stringify(buildOptions, null, 2)}`);

      // Execute Bun.build() using global Bun object
      interface BunBuildResult {
        success: boolean;
        outputs?: unknown[];
        logs?: Array<{ message?: string; code?: string }>;
      }
      
      const globalBun = (global as { Bun?: { build: (opts: unknown) => Promise<BunBuildResult> } }).Bun;
      
      if (!globalBun?.build) {
        logs.push(`[${this.name}] Bun.build() not available, falling back to CLI`);
        return { success: false, errors: [{ message: 'Bun.build() API not available' }] };
      }

      const buildResult = await globalBun.build(buildOptions);

      if (!buildResult.success) {
        const errors: BuildError[] = buildResult.logs?.map((log) => ({
          message: log.message || String(log),
          code: log.code,
        })) || [];
        logs.push(`[${this.name}] Build failed with ${errors.length} error(s)`);
        return { success: false, errors };
      }

      logs.push(`[${this.name}] Build succeeded, generated ${buildResult.outputs?.length || 0} outputs`);
      return { success: true };
    } catch (error) {
      logs.push(`[${this.name}] SDK build error: ${error.message}`);
      return { 
        success: false, 
        errors: [{ message: error.message, stack: error.stack }] 
      };
    }
  }

  /**
   * Build using CLI (fallback for packages with npm scripts)
   */
  private async buildWithCli(
    packagePath: string,
    config: PackageBuildConfig,
    options: BuildOptions,
    logs: string[],
    startTime: Date,
  ): Promise<BuildResult> {
    const buildCommand = config.builderOptions?.buildCommand || 'bun run build';
    const commandString = String(buildCommand);
    const [command, ...args] = commandString.split(' ');

    logs.push(`[${this.name}] Running CLI: ${commandString}`);

    const result = await execa(command, args, {
      cwd: packagePath,
      all: true,
      reject: false,
    });

    if (result.all) {
      logs.push(result.all);
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    // Discover artifacts
    const artifacts = await this.discoverArtifacts(packagePath, config);

    return {
      status:
        result.exitCode === 0 ? BuildStatus.SUCCESS : BuildStatus.FAILURE,
      exitCode: result.exitCode,
      durationMs,
      artifacts,
      logs,
      errors:
        result.exitCode !== 0
          ? [
              {
                message: result.stderr || 'Build failed',
                code: result.exitCode.toString(),
              },
            ]
          : [],
      startTime,
      endTime,
    };
  }

  async discoverArtifacts(
    packagePath: string,
    config: PackageBuildConfig,
  ): Promise<Array<{ path: string; size: number; checksum: string }>> {
    const artifacts: Array<{ path: string; size: number; checksum: string }> =
      [];

    for (const pattern of config.artifactGlobs || ['dist/**/*']) {
      const files = await glob(pattern, {
        cwd: packagePath,
        nodir: true,
        absolute: false,
      });

      for (const file of files) {
        const fullPath = path.join(packagePath, file);
        try {
          const stats = await fs.stat(fullPath);
          const content = await fs.readFile(fullPath);
          const checksum = crypto
            .createHash('sha256')
            .update(content)
            .digest('hex');

          artifacts.push({
            path: file,
            size: stats.size,
            checksum,
          });
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
    }

    return artifacts;
  }
}
