import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from "@nestjs/common";
import { DatabaseModule } from "./core/modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { UserModule } from "./modules/user/user.module";
import { onError, ORPCModule } from "@orpc/nest";
import { DATABASE_CONNECTION } from "./core/modules/database/database-connection";
import { AuthModule } from "./core/modules/auth/auth.module";
import { LoggerMiddleware } from "./core/middlewares/logger.middleware";
import { betterAuthFactory } from "./config/auth/auth";
import { EnvService } from "./config/env/env.service";
import { EnvModule } from "./config/env/env.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./core/modules/auth/guards/auth.guard";
import { RoleGuard } from "./core/modules/auth/guards/role.guard";
import { REQUEST } from '@nestjs/core'

@Module({
  imports: [
    EnvModule,
    DatabaseModule,
    AuthModule.forRootAsync({
      imports: [DatabaseModule, EnvModule],
      useFactory: betterAuthFactory,
      inject: [DATABASE_CONNECTION, EnvService],
    }),
    HealthModule,
    UserModule,
    ORPCModule.forRootAsync({
      useFactory: (request: Request) => ({
        interceptors: [
          onError((error, ctx) => {
            console.error(
              "oRPC Error:",
              JSON.stringify(error),
              JSON.stringify(ctx)
            );
          })
        ],
        context: { request },
        eventIteratorKeepAliveInterval: 5000, // 5 seconds
      }),
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
