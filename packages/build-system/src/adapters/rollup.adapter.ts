/**
 * Rollup adapter implementation
 * Uses Rollup's JavaScript API for bundling
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
import type { InputOptions, OutputOptions, ModuleFormat, Plugin } from 'rollup';

@Injectable()
export class RollupAdapter implements BuilderAdapter {
  readonly name = 'rollup';

  async isAvailable(): Promise<boolean> {
    try {
      await import('rollup');
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
      const rollup = await import('rollup');
      
      const builderOpts = config.builderOptions as Record<string, unknown> | undefined;
      const input = builderOpts?.input as string | string[] | Record<string, string> | undefined;
      
      if (!input) {
        throw new Error('No input defined for rollup. Please specify input in builderOptions.');
      }

      const outDir = path.join(packagePath, builderOpts?.dir as string || config.outDir);
      
      logs.push(`[${this.name}] Building with input: ${JSON.stringify(input)}`);
      logs.push(`[${this.name}] Output directory: ${outDir}`);

      // Prepare rollup input options
      const inputOptions: InputOptions = {
        input,
        external: (builderOpts?.external as string[] | ((id: string) => boolean) | undefined) || [],
        plugins: (builderOpts?.plugins as Plugin[] | undefined) || [],
      };

      // Prepare rollup output options
      const outputOptions: OutputOptions = {
        dir: outDir,
        format: (builderOpts?.format as ModuleFormat | undefined) || 'esm',
        sourcemap: (builderOpts?.sourcemap as boolean | 'inline' | 'hidden' | undefined) ?? true,
        entryFileNames: (builderOpts?.entryFileNames as string | undefined) || '[name].js',
        chunkFileNames: (builderOpts?.chunkFileNames as string | undefined) || '[name]-[hash].js',
        assetFileNames: (builderOpts?.assetFileNames as string | undefined) || 'assets/[name]-[hash][extname]',
      };

      const pluginsInfo = Array.isArray(inputOptions.plugins) ? `${inputOptions.plugins.length} plugin(s)` : '[]';
      logs.push(`[${this.name}] Input options: ${JSON.stringify({ ...inputOptions, plugins: pluginsInfo }, null, 2)}`);
      logs.push(`[${this.name}] Output options: ${JSON.stringify(outputOptions, null, 2)}`);

      // Create bundle
      const bundle = await rollup.rollup(inputOptions);

      // Generate output
      const { output: outputs } = await bundle.generate(outputOptions);
      
      logs.push(`[${this.name}] Generated ${outputs.length} output(s)`);

      // Write to disk
      await bundle.write(outputOptions);

      // Close bundle
      await bundle.close();

      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();

      // Discover artifacts
      const artifacts = await this.discoverArtifacts(packagePath, config);

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

      const err = error as Error;
      const buildError: BuildError = {
        message: err.message || 'Unknown error',
        stack: err.stack,
      };

      // Check if it's a rollup error with additional info
      const rollupError = error as { id?: string; loc?: { file?: string; line?: number; column?: number } };
      if (rollupError.loc) {
        buildError.location = {
          file: rollupError.loc.file || rollupError.id || 'unknown',
          line: rollupError.loc.line,
          column: rollupError.loc.column,
        };
      }

      return {
        status: BuildStatus.FAILURE,
        exitCode: 1,
        durationMs,
        artifacts: [],
        logs,
        errors: [buildError],
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
