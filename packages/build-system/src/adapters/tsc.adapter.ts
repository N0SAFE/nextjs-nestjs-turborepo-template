/**
 * TypeScript compiler (tsc) adapter implementation
 * Uses TypeScript's programmatic API
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
export class TscAdapter implements BuilderAdapter {
  readonly name = 'tsc';

  async isAvailable(): Promise<boolean> {
    try {
      // Check if typescript is available
      await import('typescript');
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
      const ts = await import('typescript');
      
      // Look for tsconfig.json
      const tsconfigPath = path.join(packagePath, 'tsconfig.json');
      const tsconfigBuildPath = path.join(packagePath, 'tsconfig.build.json');
      
      let configPath = tsconfigPath;
      try {
        await fs.access(tsconfigBuildPath);
        configPath = tsconfigBuildPath;
      } catch {
        // Use default tsconfig.json
      }

      logs.push(`[${this.name}] Using TypeScript config: ${configPath}`);

      // Read and parse tsconfig
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      if (configFile.error) {
        throw new Error(`Failed to read tsconfig: ${configFile.error.messageText}`);
      }

      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        packagePath,
      );

      if (parsedConfig.errors.length > 0) {
        const errors = parsedConfig.errors.map((err) => ({
          message: typeof err.messageText === 'string' 
            ? err.messageText 
            : err.messageText.messageText,
        }));
        
        logs.push(`[${this.name}] Config parsing errors: ${errors.length}`);
        
        return {
          status: BuildStatus.FAILURE,
          exitCode: 1,
          durationMs: new Date().getTime() - startTime.getTime(),
          artifacts: [],
          logs,
          errors,
          startTime,
          endTime: new Date(),
        };
      }

      logs.push(`[${this.name}] Compiling ${parsedConfig.fileNames.length} files`);

      // Create program
      const program = ts.createProgram({
        rootNames: parsedConfig.fileNames,
        options: parsedConfig.options,
      });

      // Emit compiled files
      const emitResult = program.emit();

      // Get diagnostics
      const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

      const errors = allDiagnostics
        .filter((d) => d.category === ts.DiagnosticCategory.Error)
        .map((diagnostic) => {
          const message = typeof diagnostic.messageText === 'string'
            ? diagnostic.messageText
            : diagnostic.messageText.messageText;

          const error: any = { message };

          if (diagnostic.file && diagnostic.start) {
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
              diagnostic.start,
            );
            error.location = {
              file: diagnostic.file.fileName,
              line: line + 1,
              column: character + 1,
            };
          }

          return error;
        });

      const warnings = allDiagnostics
        .filter((d) => d.category === ts.DiagnosticCategory.Warning)
        .map((diagnostic) => {
          const message = typeof diagnostic.messageText === 'string'
            ? diagnostic.messageText
            : diagnostic.messageText.messageText;
          return message;
        });

      if (warnings.length > 0) {
        logs.push(`[${this.name}] ${warnings.length} warning(s)`);
        warnings.forEach((warn) => logs.push(`  Warning: ${warn}`));
      }

      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();

      // Discover artifacts
      const artifacts = await this.discoverArtifacts(packagePath, config);

      if (errors.length > 0) {
        logs.push(`[${this.name}] Compilation failed with ${errors.length} error(s)`);
        return {
          status: BuildStatus.FAILURE,
          exitCode: 1,
          durationMs,
          artifacts: [],
          logs,
          errors,
          startTime,
          endTime,
        };
      }

      logs.push(`[${this.name}] Compilation succeeded, generated ${artifacts.length} artifacts`);

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
