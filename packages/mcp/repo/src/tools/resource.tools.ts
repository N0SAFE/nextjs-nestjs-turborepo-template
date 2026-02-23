import { Injectable } from '@nestjs/common';
import { Tool, type Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ResourceService } from '../services/resource.service.js';

@Injectable()
export class ResourceToolsProvider {
  constructor(private readonly resourceService: ResourceService) {}

  @Tool({
    name: 'get-package-json',
    description: 'Get package.json content for a specific app or package',
    parameters: z.object({
      name: z
        .string()
        .describe('Package name (e.g., web, api, ui/base, configs/eslint)'),
    }),
  })
  async getPackageJson({ name }: { name: string }, context: Context) {
    const pkg = await this.resourceService.getPackageJson(name);
    if (!pkg) {
      return `Package "${name}" not found`;
    }
    return JSON.stringify(pkg, null, 2);
  }

  @Tool({
    name: 'get-package-dependencies',
    description: 'Get all dependencies for a specific package',
    parameters: z.object({
      name: z
        .string()
        .describe('Package name (e.g., web, api, ui/base, configs/eslint)'),
    }),
  })
  async getPackageDependencies({ name }: { name: string }, context: Context) {
    const deps = await this.resourceService.getPackageDependencies(name);
    if (!deps) {
      return `Package "${name}" not found`;
    }
    return JSON.stringify(deps, null, 2);
  }

  @Tool({
    name: 'get-package-dependents',
    description: 'Get packages that depend on the specified package (reverse dependencies)',
    parameters: z.object({
      name: z
        .string()
        .describe('Package name (e.g., web, api, ui/base, configs/eslint)'),
    }),
  })
  async getPackageDependents({ name }: { name: string }, context: Context) {
    const dependents = await this.resourceService.getPackageDependents(name);
    return JSON.stringify(
      {
        package: name,
        dependents,
        count: dependents.length,
      },
      null,
      2,
    );
  }

  @Tool({
    name: 'get-package-scripts',
    description: 'Get scripts from package.json for a specific package',
    parameters: z.object({
      name: z
        .string()
        .describe('Package name (e.g., web, api, ui/base, configs/eslint)'),
    }),
  })
  async getPackageScripts({ name }: { name: string }, context: Context) {
    const scripts = await this.resourceService.getPackageScripts(name);
    if (!scripts) {
      return `Package "${name}" not found or has no scripts`;
    }
    return JSON.stringify(scripts, null, 2);
  }

  @Tool({
    name: 'get-package-files',
    description: 'Get file structure for a specific package with categorization',
    parameters: z.object({
      name: z
        .string()
        .describe('Package name (e.g., web, api, ui/base, configs/eslint)'),
    }),
  })
  async getPackageFiles({ name }: { name: string }, context: Context) {
    const files = await this.resourceService.getPackageFiles(name);
    if (!files) {
      return `Package "${name}" not found`;
    }
    return JSON.stringify(files, null, 2);
  }

  @Tool({
    name: 'get-agent-file',
    description: 'Get content of AGENTS.md file for a specific scope (root, app, or package)',
    parameters: z.object({
      scope: z
        .enum(['root', 'app', 'package'])
        .describe('Scope of the AGENTS.md file'),
      target: z
        .string()
        .optional()
        .describe('Target name (required for app/package scope, e.g., web, ui/base)'),
    }),
  })
  async getAgentFile(
    { scope, target }: { scope: 'root' | 'app' | 'package'; target?: string },
    context: Context,
  ) {
    if (scope !== 'root' && !target) {
      return 'Error: target is required for app and package scopes';
    }

    const agentFile = await this.resourceService.getAgentFile(scope, target);

    if (!agentFile) {
      return `AGENTS.md not found for ${scope}${target ? `: ${target}` : ''}`;
    }

    return agentFile.content;
  }
}
