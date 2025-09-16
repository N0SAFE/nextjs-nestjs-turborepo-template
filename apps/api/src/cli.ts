import { CommandFactory } from 'nest-commander';
import { CLIModule } from './cli/cli.module';

async function bootstrap() {
  await CommandFactory.run(CLIModule, {
    logger: ['error', 'warn'],
    errorHandler: (err: any) => {
      // Don't show error for help command exit
      if (err.code === 'commander.helpDisplayed') {
        process.exit(0);
      }
      console.error('CLI Error:', err);
      process.exit(1);
    },
  });
}

bootstrap();