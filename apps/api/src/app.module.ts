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
import { AuthService } from "./core/modules/auth/services/auth.service";
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
import type { ORPCAuthContext } from "./core/modules/auth/orpc/types";

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
      useFactory: (request: Request, authService: AuthService) => {
        // Create auth middleware that will populate context.auth
        const authMiddleware = authService.createOrpcAuthMiddleware();
        const emptyAuthUtils = authService.createEmptyAuthUtils();

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
          // Initial context - auth will be added by global middleware
          context: { request, auth: emptyAuthUtils },
          // Global middleware that runs on all procedures
          middlewares: [authMiddleware],
          eventIteratorKeepAliveInterval: 5000, // 5 seconds
        };
      },
      inject: [REQUEST, AuthService],
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
