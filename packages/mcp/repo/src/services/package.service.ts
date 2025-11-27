import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { PackageJson } from '../types/common.types.js';

const execAsync = promisify(exec);

export interface PackageInfo {
  name: string;
  type: 'app' | 'package';
  path: string;
  dependencies?: string[];
}

@Injectable()
export class PackageService {
  private readonly repoRoot = process.cwd();

  async listApps(): Promise<PackageInfo[]> {
    const appsDir = join(this.repoRoot, 'apps');
    const { stdout } = await execAsync(`find ${appsDir} -maxdepth 2 -name "package.json"`);
    
    const packageFiles = stdout.trim().split('\n').filter(Boolean);
    const apps: PackageInfo[] = [];

    for (const file of packageFiles) {
      const content = await readFile(file, 'utf-8');
      const pkg = JSON.parse(content);
      apps.push({
        name: pkg.name,
        type: 'app',
        path: file.replace('/package.json', ''),
        dependencies: Object.keys(pkg.dependencies || {}),
      });
    }

    return apps;
  }

  async listPackages(): Promise<PackageInfo[]> {
    const packagesDir = join(this.repoRoot, 'packages');
    const { stdout } = await execAsync(`find ${packagesDir} -maxdepth 3 -name "package.json"`);
    
    const packageFiles = stdout.trim().split('\n').filter(Boolean);
    const packages: PackageInfo[] = [];

    for (const file of packageFiles) {
      const content = await readFile(file, 'utf-8');
      const pkg = JSON.parse(content);
      packages.push({
        name: pkg.name,
        type: 'package',
        path: file.replace('/package.json', ''),
        dependencies: Object.keys(pkg.dependencies || {}),
      });
    }

    return packages;
  }

  async getPackageInfo(name: string): Promise<PackageInfo | null> {
    const allPackages = [...await this.listApps(), ...await this.listPackages()];
    return allPackages.find(p => p.name === name) || null;
  }

  async createPackage(
    type: 'configs' | 'bin' | 'mcp' | 'ui' | 'contracts' | 'types',
    name: string
  ): Promise<{ success: boolean; path: string; message: string }> {
    const basePath =
      type === 'mcp'
        ? join(this.repoRoot, 'packages', 'mcp', name)
        : join(this.repoRoot, 'packages', type, name);

    try {
      await mkdir(basePath, { recursive: true });

      // Create basic package.json
      const packageJson = {
        name: `@repo/${type === 'mcp' ? `mcp-${name}` : name}`,
        version: '1.0.0',
        private: true,
        type: 'module',
        main: 'index.ts',
        scripts: {
          'type-check': 'tsc --noEmit',
          test: 'vitest run',
          'test:watch': 'vitest',
        },
      };

      await writeFile(
        join(basePath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      return {
        success: true,
        path: basePath,
        message: `Package created at ${basePath}`,
      };
    } catch (error) {
      return {
        success: false,
        path: basePath,
        message: `Failed to create package: ${error.message}`,
      };
    }
  }

  async getPackageJson(packageName: string): Promise<PackageJson | null> {
    try {
      const packageInfo = await this.getPackageInfo(packageName);
      if (!packageInfo) {
        return null;
      }

      const packageJsonPath = join(packageInfo.path, 'package.json');
      const content = await readFile(packageJsonPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async updatePackageJson(
    packageName: string,
    packageJson: PackageJson,
  ): Promise<void> {
    const packageInfo = await this.getPackageInfo(packageName);
    if (!packageInfo) {
      throw new Error(`Package "${packageName}" not found`);
    }

    const packageJsonPath = join(packageInfo.path, 'package.json');
    await writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n',
    );
  }
}
