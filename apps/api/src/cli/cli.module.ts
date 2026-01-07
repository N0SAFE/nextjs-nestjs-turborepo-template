import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvModule } from '../config/env/env.module';
import { DatabaseModule } from '../core/modules/database/database.module';
import { AuthModule } from '../core/modules/auth/auth.module';
import { DATABASE_CONNECTION } from '../core/modules/database/database-connection';
import { SeedCommand } from './commands/seed.command';
import { MigrateCommand } from './commands/migrate.command';
import { ResetCommand } from './commands/reset.command';
import { CreateDefaultAdminCommand } from './commands/create-default-admin.command';
import { createBetterAuth } from '@/config/auth/auth';
import { EnvService } from '@/config/env/env.service';
import { DatabaseService } from '../core/modules/database/services/database.service';
import { AuthCoreService } from '../core/modules/auth/services/auth-core.service';
import { DATABASE_SERVICE, AUTH_CORE_SERVICE, CONFIG_SERVICE, ENV_SERVICE } from './tokens';

@Module({
  imports: [
    ConfigModule,
    EnvModule,
    DatabaseModule,
    AuthModule.forRootAsync({
      imports: [DatabaseModule, EnvModule],
      useFactory: createBetterAuth,
      inject: [DATABASE_CONNECTION, EnvService],
    }),
  ],
  providers: [
    SeedCommand,
    MigrateCommand,
    ResetCommand,
    CreateDefaultAdminCommand,
    // Token-based providers for CLI commands
    // Required because design:paramtypes shows [null] for class-based injection
    {
      provide: DATABASE_SERVICE,
      useExisting: DatabaseService,
    },
    {
      provide: AUTH_CORE_SERVICE,
      useExisting: AuthCoreService,
    },
    {
      provide: CONFIG_SERVICE,
      useExisting: ConfigService,
    },
    {
      provide: ENV_SERVICE,
      useExisting: EnvService,
    },
  ],
})
export class CLIModule {}