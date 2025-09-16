import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../core/modules/database/database.module';
import { AuthModule } from '../core/modules/auth/auth.module';
import { DATABASE_CONNECTION } from '../core/modules/database/database-connection';
import { SeedCommand } from './commands/seed.command';
import { MigrateCommand } from './commands/migrate.command';
import { ResetCommand } from './commands/reset.command';
import { betterAuthFactory } from '@/config/auth/auth';
import { EnvService } from '@/config/env/env.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule.forRootAsync({
      imports: [DatabaseModule, ConfigModule],
      useFactory: betterAuthFactory,
      inject: [DATABASE_CONNECTION, EnvService],
    }),
  ],
  providers: [
    SeedCommand,
    MigrateCommand,
    ResetCommand,
  ],
})
export class CLIModule {}