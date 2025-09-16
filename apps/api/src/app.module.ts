import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./core/modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { UserModule } from "./modules/user/user.module";
import { onError, ORPCModule } from "@orpc/nest";
import { DATABASE_CONNECTION } from "./core/modules/database/database-connection";
import { AuthModule } from "./core/modules/auth/auth.module";
import { LoggerMiddleware } from "./core/middlewares/logger.middleware";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./core/modules/auth/guards/auth.guard";
import { betterAuthFactory } from "./config/auth/auth";
import { EnvService } from "./config/env/env.service";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    UserModule,
    AuthModule.forRootAsync({
      imports: [DatabaseModule, ConfigModule],
      useFactory: betterAuthFactory,
      inject: [DATABASE_CONNECTION, EnvService],
    }),
    ORPCModule.forRoot({
      interceptors: [
        onError((error, ctx) => {
          console.error(
            "oRPC Error:",
            JSON.stringify(error),
            JSON.stringify(ctx)
          );
        }),
      ],
      eventIteratorKeepAliveInterval: 5000, // 5 seconds
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*"); // Apply the logger middleware to all routes
  }
}
