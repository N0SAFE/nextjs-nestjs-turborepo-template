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
    };

    try {
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
    } catch (error) {
      console.error('Build failed:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
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
}
