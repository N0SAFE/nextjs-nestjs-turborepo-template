import { Injectable } from '@nestjs/common';
import { Tool, type Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ScaffoldService } from '../services/scaffold.service.js';

@Injectable()
export class ScaffoldToolsProvider {
  constructor(private readonly scaffoldService: ScaffoldService) {}

  @Tool({
    name: 'scaffold-bin-package',
    description: 'Scaffold a new bin package (CLI tool) using NestJS and nest-commander',
    parameters: z.object({
      name: z.string().describe('Package name (without @repo/ prefix)'),
    }),
  })
  async scaffoldBinPackage({ name }: { name: string }, context: Context) {
    await context.reportProgress({ progress: 10, total: 100 });
    
    const result = await this.scaffoldService.scaffoldBinPackage(name);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }

  @Tool({
    name: 'scaffold-mcp-package',
    description: 'Scaffold a new MCP server package using @rekog/mcp-nest',
    parameters: z.object({
      name: z.string().describe('Package name (without @repo/ prefix)'),
    }),
  })
  async scaffoldMcpPackage({ name }: { name: string }, context: Context) {
    await context.reportProgress({ progress: 10, total: 100 });
    
    const result = await this.scaffoldService.scaffoldMcpPackage(name);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }

  @Tool({
    name: 'scaffold-config-package',
    description: 'Scaffold a new configuration package (eslint, prettier, etc.)',
    parameters: z.object({
      name: z.string().describe('Package name (without @repo-configs/ prefix)'),
    }),
  })
  async scaffoldConfigPackage({ name }: { name: string }, context: Context) {
    await context.reportProgress({ progress: 10, total: 100 });
    
    const result = await this.scaffoldService.scaffoldConfigPackage(name);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }

  @Tool({
    name: 'scaffold-ui-package',
    description: 'Scaffold a new UI component package with React and TypeScript',
    parameters: z.object({
      name: z.string().describe('Package name (without @repo/ prefix)'),
    }),
  })
  async scaffoldUiPackage({ name }: { name: string }, context: Context) {
    await context.reportProgress({ progress: 10, total: 100 });
    
    const result = await this.scaffoldService.scaffoldUiPackage(name);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }
}
