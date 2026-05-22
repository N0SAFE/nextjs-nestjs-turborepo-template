import { Injectable } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DependencyService } from '../services/dependency.service.js';
import { PackageService } from '../services/package.service.js';
import type {
  AddDependencyOptions,
  RemoveDependencyOptions,
  UpdateDependencyOptions,
} from '../types/dependency.types.js';

/**
 * Provides MCP tools for managing dependencies across packages.
 * Supports adding, removing, updating, and analyzing dependencies.
 */
@Injectable()
export class DependencyToolsProvider {
  constructor(
    private readonly dependencyService: DependencyService,
    private readonly packageService: PackageService,
  ) {}

  @Tool({
    name: 'add-dependency',
    description: 'Add a dependency to a package',
    parameters: z.object({
      packageName: z.string().describe('Target package name (e.g., web, api, ui/base)'),
      dependencyName: z.string().describe('Dependency name to add'),
      version: z.string().optional().describe('Version to install (defaults to latest or workspace:*)'),
      type: z
        .enum(['dependencies', 'devDependencies', 'peerDependencies'])
        .optional()
        .describe('Dependency type (defaults to dependencies)'),
      skipValidation: z.boolean().optional().describe('Skip validation checks (default: false)'),
    }),
  })
  async addDependency(
    params: {
      packageName: string;
      dependencyName: string;
      version?: string;
      type?: 'dependencies' | 'devDependencies' | 'peerDependencies';
      skipValidation?: boolean;
    },
    context: Context,
  ) {
    try {
      const { packageName, dependencyName, version, type = 'dependencies', skipValidation = false } = params;

      // Get package.json
      const packageJson = await this.packageService.getPackageJson(packageName);
      if (!packageJson) {
        return `❌ Package "${packageName}" not found`;
      }

      // Check if dependency already exists
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };
      if (allDeps[dependencyName]) {
        return `⚠️ Dependency "${dependencyName}" already exists in ${packageName} with version ${allDeps[dependencyName]}`;
      }

      // Detect if it's an internal dependency
      const allPackages = await this.packageService.listPackages();
      const isInternal = allPackages.some(pkg => pkg.name === dependencyName);

      // Determine version
      let finalVersion = version;
      if (!finalVersion) {
        finalVersion = isInternal ? 'workspace:*' : 'latest';
      }

      // Validate the update
      if (!skipValidation) {
        const validation = await this.dependencyService.validateUpdate({
          packageName,
          dependencyName,
          newVersion: finalVersion,
          type,
        });

        if (!validation.isValid) {
          return `❌ Validation failed:\n${validation.errors.map(e => `  • ${e}`).join('\n')}`;
        }

        if (validation.warnings.length > 0) {
          context.info(`Warnings:\n${validation.warnings.map(w => `  ⚠️ ${w}`).join('\n')}`);
        }
      }

      // Add dependency to package.json
      if (!packageJson[type]) {
        packageJson[type] = {};
      }
      packageJson[type]![dependencyName] = finalVersion;

      // Sort dependencies alphabetically
      packageJson[type] = Object.keys(packageJson[type]!)
        .sort()
        .reduce((acc, key) => {
          acc[key] = packageJson[type]![key];
          return acc;
        }, {} as Record<string, string>);

      // Update package.json
      await this.packageService.updatePackageJson(packageName, packageJson);

      const emoji = isInternal ? '🔗' : '📦';
      return `✅ ${emoji} Added ${dependencyName}@${finalVersion} to ${packageName} (${type})`;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return `❌ Error adding dependency: ${message}`;
    }
  }

  @Tool({
    name: 'remove-dependency',
    description: 'Remove a dependency from a package',
    parameters: z.object({
      packageName: z.string().describe('Target package name (e.g., web, api, ui/base)'),
      dependencyName: z.string().describe('Dependency name to remove'),
      type: z
        .enum(['dependencies', 'devDependencies', 'peerDependencies', 'all'])
        .optional()
        .describe('Dependency type to remove from (defaults to all)'),
    }),
  })
  async removeDependency(
    params: {
      packageName: string;
      dependencyName: string;
      type?: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'all';
    },
    context: Context,
  ) {
    try {
      const { packageName, dependencyName, type = 'all' } = params;

      // Get package.json
      const packageJson = await this.packageService.getPackageJson(packageName);
      if (!packageJson) {
        return `❌ Package "${packageName}" not found`;
      }

      const typesToCheck: ('dependencies' | 'devDependencies' | 'peerDependencies')[] =
        type === 'all' ? ['dependencies', 'devDependencies', 'peerDependencies'] : [type];

      let removed = false;
      const removedFrom: string[] = [];

      for (const depType of typesToCheck) {
        if (packageJson[depType] && packageJson[depType]![dependencyName]) {
          delete packageJson[depType]![dependencyName];
          removed = true;
          removedFrom.push(depType);
        }
      }

      if (!removed) {
        return `⚠️ Dependency "${dependencyName}" not found in ${packageName}`;
      }

      // Update package.json
      await this.packageService.updatePackageJson(packageName, packageJson);

      return `✅ Removed ${dependencyName} from ${packageName} (${removedFrom.join(', ')})`;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return `❌ Error removing dependency: ${message}`;
    }
  }

  @Tool({
    name: 'update-dependency',
    description: 'Update a dependency version in a package',
    parameters: z.object({
      packageName: z.string().describe('Target package name (e.g., web, api, ui/base)'),
      dependencyName: z.string().describe('Dependency name to update'),
      version: z.string().describe('New version to set'),
      type: z
        .enum(['dependencies', 'devDependencies', 'peerDependencies'])
        .optional()
        .describe('Dependency type (auto-detected if not specified)'),
      skipValidation: z.boolean().optional().describe('Skip validation checks (default: false)'),
    }),
  })
  async updateDependency(
    params: {
      packageName: string;
      dependencyName: string;
      version: string;
      type?: 'dependencies' | 'devDependencies' | 'peerDependencies';
      skipValidation?: boolean;
    },
    context: Context,
  ) {
    try {
      const { packageName, dependencyName, version, type, skipValidation = false } = params;

      // Get package.json
      const packageJson = await this.packageService.getPackageJson(packageName);
      if (!packageJson) {
        return `❌ Package "${packageName}" not found`;
      }

      // Find the dependency
      let foundType: 'dependencies' | 'devDependencies' | 'peerDependencies' | null = null;
      let currentVersion: string | null = null;

      if (type) {
        if (packageJson[type] && packageJson[type]![dependencyName]) {
          foundType = type;
          currentVersion = packageJson[type]![dependencyName];
        }
      } else {
        // Auto-detect type
        const typesToCheck: ('dependencies' | 'devDependencies' | 'peerDependencies')[] = [
          'dependencies',
          'devDependencies',
          'peerDependencies',
        ];
        for (const depType of typesToCheck) {
          if (packageJson[depType] && packageJson[depType]![dependencyName]) {
            foundType = depType;
            currentVersion = packageJson[depType]![dependencyName];
            break;
          }
        }
      }

      if (!foundType || !currentVersion) {
        return `❌ Dependency "${dependencyName}" not found in ${packageName}`;
      }

      // Validate the update
      if (!skipValidation) {
        const validation = await this.dependencyService.validateUpdate({
          packageName,
          dependencyName,
          newVersion: version,
          type: foundType,
        });

        if (!validation.isValid) {
          return `❌ Validation failed:\n${validation.errors.map(e => `  • ${e}`).join('\n')}`;
        }

        if (validation.warnings.length > 0) {
          context.info(`Warnings:\n${validation.warnings.map(w => `  ⚠️ ${w}`).join('\n')}`);
        }
      }

      // Update the version
      packageJson[foundType]![dependencyName] = version;

      // Update package.json
      await this.packageService.updatePackageJson(packageName, packageJson);

      return `✅ Updated ${dependencyName} in ${packageName} (${foundType}): ${currentVersion} → ${version}`;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return `❌ Error updating dependency: ${message}`;
    }
  }

  @Tool({
    name: 'list-internal-dependencies',
    description: 'List all internal workspace dependencies and their usage',
    parameters: z.object({}),
  })
  async listInternalDependencies(params: Record<string, never>, context: Context) {
    try {
      const graph = await this.dependencyService.getDependencyGraph();

      // Build a map of internal dependencies
      const internalDepsMap = new Map<string, { usedBy: string[]; version: string }>();

      for (const [pkgName, info] of Object.entries(graph.packages)) {
        for (const [depName, depVersion] of Object.entries(info.dependencies)) {
          if (graph.packages[depName]) {
            // It's an internal dependency
            if (!internalDepsMap.has(depName)) {
              internalDepsMap.set(depName, { usedBy: [], version: depVersion });
            }
            internalDepsMap.get(depName)!.usedBy.push(pkgName);
          }
        }
      }

      if (internalDepsMap.size === 0) {
        return '📦 No internal dependencies found';
      }

      // Sort by usage count (most used first)
      const sorted = Array.from(internalDepsMap.entries()).sort((a, b) => b[1].usedBy.length - a[1].usedBy.length);

      let result = '🔗 Internal Dependencies:\n\n';
      for (const [depName, info] of sorted) {
        const emoji = info.usedBy.length > 3 ? '🔥' : info.usedBy.length > 1 ? '📌' : '🔗';
        result += `${emoji} **${depName}** (${info.version})\n`;
        result += `   Used by ${info.usedBy.length} package(s): ${info.usedBy.join(', ')}\n\n`;
      }

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return `❌ Error listing internal dependencies: ${message}`;
    }
  }

  @Tool({
    name: 'analyze-dependencies',
    description: 'Analyze dependencies for issues (circular deps, duplicates, unused)',
    parameters: z.object({}),
  })
  async analyzeDependencies(params: Record<string, never>, context: Context) {
    try {
      const analysis = await this.dependencyService.analyzeDependencies();

      let result = '📊 Dependency Analysis:\n\n';
      result += `**Summary:**\n`;
      result += `• Circular dependencies: ${analysis.circular.length}\n`;
      result += `• Duplicate versions: ${analysis.duplicates.length}\n`;
      result += `• Unused dependencies: ${analysis.unused.length}\n\n`;

      if (analysis.circular.length > 0) {
        result += '⚠️ **Circular Dependencies:**\n';
        for (const cycle of analysis.circular) {
          result += `  • ${cycle.join(' → ')}\n`;
        }
        result += '\n';
      }

      if (analysis.duplicates.length > 0) {
        result += '🔄 **Duplicate Versions:**\n';
        for (const dup of analysis.duplicates) {
          result += `  • ${dup.name}: ${dup.versions.join(', ')}\n`;
        }
        result += '\n';
      }

      if (analysis.unused.length > 0) {
        result += '🗑️ **Unused Dependencies:**\n';
        for (const unused of analysis.unused) {
          result += `  • ${unused.packageName}: ${unused.dependencies.join(', ')}\n`;
        }
        result += '\n';
      }

      if (analysis.circular.length === 0 && analysis.duplicates.length === 0 && analysis.unused.length === 0) {
        result += '✅ No issues found!';
      }

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return `❌ Error analyzing dependencies: ${message}`;
    }
  }

  @Tool({
    name: 'get-dependency-graph',
    description: 'Get the full dependency graph as JSON',
    parameters: z.object({}),
  })
  async getDependencyGraph(params: Record<string, never>, context: Context) {
    try {
      const graph = await this.dependencyService.getDependencyGraph();
      return JSON.stringify(graph, null, 2);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return `❌ Error getting dependency graph: ${message}`;
    }
  }
}

/**
 * MCP tools for dependency management
 */
@Injectable()
export class DependencyToolsProvider {
  constructor(
    private readonly dependencyService: DependencyService,
    private readonly packageService: PackageService,
  ) {}

  /**
   * Add a dependency to a package
   */
  @Tool({
    name: 'add-dependency',
    description:
      'Add a dependency to a package. Supports workspace protocol for internal dependencies.',
    parameters: z.object({
      packageName: z
        .string()
        .describe('Name of the package to add the dependency to'),
      dependencyName: z.string().describe('Name of the dependency to add'),
      version: z
        .string()
        .optional()
        .describe(
          'Version to install (e.g., "^1.0.0", "latest", "workspace:*"). Defaults to "latest" for external or "workspace:*" for internal.',
        ),
      type: z
        .enum(['dependencies', 'devDependencies', 'peerDependencies'])
        .default('dependencies')
        .describe('Type of dependency to add'),
      workspace: z
        .boolean()
        .optional()
        .describe(
          'Force workspace protocol usage (workspace:*) for internal dependencies',
        ),
    }),
  })
  async addDependency(params: {
    packageName: string;
    dependencyName: string;
    version?: string;
    type?: 'dependencies' | 'devDependencies' | 'peerDependencies';
    workspace?: boolean;
  }): Promise<string> {
    try {
      // Check if package exists
      const packageJson = await this.packageService.getPackageJson(
        params.packageName,
      );
      if (!packageJson) {
        return `Error: Package "${params.packageName}" not found`;
      }

      // Check if dependency already exists
      const existingDeps = packageJson[params.type || 'dependencies'] || {};
      if (existingDeps[params.dependencyName]) {
        return `Error: Dependency "${params.dependencyName}" already exists in ${params.type || 'dependencies'} with version ${existingDeps[params.dependencyName]}`;
      }

      // Determine if this is an internal dependency
      const allPackages = [
        ...(await this.packageService.listApps()),
        ...(await this.packageService.listPackages()),
      ];
      const isInternal = allPackages.some(
        (pkg) => pkg.name === params.dependencyName,
      );

      // Determine version to use
      let version = params.version;
      if (!version) {
        if (isInternal || params.workspace) {
          version = 'workspace:*';
        } else {
          version = 'latest';
        }
      }

      // Validate the update
      const validation = await this.dependencyService.validateUpdate(
        params.packageName,
        params.dependencyName,
        version,
      );

      if (!validation.valid) {
        return `Error: Validation failed:\n${validation.errors.join('\n')}`;
      }

      // Add the dependency
      const options: AddDependencyOptions = {
        packageName: params.packageName,
        dependencyName: params.dependencyName,
        version,
        type: params.type || 'dependencies',
        workspace: params.workspace || isInternal,
      };

      // Update package.json
      const updatedPackageJson = { ...packageJson };
      if (!updatedPackageJson[options.type]) {
        updatedPackageJson[options.type] = {};
      }
      updatedPackageJson[options.type]![params.dependencyName] = version;

      await this.packageService.updatePackageJson(
        params.packageName,
        updatedPackageJson,
      );

      let message = `✅ Successfully added ${params.dependencyName}@${version} to ${params.packageName} (${options.type})`;

      if (isInternal) {
        message += '\n📦 Internal package detected - using workspace protocol';
      }

      return message;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * Remove a dependency from a package
   */
  @Tool({
    name: 'remove-dependency',
    description:
      'Remove a dependency from a package. Can remove from multiple dependency types at once.',
    parameters: z.object({
      packageName: z
        .string()
        .describe('Name of the package to remove the dependency from'),
      dependencyName: z.string().describe('Name of the dependency to remove'),
      types: z
        .array(z.enum(['dependencies', 'devDependencies', 'peerDependencies']))
        .optional()
        .describe(
          'Dependency types to remove from. If not specified, removes from all types.',
        ),
    }),
  })
  async removeDependency(params: {
    packageName: string;
    dependencyName: string;
    types?: Array<'dependencies' | 'devDependencies' | 'peerDependencies'>;
  }): Promise<string> {
    try {
      // Check if package exists
      const packageJson = await this.packageService.getPackageJson(
        params.packageName,
      );
      if (!packageJson) {
        return `Error: Package "${params.packageName}" not found`;
      }

      // Determine which dependency types to check
      const typesToCheck: Array<
        'dependencies' | 'devDependencies' | 'peerDependencies'
      > = params.types || [
        'dependencies',
        'devDependencies',
        'peerDependencies',
      ];

      // Remove from specified types
      const updatedPackageJson = { ...packageJson };
      const removedFrom: string[] = [];

      for (const type of typesToCheck) {
        if (
          updatedPackageJson[type] &&
          updatedPackageJson[type]![params.dependencyName]
        ) {
          delete updatedPackageJson[type]![params.dependencyName];
          removedFrom.push(type);
        }
      }

      if (removedFrom.length === 0) {
        return `Error: Dependency "${params.dependencyName}" not found in ${params.packageName}`;
      }

      await this.packageService.updatePackageJson(
        params.packageName,
        updatedPackageJson,
      );

      return `✅ Successfully removed ${params.dependencyName} from ${params.packageName} (${removedFrom.join(', ')})`;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * Update a dependency to a new version
   */
  @Tool({
    name: 'update-dependency',
    description:
      'Update a dependency to a new version. Validates compatibility before updating.',
    parameters: z.object({
      packageName: z
        .string()
        .describe('Name of the package containing the dependency'),
      dependencyName: z.string().describe('Name of the dependency to update'),
      version: z.string().describe('New version to update to'),
      type: z
        .enum(['dependencies', 'devDependencies', 'peerDependencies'])
        .optional()
        .describe('Type of dependency. If not specified, searches all types.'),
    }),
  })
  async updateDependency(params: {
    packageName: string;
    dependencyName: string;
    version: string;
    type?: 'dependencies' | 'devDependencies' | 'peerDependencies';
  }): Promise<string> {
    try {
      // Check if package exists
      const packageJson = await this.packageService.getPackageJson(
        params.packageName,
      );
      if (!packageJson) {
        return `Error: Package "${params.packageName}" not found`;
      }

      // Find the dependency in the specified type or all types
      let foundType:
        | 'dependencies'
        | 'devDependencies'
        | 'peerDependencies'
        | null = null;
      let currentVersion: string | null = null;

      if (params.type) {
        if (
          packageJson[params.type] &&
          packageJson[params.type]![params.dependencyName]
        ) {
          foundType = params.type;
          currentVersion = packageJson[params.type]![params.dependencyName];
        }
      } else {
        for (const type of [
          'dependencies' as const,
          'devDependencies' as const,
          'peerDependencies' as const,
        ]) {
          if (packageJson[type] && packageJson[type]![params.dependencyName]) {
            foundType = type;
            currentVersion = packageJson[type]![params.dependencyName];
            break;
          }
        }
      }

      if (!foundType || !currentVersion) {
        return `Error: Dependency "${params.dependencyName}" not found in ${params.packageName}`;
      }

      // Validate the update
      const validation = await this.dependencyService.validateUpdate(
        params.packageName,
        params.dependencyName,
        params.version,
      );

      if (!validation.valid) {
        return `Error: Validation failed:\n${validation.errors.join('\n')}`;
      }

      // Update the dependency
      const updatedPackageJson = { ...packageJson };
      updatedPackageJson[foundType]![params.dependencyName] = params.version;

      await this.packageService.updatePackageJson(
        params.packageName,
        updatedPackageJson,
      );

      return `✅ Successfully updated ${params.dependencyName} in ${params.packageName} (${foundType})\n   ${currentVersion} → ${params.version}`;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * List all internal (workspace) dependencies
   */
  @Tool({
    name: 'list-internal-dependencies',
    description:
      'List all internal workspace dependencies and their usage across packages.',
  })
  async listInternalDependencies(): Promise<string> {
    try {
      const graph = await this.dependencyService.getDependencyGraph();
      const internalDeps = new Map<
        string,
        { usedBy: string[]; types: Set<string> }
      >();

      // Collect internal dependencies
      for (const [nodeName, node] of Object.entries(graph.nodes)) {
        for (const type of [
          'dependencies',
          'devDependencies',
          'peerDependencies',
        ] as const) {
          const deps = node[type];
          for (const [depName, version] of Object.entries(deps)) {
            if (version.startsWith('workspace:')) {
              if (!internalDeps.has(depName)) {
                internalDeps.set(depName, { usedBy: [], types: new Set() });
              }
              const entry = internalDeps.get(depName)!;
              entry.usedBy.push(nodeName);
              entry.types.add(type);
            }
          }
        }
      }

      if (internalDeps.size === 0) {
        return 'No internal (workspace) dependencies found.';
      }

      // Format output
      let output = '📦 Internal Workspace Dependencies:\n\n';
      const sortedDeps = Array.from(internalDeps.entries()).sort((a, b) =>
        a[0].localeCompare(b[0]),
      );

      for (const [depName, info] of sortedDeps) {
        output += `• ${depName} (used by ${info.usedBy.length} package${info.usedBy.length > 1 ? 's' : ''})\n`;
        output += `  Types: ${Array.from(info.types).join(', ')}\n`;
        output += `  Used by: ${info.usedBy.join(', ')}\n\n`;
      }

      return output;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * Analyze dependencies for issues
   */
  @Tool({
    name: 'analyze-dependencies',
    description:
      'Analyze all dependencies for circular dependencies, duplicates, and other issues.',
  })
  async analyzeDependencies(): Promise<string> {
    try {
      const analysis = await this.dependencyService.analyzeDependencies();

      let output = '🔍 Dependency Analysis\n\n';

      // Summary
      output += '📊 Summary:\n';
      output += `  Total dependencies: ${analysis.totalDependencies}\n`;
      output += `  Dev dependencies: ${analysis.totalDevDependencies}\n`;
      output += `  Peer dependencies: ${analysis.totalPeerDependencies}\n`;
      output += `  Internal dependencies: ${analysis.internalDependencies}\n`;
      output += `  External dependencies: ${analysis.externalDependencies}\n`;
      output += `  Workspace protocol usage: ${analysis.workspaceProtocolUsage}\n\n`;

      // Circular dependencies
      if (analysis.circularDependencies.length > 0) {
        output += '⚠️  Circular Dependencies:\n';
        for (const circular of analysis.circularDependencies) {
          output += `  • ${circular.path}\n`;
        }
        output += '\n';
      } else {
        output += '✅ No circular dependencies found\n\n';
      }

      // Duplicated versions
      if (Object.keys(analysis.duplicatedVersions).length > 0) {
        output += '⚠️  Duplicated Versions:\n';
        for (const [dep, versions] of Object.entries(
          analysis.duplicatedVersions,
        )) {
          output += `  • ${dep}: ${versions.join(', ')}\n`;
        }
        output += '\n';
      } else {
        output += '✅ No duplicated versions found\n\n';
      }

      // Unused dependencies
      if (analysis.unusedDependencies.length > 0) {
        output += '⚠️  Potentially Unused Dependencies:\n';
        for (const dep of analysis.unusedDependencies) {
          output += `  • ${dep}\n`;
        }
        output += '\n';
      }

      return output;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * Get the dependency graph
   */
  @Tool({
    name: 'get-dependency-graph',
    description:
      'Get the complete dependency graph for all packages in the repository.',
  })
  async getDependencyGraph(): Promise<string> {
    try {
      const graph = await this.dependencyService.getDependencyGraph();
      return JSON.stringify(graph, null, 2);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
}
