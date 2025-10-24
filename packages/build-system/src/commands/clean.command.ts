/**
 * Clean command - cleans build outputs
 */

import { Command, CommandRunner } from 'nest-commander';
import { BuildService } from '../services/build.service';

@Command({
  name: 'clean',
  description: 'Clean build outputs for a package',
  arguments: '<package>',
  argsDescription: {
    package: 'Package name or path to clean',
  },
})
export class CleanCommand extends CommandRunner {
  constructor(private readonly buildService: BuildService) {
    super();
  }

  async run(passedParams: string[]): Promise<void> {
    const packagePath = passedParams[0];

    if (!packagePath) {
      console.error('Error: Package name or path is required');
      process.exit(1);
    }

    try {
      console.log(`Cleaning package: ${packagePath}`);
      await this.buildService.cleanPackage(packagePath);
      console.log('✓ Clean completed successfully');
    } catch (error) {
      console.error('Clean failed:', error.message);
      process.exit(1);
    }
  }
}
