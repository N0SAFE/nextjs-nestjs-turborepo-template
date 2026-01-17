import { Injectable } from '@nestjs/common';
import { Tool, type Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PackageService } from '../services/package.service.js';

@Injectable()
export class PackageToolsProvider {
  constructor(private readonly packageService: PackageService) {}

  @Tool({
    name: 'list-apps',
    description: 'List all applications in the monorepo',
    parameters: z.object({}),
  })
  async listApps(_args: unknown, context: Context) {
    const apps = await this.packageService.listApps();
    return JSON.stringify(apps, null, 2);
  }

  @Tool({
    name: 'list-packages',
    description: 'List all packages in the monorepo',
    parameters: z.object({}),
  })
  async listPackages(_args: unknown, context: Context) {
    const packages = await this.packageService.listPackages();
    return JSON.stringify(packages, null, 2);
  }

  @Tool({
    name: 'get-package-info',
    description: 'Get detailed information about a specific package by name',
    parameters: z.object({
      name: z.string().describe('Package name (e.g., @repo/ui, web, api)'),
    }),
  })
  async getPackageInfo({ name }: { name: string }, context: Context) {
    const info = await this.packageService.getPackageInfo(name);
    if (!info) {
      return `Package "${name}" not found`;
    }
    return JSON.stringify(info, null, 2);
  }

  @Tool({
    name: 'create-package',
    description: 'Create a new package in the monorepo',
    parameters: z.object({
      type: z.enum(['configs', 'bin', 'mcp', 'ui', 'contracts', 'types'])
        .describe('Type of package to create'),
      name: z.string().describe('Name of the package'),
    }),
  })
  async createPackage(
    { type, name }: { type: 'configs' | 'bin' | 'mcp' | 'ui' | 'contracts' | 'types'; name: string },
    context: Context
  ) {
    await context.reportProgress({ progress: 10, total: 100 });
    
    const result = await this.packageService.createPackage(type, name);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }
}
