/**
 * Bun builder adapter implementation
 */

import { Injectable } from '@nestjs/common';
import { BuilderAdapter } from './adapter.interface';
import {
  BuildResult,
  PackageBuildConfig,
  BuildOptions,
  BuildStatus,
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
      // Run the build command
      const buildCommand = config.builderOptions?.buildCommand || 'bun run build';
      const commandString = String(buildCommand);
      const [command, ...args] = commandString.split(' ');

      logs.push(`[${this.name}] Running: ${commandString}`);

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
