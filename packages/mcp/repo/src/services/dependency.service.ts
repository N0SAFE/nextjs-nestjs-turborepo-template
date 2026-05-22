import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { PackageJson } from '../types/common.types.js';
import type { GraphNode, DependencyGraph } from '../types/resource.types.js';
import type {
  CircularDependency,
  DependencyAnalysis,
  DependencyUpdate,
  AddDependencyOptions,
  RemoveDependencyOptions,
  UpdateDependencyOptions,
} from '../types/dependency.types.js';

/**
 * Service for managing and analyzing package dependencies
 */
@Injectable()
export class DependencyService {
  private readonly logger = new Logger(DependencyService.name);
  private readonly workspaceRoot: string;

  constructor() {
    this.workspaceRoot = process.cwd();
  }

  /**
   * Build complete dependency graph for the entire workspace
   */
  async getDependencyGraph(): Promise<DependencyGraph> {
    this.logger.debug('Building dependency graph');

    // Start by finding all packages
    const apps = await this.findPackages('apps');
    const packages = await this.findPackages('packages');
    const allPackages = [...apps, ...packages];

    const nodes: Record<string, GraphNode> = {};
    const edges: DependencyGraph['edges'] = [];
    const dependentsMap: Record<string, Set<string>> = {};

    // Build nodes
    for (const pkg of allPackages) {
      const packageJson = await this.readPackageJson(pkg.path);

      nodes[pkg.name] = {
        id: pkg.name,
        type: pkg.type,
        path: pkg.path,
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        peerDependencies: packageJson.peerDependencies || {},
        dependents: [], // Will fill this in next step
        level: 0, // Will calculate after building edges
      };
    }

    // Build edges by analyzing dependencies
    for (const [pkgName, node] of Object.entries(nodes)) {
      // Process each dependency type
      for (const dep of Object.keys(node.dependencies)) {
        edges.push({ from: pkgName, to: dep, type: 'dependencies' });
        if (!dependentsMap[dep]) dependentsMap[dep] = new Set();
        dependentsMap[dep].add(pkgName);
      }

      for (const dep of Object.keys(node.devDependencies)) {
        edges.push({ from: pkgName, to: dep, type: 'devDependencies' });
        if (!dependentsMap[dep]) dependentsMap[dep] = new Set();
        dependentsMap[dep].add(pkgName);
      }

      for (const dep of Object.keys(node.peerDependencies)) {
        edges.push({ from: pkgName, to: dep, type: 'peerDependencies' });
        if (!dependentsMap[dep]) dependentsMap[dep] = new Set();
        dependentsMap[dep].add(pkgName);
      }
    }

    // Fill in dependents arrays
    for (const [pkgName, dependents] of Object.entries(dependentsMap)) {
      if (nodes[pkgName]) {
        nodes[pkgName].dependents = Array.from(dependents);
      }
    }

    // Calculate dependency levels (depth in tree)
    this.calculateDependencyLevels(nodes);

    // Calculate metadata
    const internalPackageNames = new Set(Object.keys(nodes));
    let internalDeps = 0;
    let externalDeps = 0;

    for (const edge of edges) {
      if (internalPackageNames.has(edge.to)) {
        internalDeps++;
      } else {
        externalDeps++;
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        totalPackages: Object.keys(nodes).length,
        totalDependencies: edges.length,
        internalDependencies: internalDeps,
        externalDependencies: externalDeps,
      },
    };
  }

  /**
   * Calculate dependency level for each node (BFS from root nodes)
   */
  private calculateDependencyLevels(nodes: Record<string, GraphNode>): void {
    // Find root nodes (packages with no dependencies)
    const roots: string[] = [];
    for (const [name, node] of Object.entries(nodes)) {
      const hasNoDeps =
        Object.keys(node.dependencies).length === 0 &&
        Object.keys(node.devDependencies).length === 0 &&
        Object.keys(node.peerDependencies).length === 0;
      if (hasNoDeps) {
        roots.push(name);
        node.level = 0;
      }
    }

    // BFS to calculate levels
    const queue = [...roots];
    const visited = new Set<string>(roots);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = nodes[current].level;

      // Visit all dependents
      for (const dependent of nodes[current].dependents) {
        if (!visited.has(dependent)) {
          visited.add(dependent);
          nodes[dependent].level = currentLevel + 1;
          queue.push(dependent);
        }
      }
    }
  }

  /**
   * Find circular dependencies in the workspace
   */
  async findCircularDependencies(): Promise<CircularDependency[]> {
    const graph = await this.getDependencyGraph();
    const circles: CircularDependency[] = [];

    // Use DFS to detect cycles
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recStack.add(node);

      const graphNode = graph.nodes[node];
      if (!graphNode) return;

      const deps = Object.keys(graphNode.dependencies);
      for (const dep of deps) {
        if (!graph.nodes[dep]) continue; // External dependency, skip

        if (!visited.has(dep)) {
          dfs(dep, [...path, dep]);
        } else if (recStack.has(dep)) {
          // Found a cycle
          const cycleStart = path.indexOf(dep);
          const cycle = path.slice(cycleStart);
          const pathStr = [...cycle, dep].join(' -> ');
          circles.push({
            cycle: [...cycle, dep],
            path: pathStr,
          });
        }
      }

      recStack.delete(node);
    };

    for (const node of Object.keys(graph.nodes)) {
      if (!visited.has(node)) {
        dfs(node, [node]);
      }
    }

    return circles;
  }

  /**
   * Analyze dependencies across the workspace
   */
  async analyzeDependencies(): Promise<DependencyAnalysis> {
    const graph = await this.getDependencyGraph();
    const circularDeps = await this.findCircularDependencies();

    // Count internal vs external dependencies
    const internalPackages = new Set(Object.keys(graph.nodes));
    let internalCount = 0;
    let externalCount = 0;

    for (const node of Object.values(graph.nodes)) {
      for (const dep of Object.keys(node.dependencies)) {
        if (internalPackages.has(dep)) {
          internalCount++;
        } else {
          externalCount++;
        }
      }
    }

    // Find duplicated versions
    const versionMap = new Map<string, Map<string, string[]>>();

    for (const [pkgName, node] of Object.entries(graph.nodes)) {
      for (const [dep, version] of Object.entries(node.dependencies)) {
        if (!versionMap.has(dep)) {
          versionMap.set(dep, new Map());
        }
        const versions = versionMap.get(dep)!;
        if (!versions.has(version)) {
          versions.set(version, []);
        }
        versions.get(version)!.push(pkgName);
      }
    }

    const duplicated: Record<string, string[]> = {};
    for (const [dep, versions] of versionMap) {
      if (versions.size > 1) {
        duplicated[dep] = Array.from(versions.keys());
      }
    }

    // Count workspace protocol usage
    let workspaceProtocolCount = 0;
    for (const node of Object.values(graph.nodes)) {
      for (const version of Object.values(node.dependencies)) {
        if (version.startsWith('workspace:')) {
          workspaceProtocolCount++;
        }
      }
    }

    // Count dependency types
    let totalDeps = 0;
    let totalDevDeps = 0;
    let totalPeerDeps = 0;

    for (const node of Object.values(graph.nodes)) {
      totalDeps += Object.keys(node.dependencies).length;
      totalDevDeps += Object.keys(node.devDependencies).length;
      totalPeerDeps += Object.keys(node.peerDependencies).length;
    }

    return {
      totalDependencies: totalDeps,
      totalDevDependencies: totalDevDeps,
      totalPeerDependencies: totalPeerDeps,
      internalDependencies: internalCount,
      externalDependencies: externalCount,
      circularDependencies: circularDeps,
      unusedDependencies: [], // TODO: Implement
      duplicatedVersions: duplicated,
      workspaceProtocolUsage: workspaceProtocolCount,
    };
  }

  /**
   * Get packages that depend on a specific package
   */
  async getUsedBy(packageName: string): Promise<string[]> {
    const graph = await this.getDependencyGraph();
    const dependents: string[] = [];

    for (const [pkgName, node] of Object.entries(graph.nodes)) {
      const allDeps = [
        ...Object.keys(node.dependencies),
        ...Object.keys(node.devDependencies),
        ...Object.keys(node.peerDependencies),
      ];

      if (allDeps.includes(packageName)) {
        dependents.push(pkgName);
      }
    }

    return dependents;
  }

  /**
   * Get dependencies of a specific package
   */
  async getUses(packageName: string): Promise<string[]> {
    const graph = await this.getDependencyGraph();
    const node = graph.nodes[packageName];

    if (!node) {
      return [];
    }

    return [
      ...Object.keys(node.dependencies),
      ...Object.keys(node.devDependencies),
      ...Object.keys(node.peerDependencies),
    ];
  }

  /**
   * Validate a dependency update to check for breaking changes
   */
  async validateUpdate(
    packageName: string,
    dependencyName: string,
    newVersion: string,
  ): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    // Check if this would create circular dependencies
    const circles = await this.findCircularDependencies();
    if (circles.length > 0) {
      const affectedCircles = circles.filter((c) =>
        c.cycle.includes(packageName),
      );
      if (affectedCircles.length > 0) {
        warnings.push(
          `Package is part of ${affectedCircles.length} circular dependency chain(s)`,
        );
      }
    }

    // Check version compatibility (basic semver check)
    if (!this.isValidSemver(newVersion)) {
      warnings.push(`Version "${newVersion}" is not a valid semver version`);
      return { valid: false, warnings };
    }

    // Check if update would break workspace protocol usage
    const graph = await this.getDependencyGraph();
    const node = graph.nodes[packageName];

    if (node) {
      const currentVersion = node.dependencies[dependencyName];
      if (currentVersion && currentVersion.startsWith('workspace:')) {
        if (!newVersion.startsWith('workspace:')) {
          warnings.push(
            `Changing from workspace protocol (${currentVersion}) to external version may break monorepo setup`,
          );
        }
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Helper: Find all packages in a directory
   */
  private async findPackages(
    baseDir: string,
  ): Promise<Array<{ name: string; path: string; type: 'app' | 'package' }>> {
    const results: Array<{
      name: string;
      path: string;
      type: 'app' | 'package';
    }> = [];

    const basePath = join(this.workspaceRoot, baseDir);

    try {
      const { readdir } = await import('fs/promises');
      const entries = await readdir(basePath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packagePath = join(basePath, entry.name, 'package.json');

          try {
            const packageJson = await this.readPackageJson(packagePath);

            results.push({
              name: packageJson.name,
              path: join(baseDir, entry.name),
              type: baseDir === 'apps' ? 'app' : 'package',
            });
          } catch {
            // No package.json, skip
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to read ${baseDir}: ${error}`);
    }

    return results;
  }

  /**
   * Helper: Read package.json file
   */
  private async readPackageJson(path: string): Promise<PackageJson> {
    const fullPath = path.startsWith('/')
      ? path
      : join(this.workspaceRoot, path);

    const content = await readFile(fullPath, 'utf-8');
    return JSON.parse(content) as PackageJson;
  }

  /**
   * Helper: Validate semver version
   */
  private isValidSemver(version: string): boolean {
    // Basic semver validation
    const semverRegex =
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return (
      semverRegex.test(version) ||
      version === 'latest' ||
      version.startsWith('workspace:')
    );
  }
}
