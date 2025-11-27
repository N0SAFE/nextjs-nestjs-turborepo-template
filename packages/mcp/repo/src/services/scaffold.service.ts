import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

export interface ScaffoldResult {
  success: boolean;
  path: string;
  message: string;
  files?: string[];
}

@Injectable()
export class ScaffoldService {
  private readonly repoRoot = process.cwd();

  async scaffoldBinPackage(name: string): Promise<ScaffoldResult> {
    const packagePath = join(this.repoRoot, 'packages', 'bin', name);

    try {
      // Create directory
      await mkdir(packagePath, { recursive: true });

      // Run nest new command
      const { stdout, stderr } = await execAsync(
        `cd ${packagePath} && bun x @nestjs/cli new . --skip-git --package-manager bun`,
        { cwd: packagePath }
      );

      // Install nest-commander
      await execAsync(`cd ${packagePath} && bun add nest-commander`, { 
        cwd: packagePath 
      });

      // Update package.json
      const packageJson = {
        name: `@repo-bin/${name}`,
        version: '1.0.0',
        private: true,
        type: 'module',
        main: 'dist/main.js',
        bin: {
          [name]: './dist/main.js'
        },
        scripts: {
          build: 'bun --bun nest build',
          dev: 'bun --bun nest start --watch',
          start: 'bun --bun dist/main.js',
          'type-check': 'tsc --noEmit',
          test: 'vitest run',
          'test:watch': 'vitest',
        }
      };

      await writeFile(
        join(packagePath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      return {
        success: true,
        path: packagePath,
        message: `Binary package scaffolded at ${packagePath}`,
        files: ['package.json', 'src/', 'nest-cli.json', 'tsconfig.json'],
      };
    } catch (error) {
      return {
        success: false,
        path: packagePath,
        message: `Failed to scaffold package: ${error.message}`,
      };
    }
  }

  async scaffoldMcpPackage(name: string): Promise<ScaffoldResult> {
    const packagePath = join(this.repoRoot, 'packages', 'mcp', name);

    try {
      // Create directory
      await mkdir(packagePath, { recursive: true });

      // Run nest new command
      await execAsync(
        `cd ${packagePath} && bun x @nestjs/cli new . --skip-git --package-manager bun`,
        { cwd: packagePath }
      );

      // Install MCP dependencies
      await execAsync(
        `cd ${packagePath} && bun add @rekog/mcp-nest @modelcontextprotocol/sdk zod`,
        { cwd: packagePath }
      );

      return {
        success: true,
        path: packagePath,
        message: `MCP server scaffolded at ${packagePath}`,
        files: ['package.json', 'src/', 'nest-cli.json', 'tsconfig.json'],
      };
    } catch (error) {
      return {
        success: false,
        path: packagePath,
        message: `Failed to scaffold MCP package: ${error.message}`,
      };
    }
  }

  async scaffoldConfigPackage(name: string): Promise<ScaffoldResult> {
    const packagePath = join(this.repoRoot, 'packages', 'configs', name);

    try {
      await mkdir(packagePath, { recursive: true });

      const packageJson = {
        name: `@repo-configs/${name}`,
        version: '1.0.0',
        private: true,
        type: 'module',
        main: 'index.ts',
        exports: {
          '.': './index.ts',
        },
      };

      await writeFile(
        join(packagePath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      await writeFile(
        join(packagePath, 'index.ts'),
        `// ${name} configuration\nexport default {};\n`
      );

      return {
        success: true,
        path: packagePath,
        message: `Config package created at ${packagePath}`,
        files: ['package.json', 'index.ts'],
      };
    } catch (error) {
      return {
        success: false,
        path: packagePath,
        message: `Failed to create config package: ${error.message}`,
      };
    }
  }

  async scaffoldUiPackage(name: string): Promise<ScaffoldResult> {
    const packagePath = join(this.repoRoot, 'packages', 'ui', name);

    try {
      await mkdir(join(packagePath, 'components'), { recursive: true });

      const packageJson = {
        name: `@repo/ui-${name}`,
        version: '1.0.0',
        private: true,
        type: 'module',
        main: 'index.ts',
        exports: {
          '.': './index.ts',
        },
        scripts: {
          'type-check': 'tsc --noEmit',
          test: 'vitest run',
        },
      };

      await writeFile(
        join(packagePath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      await writeFile(
        join(packagePath, 'index.ts'),
        `// Export UI components\nexport {};\n`
      );

      return {
        success: true,
        path: packagePath,
        message: `UI package created at ${packagePath}`,
        files: ['package.json', 'index.ts', 'components/'],
      };
    } catch (error) {
      return {
        success: false,
        path: packagePath,
        message: `Failed to create UI package: ${error.message}`,
      };
    }
  }
}
