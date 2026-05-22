import { Injectable } from '@nestjs/common';
import { Tool, type Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { CommandService } from '../services/command.service.js';

@Injectable()
export class CommandToolsProvider {
  constructor(private readonly commandService: CommandService) {}

  @Tool({
    name: 'run-eslint',
    description: 'Run ESLint on the entire monorepo or a specific package',
    parameters: z.object({
      target: z.string().optional().describe('Target package name (optional)'),
    }),
  })
  async runEslint({ target }: { target?: string }, context: Context) {
    await context.reportProgress({ progress: 20, total: 100 });
    
    const result = await this.commandService.runEslint(target);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }

  @Tool({
    name: 'run-prettier',
    description: 'Run Prettier on the entire monorepo or a specific package',
    parameters: z.object({
      target: z.string().optional().describe('Target package name (optional)'),
    }),
  })
  async runPrettier({ target }: { target?: string }, context: Context) {
    await context.reportProgress({ progress: 20, total: 100 });
    
    const result = await this.commandService.runPrettier(target);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }

  @Tool({
    name: 'run-type-check',
    description: 'Run TypeScript type checking on the entire monorepo or a specific package',
    parameters: z.object({
      target: z.string().optional().describe('Target package name (optional)'),
    }),
  })
  async runTypeCheck({ target }: { target?: string }, context: Context) {
    await context.reportProgress({ progress: 20, total: 100 });
    
    const result = await this.commandService.runTypeCheck(target);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }

  @Tool({
    name: 'run-tests',
    description: 'Run tests on the entire monorepo or a specific package',
    parameters: z.object({
      target: z.string().optional().describe('Target package name (optional)'),
      coverage: z.boolean().optional().default(false).describe('Run with coverage'),
    }),
  })
  async runTests({ target, coverage }: { target?: string; coverage?: boolean }, context: Context) {
    await context.reportProgress({ progress: 20, total: 100 });
    
    const result = await this.commandService.runTests(target, coverage);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }

  @Tool({
    name: 'run-build',
    description: 'Build the entire monorepo or a specific package',
    parameters: z.object({
      target: z.string().optional().describe('Target package name (optional)'),
    }),
  })
  async runBuild({ target }: { target?: string }, context: Context) {
    await context.reportProgress({ progress: 10, total: 100 });
    
    const result = await this.commandService.runBuild(target);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }

  @Tool({
    name: 'run-custom-command',
    description: 'Run a custom shell command in the repository',
    parameters: z.object({
      command: z.string().describe('The command to execute'),
      cwd: z.string().optional().describe('Working directory relative to repo root'),
    }),
  })
  async runCustomCommand({ command, cwd }: { command: string; cwd?: string }, context: Context) {
    await context.reportProgress({ progress: 10, total: 100 });
    
    const result = await this.commandService.runCustomCommand(command, cwd);
    
    await context.reportProgress({ progress: 100, total: 100 });
    
    return JSON.stringify(result, null, 2);
  }
}
