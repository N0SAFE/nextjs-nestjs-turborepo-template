import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from "@nestjs/common";
import { DatabaseModule } from "./core/modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { UserModule } from "./modules/user/user.module";
import { PushModule } from "./core/modules/push/push.module";
import { onError, ORPCModule } from "@orpc/nest";
import { DATABASE_CONNECTION } from "./core/modules/database/database-connection";
import { AuthModule } from "./core/modules/auth/auth.module";
import { LoggerMiddleware } from "./core/middlewares/logger.middleware";
import { createBetterAuth } from "./config/auth/auth";
import { EnvService } from "./config/env/env.service";
import { EnvModule } from "./config/env/env.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./core/modules/auth/guards/auth.guard";
import { RoleGuard } from "./core/modules/auth/guards/role.guard";
import { REQUEST } from '@nestjs/core'
import {
  experimental_SmartCoercionPlugin as SmartCoercionPlugin
} from '@orpc/json-schema'
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createAuthMiddleware } from "./core/modules/orpc-auth";
import type { ORPCAuthContext } from "./core/modules/orpc-auth";
import { auth } from "./auth";

declare module '@orpc/nest' {
  /**
   * Extend oRPC global context to make it type-safe inside your handlers/middlewares
   */
  interface ORPCGlobalContext {
    request: Request;
    auth: ORPCAuthContext;
  }
}

@Module({
  imports: [
    EnvModule,
    DatabaseModule,
    AuthModule.forRootAsync({
      imports: [DatabaseModule, EnvModule],
      useFactory: createBetterAuth,
      inject: [DATABASE_CONNECTION, EnvService],
      disableBodyParser: false,
    }),
    HealthModule,
    UserModule,
    PushModule,
    ORPCModule.forRootAsync({
      useFactory: (request: Request) => {
        // Create auth middleware that will populate context.auth
        const authMiddleware = createAuthMiddleware(auth);

        return {
          interceptors: [
            onError((error, _ctx) => {
              console.error(
                "oRPC Error:",
                error
              );
            })
          ],
          plugins: [
            new SmartCoercionPlugin({
              schemaConverters: [
                new ZodToJsonSchemaConverter()
              ]
            })
          ],
          // The context starts with just request
          // Auth middleware will add the auth property
          context: { request },
          // Global middleware that runs on all procedures
          middlewares: [authMiddleware as any],
          eventIteratorKeepAliveInterval: 5000, // 5 seconds
        };
      },
      inject: [REQUEST],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*"); // Apply the logger middleware to all routes
  }
}
