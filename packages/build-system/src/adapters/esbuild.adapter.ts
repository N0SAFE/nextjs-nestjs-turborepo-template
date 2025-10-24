/**
 * esbuild adapter implementation
 * Uses esbuild's Node.js API for better integration
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
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { glob } from 'glob';

@Injectable()
export class EsbuildAdapter implements BuilderAdapter {
  readonly name = 'esbuild';

  async isAvailable(): Promise<boolean> {
    try {
      // Check if esbuild is available
      await import('esbuild');
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
      const esbuild = await import('esbuild');
      
      const builderOpts = config.builderOptions as Record<string, unknown> | undefined;
      const entryPoints = (config.entryPoints || (builderOpts?.entryPoints as string[] | undefined) || []) as string[];
      if (entryPoints.length === 0) {
        throw new Error('No entry points defined for esbuild');
      }

      const outDir = path.join(packagePath, config.outDir);
      
      // Resolve entry points to absolute paths
      const absoluteEntryPoints = entryPoints.map((ep) => 
        path.isAbsolute(ep) ? ep : path.join(packagePath, ep)
      );

      logs.push(`[${this.name}] Building with entry points: ${absoluteEntryPoints.join(', ')}`);
      logs.push(`[${this.name}] Output directory: ${outDir}`);

      const buildOptions = {
        entryPoints: absoluteEntryPoints,
        bundle: (builderOpts?.bundle as boolean | undefined) ?? true,
        outdir: outDir,
        platform: (builderOpts?.platform as 'browser' | 'node' | 'neutral' | undefined) || 'node',
        format: (builderOpts?.format as 'iife' | 'cjs' | 'esm' | undefined) || 'esm',
        sourcemap: (builderOpts?.sourcemap as boolean | 'linked' | 'inline' | 'external' | 'both' | undefined) ?? true,
        minify: (builderOpts?.minify as boolean | undefined) ?? false,
        target: (builderOpts?.target as string | string[] | undefined) || 'node18',
        logLevel: 'info' as const,
        ...builderOpts,
      };

      logs.push(`[${this.name}] Build options: ${JSON.stringify(buildOptions, null, 2)}`);

      const result = await esbuild.build(buildOptions);

      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();

      // Discover artifacts
      const artifacts = await this.discoverArtifacts(packagePath, config);

      // Check for errors and warnings
      if (result.errors.length > 0) {
        logs.push(`[${this.name}] Build completed with ${result.errors.length} error(s)`);
        return {
          status: BuildStatus.FAILURE,
          exitCode: 1,
          durationMs,
          artifacts: [],
          logs,
          errors: result.errors.map((err) => ({
            message: err.text,
            location: err.location ? {
              file: err.location.file,
              line: err.location.line,
              column: err.location.column,
            } : undefined,
          })),
          startTime,
          endTime,
        };
      }

      if (result.warnings.length > 0) {
        logs.push(`[${this.name}] Build completed with ${result.warnings.length} warning(s)`);
        result.warnings.forEach((warn) => {
          logs.push(`  Warning: ${warn.text}`);
        });
      }

      logs.push(`[${this.name}] Build succeeded, generated ${artifacts.length} artifacts`);

      return {
        status: BuildStatus.SUCCESS,
        exitCode: 0,
        durationMs,
        artifacts,
        logs,
        errors: [],
        startTime,
        endTime,
      };
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
