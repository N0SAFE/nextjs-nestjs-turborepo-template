/**
 * Build command - executes package builds
 */

import { Command, CommandRunner, Option } from 'nest-commander';
import { BuildService } from '../services/build.service';
import { BuildOptions } from '../types';

interface BuildCommandOptions {
  clean?: boolean;
  target?: 'development' | 'production' | 'test';
  json?: boolean;
  verbose?: boolean;
  watch?: boolean;
}

@Command({
  name: 'build',
  description: 'Build a package',
  arguments: '<package>',
  argsDescription: {
    package: 'Package name or path to build',
  },
})
export class BuildCommand extends CommandRunner {
  constructor(private readonly buildService: BuildService) {
    super();
  }

  async run(
    passedParams: string[],
    options: BuildCommandOptions,
  ): Promise<void> {
    const packagePath = passedParams[0];

    if (!packagePath) {
      console.error('Error: Package name or path is required');
      process.exit(1);
    }

    const buildOptions: BuildOptions = {
      package: packagePath,
      clean: options.clean,
      target: options.target || 'production',
      format: options.json ? 'json' : 'text',
      verbose: options.verbose,
      watch: options.watch,
    };

    try {
      if (options.watch) {
        // Watch mode: continuously rebuild on file changes
        await this.runWatchMode(packagePath, buildOptions);
      } else {
        // Single build mode
        await this.runSingleBuild(packagePath, buildOptions, options);
      }
    } catch (error) {
      console.error('Build failed:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  private async runSingleBuild(
    packagePath: string,
    buildOptions: BuildOptions,
    options: BuildCommandOptions,
  ): Promise<void> {
    if (options.verbose) {
      console.log(`Building package: ${packagePath}`);
      console.log(`Options:`, buildOptions);
    }

    const result = await this.buildService.buildPackage(
      packagePath,
      buildOptions,
    );

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\nBuild ${result.status === 'success' ? '✓' : '✗'} ${result.status}`);
      console.log(`Duration: ${result.durationMs}ms`);
      console.log(`Exit code: ${result.exitCode}`);
      console.log(`Artifacts: ${result.artifacts.length} file(s)`);

      if (result.errors && result.errors.length > 0) {
        console.log('\nErrors:');
        for (const error of result.errors) {
          console.log(`  - ${error.message}`);
        }
      }

      if (options.verbose && result.artifacts.length > 0) {
        console.log('\nArtifacts:');
        for (const artifact of result.artifacts) {
          console.log(`  - ${artifact.path} (${artifact.size} bytes)`);
        }
      }
    }

    process.exit(result.exitCode);
  }

  private async runWatchMode(
    packagePath: string,
    buildOptions: BuildOptions,
  ): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const chokidar = await import('chokidar');

    console.log(`👀 Watching ${packagePath} for changes...`);
    console.log('Press Ctrl+C to stop\n');

    // Initial build
    await this.buildInWatchMode(packagePath, buildOptions);

    // Resolve package path
    const resolvedPath = path.isAbsolute(packagePath)
      ? packagePath
      : path.resolve(process.cwd(), packagePath);

    // Watch for file changes
    const watcher = chokidar.watch(
      [
        path.join(resolvedPath, 'src/**/*'),
        path.join(resolvedPath, '*.ts'),
        path.join(resolvedPath, '*.tsx'),
        path.join(resolvedPath, '*.js'),
        path.join(resolvedPath, '*.jsx'),
        path.join(resolvedPath, 'build.config.ts'),
      ],
      {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.git/**',
          '**/*.lock',
        ],
        ignoreInitial: true,
        persistent: true,
      },
    );

    let buildTimeout: NodeJS.Timeout | null = null;
    const debouncedBuild = () => {
      if (buildTimeout) {
        clearTimeout(buildTimeout);
      }
      buildTimeout = setTimeout(async () => {
        console.log('\n🔨 File changed, rebuilding...\n');
        await this.buildInWatchMode(packagePath, buildOptions);
      }, 100);
    };

    watcher
      .on('change', (file) => {
        console.log(`📝 Changed: ${path.relative(resolvedPath, file)}`);
        debouncedBuild();
      })
      .on('add', (file) => {
        console.log(`➕ Added: ${path.relative(resolvedPath, file)}`);
        debouncedBuild();
      })
      .on('unlink', (file) => {
        console.log(`🗑️  Removed: ${path.relative(resolvedPath, file)}`);
        debouncedBuild();
      })
      .on('error', (error) => {
        console.error('Watcher error:', error);
      });

    // Keep process alive
    await new Promise(() => {});
  }

  private async buildInWatchMode(
    packagePath: string,
    buildOptions: BuildOptions,
  ): Promise<void> {
    const startTime = Date.now();
    try {
      const result = await this.buildService.buildPackage(
        packagePath,
        buildOptions,
      );

      const duration = Date.now() - startTime;
      const statusIcon = result.status === 'success' ? '✅' : '❌';
      console.log(`${statusIcon} Build ${result.status} in ${duration}ms`);
      console.log(`   Artifacts: ${result.artifacts.length} file(s)`);

      if (result.errors && result.errors.length > 0) {
        console.log('\n❌ Errors:');
        for (const error of result.errors) {
          console.log(`   - ${error.message}`);
        }
      }

      console.log('👀 Watching for changes...\n');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      console.log('👀 Watching for changes...\n');
    }
  }

  @Option({
    flags: '-c, --clean',
    description: 'Clean build (ignore cache)',
  })
  parseClean(): boolean {
    return true;
  }

  @Option({
    flags: '-t, --target <target>',
    description: 'Build target (development, production, test)',
  })
  parseTarget(val: string): string {
    return val;
  }

  @Option({
    flags: '-j, --json',
    description: 'Output as JSON',
  })
  parseJson(): boolean {
    return true;
  }

  @Option({
    flags: '-v, --verbose',
    description: 'Verbose output',
  })
  parseVerbose(): boolean {
    return true;
  }

  @Option({
    flags: '-w, --watch',
    description: 'Watch mode - rebuild on file changes',
  })
  parseWatch(): boolean {
    return true;
  }
}
