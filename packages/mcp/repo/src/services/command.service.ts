import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

@Injectable()
export class CommandService {
  private readonly repoRoot = process.cwd();

  async runEslint(target?: string): Promise<CommandResult> {
    try {
      const cmd = target 
        ? `bun run lint --filter=${target}`
        : `bun run lint`;
      
      const { stdout, stderr } = await execAsync(cmd, { cwd: this.repoRoot });
      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  async runPrettier(target?: string): Promise<CommandResult> {
    try {
      const cmd = target 
        ? `bun run format --filter=${target}`
        : `bun run format`;
      
      const { stdout, stderr } = await execAsync(cmd, { cwd: this.repoRoot });
      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  async runTypeCheck(target?: string): Promise<CommandResult> {
    try {
      const cmd = target 
        ? `bun run type-check --filter=${target}`
        : `bun run type-check`;
      
      const { stdout, stderr } = await execAsync(cmd, { cwd: this.repoRoot });
      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  async runTests(target?: string, coverage = false): Promise<CommandResult> {
    try {
      const cmd = coverage
        ? `bun run test:coverage${target ? ` --filter=${target}` : ''}`
        : `bun run test${target ? ` --filter=${target}` : ''}`;
      
      const { stdout, stderr } = await execAsync(cmd, { cwd: this.repoRoot });
      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  async runBuild(target?: string): Promise<CommandResult> {
    try {
      const cmd = target 
        ? `bun run build --filter=${target}`
        : `bun run build`;
      
      const { stdout, stderr } = await execAsync(cmd, { cwd: this.repoRoot });
      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  async runCustomCommand(command: string, cwd?: string): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: cwd ? join(this.repoRoot, cwd) : this.repoRoot 
      });
      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }
}
