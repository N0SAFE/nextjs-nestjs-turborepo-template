import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from './env/env';
import { EnvModule } from './env/env.module';
import * as path from 'path';

@Module({
  imports: [
    NestConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '..', '..', '.env'),
      ],
    }),
    EnvModule,
  ],
  exports: [NestConfigModule, EnvModule],
})
export class ConfigModule {}