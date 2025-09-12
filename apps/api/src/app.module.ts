import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';
import { DevAuthModule } from './dev-auth/dev-auth.module';
import { onError, ORPCModule } from '@orpc/nest';
import { DATABASE_CONNECTION } from './db/database-connection';
import {AuthModule} from './auth/auth.module'

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    UserModule,
    DevAuthModule,
    AuthModule.forRootAsync({
      imports: [DatabaseModule],
      useFactory: betterAuthFactory,
      inject: [DATABASE_CONNECTION],
    }),
    ORPCModule.forRoot({
      interceptors: [
        onError((error, ctx) => {
          console.error('oRPC Error:', JSON.stringify(error), JSON.stringify(ctx));
        }),
      ],
      eventIteratorKeepAliveInterval: 5000, // 5 seconds
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*'); // Apply the logger middleware to all routes
  }
}

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response } from 'express';
import { betterAuthFactory } from './auth';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: Function) {
        const { ip, method, originalUrl: url  } = req;
        const hostname = require('os').hostname();
        const userAgent = req.get('user-agent') || '';
        const referer = req.get('referer') || '';

        res.on('close', () => {
            const { statusCode, statusMessage } = res;
            const contentLength = res.get('content-length');
            Logger.debug(`[${hostname}] "${method} ${url}" ${statusCode} ${statusMessage} ${contentLength} "${referer}" "${userAgent}" "${ip}"`);
        });

        next();
    }
}