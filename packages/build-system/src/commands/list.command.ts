/**
 * List command - shows buildable packages
 */

import { Command, CommandRunner, Option } from 'nest-commander';
import { BuildService } from '../services/build.service';

interface ListCommandOptions {
  json?: boolean;
}

@Command({
  name: 'list',
  description: 'List all buildable packages in the workspace',
})
export class ListCommand extends CommandRunner {
  constructor(private readonly buildService: BuildService) {
    super();
  }

  async run(
    passedParams: string[],
    options: ListCommandOptions,
  ): Promise<void> {
    try {
      const packages = await this.buildService.listPackages();

      if (options.json) {
        console.log(JSON.stringify(packages, null, 2));
      } else {
        console.log('\nBuildable Packages:\n');
        for (const pkg of packages) {
          const status = pkg.supported ? '✓' : '✗';
          const builder = pkg.config?.builder || 'default';
          console.log(`  ${status} ${pkg.name}`);
          console.log(`    Path: ${pkg.path}`);
          console.log(`    Builder: ${builder}`);
          console.log(`    Supported: ${pkg.supported}`);
          console.log();
        }
        console.log(`Total: ${packages.length} package(s)`);
        console.log(
          `Buildable: ${packages.filter((p) => p.supported).length} package(s)`,
        );
      }
    } catch (error) {
      console.error('Failed to list packages:', error.message);
      process.exit(1);
    }
  }

  @Option({
    flags: '-j, --json',
    description: 'Output as JSON',
  })
  parseJson(): boolean {
    return true;
  }
}
