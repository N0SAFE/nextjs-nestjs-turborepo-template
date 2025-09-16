import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration, configValidationSchema } from './app.config';
import * as path from 'path';

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '..', '..', '.env'),
      ],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}