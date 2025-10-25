/**
 * Build service - Core orchestration logic for package builds
 */

import { Injectable } from '@nestjs/common';
import { AdapterRegistry } from '../adapters/adapter.registry';
import { PackageLock } from '../lock/package-lock';
import {
  BuildResult,
  BuildOptions,
  PackageBuildConfig,
  PackageBuildConfigSchema,
  BuildablePackage,
  BuildStatus,
} from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class BuildService {
  constructor(
    private readonly adapterRegistry: AdapterRegistry,
    private readonly packageLock: PackageLock,
  ) {}

  /**
   * Build a package
   * @param packagePath Absolute path to the package or package name
   * @param options Build options
   * @returns Build result
   */
  async buildPackage(
    packagePath: string,
    options: BuildOptions,
  ): Promise<BuildResult> {
    const startTime = new Date();

    try {
      // Resolve package path if it's a name
      const resolvedPath = await this.resolvePackagePath(packagePath);

      // Load build configuration
      const config = await this.loadBuildConfig(resolvedPath);

      // Acquire lock for this package
      const releaseLock = await this.packageLock.acquire(config.name);

      try {
        // Clean if requested
        if (options.clean) {
          await this.cleanPackage(resolvedPath, config);
        }

        // Get appropriate adapter
        const adapter = config.builder
          ? this.adapterRegistry.get(config.builder)
          : await this.adapterRegistry.getBest();

        if (!adapter) {
          throw new Error('No suitable build adapter found');
        }

        // Execute build
        const result = await adapter.build(resolvedPath, config, options);

        return result;
      } finally {
        // Release lock
        await releaseLock();
      }
    } catch (error) {
      const endTime = new Date();
      return {
        status: BuildStatus.FAILURE,
        exitCode: 1,
        durationMs: endTime.getTime() - startTime.getTime(),
        artifacts: [],
        logs: [],
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
   * List all buildable packages in the workspace
   */
  async listPackages(): Promise<BuildablePackage[]> {
    const workspaceRoot = await this.findWorkspaceRoot();
    const packages: BuildablePackage[] = [];

    // Read workspace packages from package.json
    const rootPkgPath = path.join(workspaceRoot, 'package.json');
    const rootPkg = JSON.parse(await fs.readFile(rootPkgPath, 'utf-8'));

    const workspacePatterns = rootPkg.workspaces?.packages || [
      'apps/*',
      'packages/*',
    ];

    // Find all packages
    const glob = (await import('glob')).glob;
    for (const pattern of workspacePatterns) {
      const packageDirs = await glob(pattern, {
        cwd: workspaceRoot,
        absolute: true,
      });

      for (const dir of packageDirs) {
        try {
          const pkgJsonPath = path.join(dir, 'package.json');
          const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));

          // Check if package has build config
          let config: PackageBuildConfig | undefined;
          let supported = false;

          try {
            config = await this.loadBuildConfig(dir);
            supported = true;
          } catch {
            // Package doesn't have build config, try to detect build script
            supported = !!pkgJson.scripts?.build;
          }

          packages.push({
            name: pkgJson.name,
            path: dir,
            config,
            supported,
          });
        } catch {
          // Skip directories without package.json
          continue;
        }
      }
    }

    return packages;
  }

  /**
   * Clean package build outputs
   */
  async cleanPackage(
    packagePath: string,
    config?: PackageBuildConfig,
  ): Promise<void> {
    if (!config) {
      config = await this.loadBuildConfig(packagePath);
    }

    const outDir = path.join(packagePath, config.outDir);

    try {
      await fs.rm(outDir, { recursive: true, force: true });
    } catch (error) {
      // Best effort cleanup
      console.warn(`Failed to clean ${outDir}:`, error);
    }
  }

  /**
   * Load build configuration for a package
   */
  private async loadBuildConfig(
    packagePath: string,
  ): Promise<PackageBuildConfig> {
    const configPaths = [
      'build.config.ts',
      'build.config.js',
      'package.build.config.ts',
      'package.build.config.js',
    ];

    for (const configFile of configPaths) {
      const configPath = path.join(packagePath, configFile);
      try {
        await fs.access(configPath);
        // Config file exists, try to load it
        const config = await import(configPath);
        const buildConfig = config.default || config.buildConfig;

        // Validate config
        return PackageBuildConfigSchema.parse(buildConfig);
      } catch {
        // Try next config file
        continue;
      }
    }

    // No config file found, use defaults with package.json info
    const pkgJsonPath = path.join(packagePath, 'package.json');
    const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));

    return PackageBuildConfigSchema.parse({
      name: pkgJson.name,
      builder: 'bun',
      outDir: 'dist',
    });
  }

  /**
   * Resolve package path from name or path
   */
  private async resolvePackagePath(packageInput: string): Promise<string> {
    // If it's already an absolute path and exists, return it
    if (path.isAbsolute(packageInput)) {
      try {
        await fs.access(packageInput);
        return packageInput;
      } catch {
        throw new Error(`Package path not found: ${packageInput}`);
      }
    }

    // Try to find package in workspace
    const workspaceRoot = await this.findWorkspaceRoot();
    const possiblePaths = [
      path.join(workspaceRoot, packageInput),
      path.join(workspaceRoot, 'packages', packageInput),
      path.join(workspaceRoot, 'apps', packageInput),
    ];

    for (const p of possiblePaths) {
      try {
        await fs.access(p);
        return p;
      } catch {
        continue;
      }
    }

    throw new Error(`Could not resolve package: ${packageInput}`);
  }

  /**
   * Find workspace root directory
   */
  private async findWorkspaceRoot(): Promise<string> {
    let currentDir = process.cwd();

    while (true) {
      const pkgJsonPath = path.join(currentDir, 'package.json');
      try {
        const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
        if (pkgJson.workspaces) {
          return currentDir;
        }
      } catch {
        // Continue searching
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        // Reached root
        throw new Error('Could not find workspace root');
      }
      currentDir = parentDir;
    }
  }
}
