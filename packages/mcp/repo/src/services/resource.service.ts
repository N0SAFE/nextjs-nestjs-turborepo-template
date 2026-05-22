import { Injectable } from '@nestjs/common';
import { readFile, readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import type {
  RepoSummary,
  AgentFile,
  RepoStructure,
  FileSystemNode,
  PackageScripts,
  PackageFiles,
} from '../types/resource.types.js';
import type { RepoStats, PackageJson } from '../types/common.types.js';

@Injectable()
export class ResourceService {
  private readonly repoRoot = process.cwd();
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly cacheTTL = 60000; // 1 minute

  /**
   * Get repository summary
   */
  async getRepoSummary(): Promise<RepoSummary> {
    const cached = this.getFromCache<RepoSummary>('repo-summary');
    if (cached) return cached;

    const [apps, packages, stats] = await Promise.all([
      this.listAppNames(),
      this.listPackageNames(),
      this.getRepoStats(),
    ]);

    const summary: RepoSummary = {
      name: 'nextjs-nestjs-turborepo-template',
      root: this.repoRoot,
      description:
        'Next.js + NestJS monorepo with ORPC, Better Auth, and Turborepo',
      stats,
      structure: {
        apps,
        packages,
      },
      lastUpdated: new Date().toISOString(),
    };

    this.setCache('repo-summary', summary);
    return summary;
  }

  /**
   * Get list of app names
   */
  async listAppNames(): Promise<string[]> {
    const appsDir = join(this.repoRoot, 'apps');
    const entries = await readdir(appsDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  }

  /**
   * Get list of package names
   */
  async listPackageNames(): Promise<string[]> {
    const packagesDir = join(this.repoRoot, 'packages');
    const packages: string[] = [];

    const categories = await readdir(packagesDir, { withFileTypes: true });

    for (const category of categories) {
      if (category.isDirectory()) {
        const categoryPath = join(packagesDir, category.name);
        const items = await readdir(categoryPath, { withFileTypes: true });

        for (const item of items) {
          if (item.isDirectory()) {
            const packageJsonPath = join(categoryPath, item.name, 'package.json');
            try {
              await stat(packageJsonPath);
              packages.push(`${category.name}/${item.name}`);
            } catch {
              // No package.json, skip
            }
          }
        }
      }
    }

    return packages.sort();
  }

  /**
   * Get repository statistics
   */
  async getRepoStats(): Promise<RepoStats> {
    const cached = this.getFromCache<RepoStats>('repo-stats');
    if (cached) return cached;

    const [apps, packages] = await Promise.all([
      this.listAppNames(),
      this.listPackageNames(),
    ]);

    const stats: RepoStats = {
      totalPackages: packages.length,
      totalApps: apps.length,
      totalFiles: 0,
      totalLines: 0,
      languages: {},
    };

    this.setCache('repo-stats', stats);
    return stats;
  }

  /**
   * Get repository structure tree
   */
  async getRepoStructure(): Promise<RepoStructure> {
    const root = await this.buildFileTree(this.repoRoot, 0, 3);

    const stats = this.calculateTreeStats(root);

    return {
      root,
      summary: stats,
    };
  }

  /**
   * Get all AGENTS.md files
   */
  async getAgentFiles(): Promise<AgentFile[]> {
    const agents: AgentFile[] = [];

    // Root AGENTS.md
    const rootAgent = await this.readAgentFile('AGENTS.md', 'root');
    if (rootAgent) agents.push(rootAgent);

    // App AGENTS.md files
    const apps = await this.listAppNames();
    for (const app of apps) {
      const agentFile = await this.readAgentFile(
        join('apps', app, 'AGENTS.md'),
        'app',
        app,
      );
      if (agentFile) agents.push(agentFile);
    }

    // Package AGENTS.md files
    const packages = await this.listPackageNames();
    for (const pkg of packages) {
      const agentFile = await this.readAgentFile(
        join('packages', pkg, 'AGENTS.md'),
        'package',
        pkg,
      );
      if (agentFile) agents.push(agentFile);
    }

    return agents;
  }

  /**
   * Get specific AGENTS.md file
   */
  async getAgentFile(
    scope: 'root' | 'app' | 'package',
    target?: string,
  ): Promise<AgentFile | null> {
    let path: string;

    if (scope === 'root') {
      path = 'AGENTS.md';
    } else if (scope === 'app' && target) {
      path = join('apps', target, 'AGENTS.md');
    } else if (scope === 'package' && target) {
      path = join('packages', target, 'AGENTS.md');
    } else {
      return null;
    }

    return this.readAgentFile(path, scope, target);
  }

  /**
   * Get package scripts
   */
  async getPackageScripts(packageName: string): Promise<PackageScripts | null> {
    const packageJsonPath = await this.findPackageJsonPath(packageName);
    if (!packageJsonPath) return null;

    const content = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content) as PackageJson;

    const scripts = Object.entries(packageJson.scripts || {}).map(
      ([name, command]) => ({
        name,
        command,
      }),
    );

    return {
      packageName,
      scripts,
    };
  }

  /**
   * Get package file structure
   */
  async getPackageFiles(packageName: string): Promise<PackageFiles | null> {
    const packagePath = await this.findPackagePath(packageName);
    if (!packagePath) return null;

    const structure = await this.buildFileTree(packagePath, 0, 5);

    const allFiles = this.flattenTree(structure);
    const sourceFiles = allFiles.filter((f) =>
      /\.(ts|tsx|js|jsx)$/.test(f) && !f.includes('node_modules') &&
      !f.includes('dist'),
    );
    const testFiles = allFiles.filter((f) =>
      /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f),
    );
    const configFiles = allFiles.filter((f) =>
      /\.(config|rc)\.(ts|js|json)$/.test(f) || f.endsWith('tsconfig.json'),
    );

    return {
      packageName,
      structure,
      sourceFiles,
      testFiles,
      configFiles,
    };
  }

  // ========== Private Helper Methods ==========

  private async readAgentFile(
    path: string,
    scope: 'root' | 'app' | 'package',
    target?: string,
  ): Promise<AgentFile | null> {
    const fullPath = join(this.repoRoot, path);

    try {
      const content = await readFile(fullPath, 'utf-8');
      const stats = await stat(fullPath);

      return {
        path,
        scope,
        target,
        content,
        lastModified: stats.mtime.toISOString(),
      };
    } catch {
      return null;
    }
  }

  private async buildFileTree(
    dirPath: string,
    currentDepth: number,
    maxDepth: number,
  ): Promise<FileSystemNode> {
    const name = dirPath === this.repoRoot ? 'root' : dirPath.split('/').pop()!;
    const relativePath = relative(this.repoRoot, dirPath) || '.';

    // Check if it's a file
    const stats = await stat(dirPath);
    if (stats.isFile()) {
      return {
        name,
        type: 'file',
        path: relativePath,
      };
    }

    // It's a directory
    const node: FileSystemNode = {
      name,
      type: 'directory',
      path: relativePath,
      children: [],
    };

    // Stop at max depth
    if (currentDepth >= maxDepth) {
      return node;
    }

    // Skip certain directories
    const skipDirs = ['node_modules', '.git', 'dist', '.turbo', 'coverage'];
    if (skipDirs.includes(name)) {
      return node;
    }

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const childPath = join(dirPath, entry.name);
        const child = await this.buildFileTree(
          childPath,
          currentDepth + 1,
          maxDepth,
        );
        node.children!.push(child);
      }

      // Sort: directories first, then files
      node.children!.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
    } catch {
      // Permission denied or other error, return directory without children
    }

    return node;
  }

  private calculateTreeStats(node: FileSystemNode): {
    totalDirectories: number;
    totalFiles: number;
    depth: number;
  } {
    let totalDirectories = 0;
    let totalFiles = 0;
    let maxDepth = 0;

    const traverse = (n: FileSystemNode, depth: number) => {
      if (n.type === 'directory') {
        totalDirectories++;
        if (n.children) {
          for (const child of n.children) {
            traverse(child, depth + 1);
          }
        }
      } else {
        totalFiles++;
      }
      maxDepth = Math.max(maxDepth, depth);
    };

    traverse(node, 0);

    return { totalDirectories, totalFiles, depth: maxDepth };
  }

  private flattenTree(node: FileSystemNode): string[] {
    const files: string[] = [];

    const traverse = (n: FileSystemNode) => {
      if (n.type === 'file') {
        files.push(n.path);
      } else if (n.children) {
        for (const child of n.children) {
          traverse(child);
        }
      }
    };

    traverse(node);
    return files;
  }

  /**
   * Get package.json content for a specific package or app
   */
  async getPackageJson(name: string): Promise<PackageJson | null> {
    const packagePath = await this.findPackagePath(name);
    if (!packagePath) return null;

    const packageJsonPath = join(packagePath, 'package.json');
    try {
      const content = await readFile(packageJsonPath, 'utf-8');
      return JSON.parse(content) as PackageJson;
    } catch {
      return null;
    }
  }

  /**
   * Get dependencies for a specific package
   */
  async getPackageDependencies(name: string): Promise<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
  } | null> {
    const pkg = await this.getPackageJson(name);
    if (!pkg) return null;

    return {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      peerDependencies: pkg.peerDependencies || {},
    };
  }

  /**
   * Get packages that depend on the specified package (reverse dependencies)
   */
  async getPackageDependents(name: string): Promise<string[]> {
    const cached = this.getFromCache<string[]>(`dependents-${name}`);
    if (cached) return cached;

    const [apps, packages] = await Promise.all([
      this.listAppNames(),
      this.listPackageNames(),
    ]);

    const allPackages = [...apps, ...packages];
    const dependents: string[] = [];

    // Check each package to see if it depends on the target
    for (const pkgName of allPackages) {
      const deps = await this.getPackageDependencies(pkgName);
      if (!deps) continue;

      const allDeps = {
        ...deps.dependencies,
        ...deps.devDependencies,
        ...deps.peerDependencies,
      };

      // Check if target package is in dependencies
      const targetPkgJson = await this.getPackageJson(name);
      if (!targetPkgJson) continue;

      const targetPackageName = targetPkgJson.name;
      if (targetPackageName && allDeps[targetPackageName]) {
        dependents.push(pkgName);
      }
    }

    this.setCache(`dependents-${name}`, dependents);
    return dependents;
  }

  private async findPackageJsonPath(
    packageName: string,
  ): Promise<string | null> {
    // Try apps first
    const appPath = join(this.repoRoot, 'apps', packageName, 'package.json');
    try {
      await stat(appPath);
      return appPath;
    } catch {
      // Not in apps
    }

    // Try packages
    const pkgPath = join(this.repoRoot, 'packages', packageName, 'package.json');
    try {
      await stat(pkgPath);
      return pkgPath;
    } catch {
      // Not found
    }

    return null;
  }

  private async findPackagePath(packageName: string): Promise<string | null> {
    // Try apps first
    const appPath = join(this.repoRoot, 'apps', packageName);
    try {
      await stat(appPath);
      return appPath;
    } catch {
      // Not in apps
    }

    // Try packages
    const pkgPath = join(this.repoRoot, 'packages', packageName);
    try {
      await stat(pkgPath);
      return pkgPath;
    } catch {
      // Not found
    }

    return null;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}
