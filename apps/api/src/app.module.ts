import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { DatabaseModule } from "./core/modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { UserModule } from "./modules/user/user.module";
import { PushModule } from "./core/modules/push/push.module";
import { ORPCModule } from "@orpc/nest";
import { DATABASE_CONNECTION } from "./core/modules/database/database-connection";
import { AuthModule } from "./core/modules/auth/auth.module";
import { AuthService } from "./core/modules/auth/services/auth.service";
import { LoggerMiddleware } from "./core/middlewares/logger.middleware";
import { createBetterAuth } from "./config/auth/auth";
import { EnvService } from "./config/env/env.service";
import { EnvModule } from "./config/env/env.module";
import { REQUEST } from "@nestjs/core";
import { SmartCoercionPlugin } from "@orpc/json-schema";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import type { ORPCAuthContext } from "./core/modules/auth/orpc/types";
import { TestModule } from "./modules/test/test.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { AuthPlugin } from "./core/modules/auth/orpc/plugins/auth.plugin";
import { transformNestJSErrorToOrpcError, logOrpcErrors } from "./core/modules/auth/orpc/interceptors";

declare module "@orpc/nest" {
    /**
     * Extend oRPC global context to make it type-safe inside your handlers/middlewares
     * Index signatures (both string and symbol) allow compatibility with ORPC's internal
     * MergedInitialContext types which require full index signature compatibility.
     */
    interface ORPCGlobalContext {
        request: Request;
        auth: ORPCAuthContext;
        [key: string]: unknown;
        [key: symbol]: unknown;
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
            disableGlobalAuthGuard: true,
        }),
        HealthModule,
        UserModule,
        OrganizationModule,
        PushModule,
        TestModule,
        ORPCModule.forRootAsync({
            useFactory: (request: Request, authService: AuthService) => {
                const emptyAuthUtils = authService.createEmptyAuthUtils();

                return {
                    interceptors: [transformNestJSErrorToOrpcError(), logOrpcErrors()],
                    plugins: [
                        new SmartCoercionPlugin({
                            schemaConverters: [new ZodToJsonSchemaConverter()],
                        }),
                        // Auth plugin that populates context.auth with session data
                        new AuthPlugin({ auth: authService.instance }),
                    ],
                    // Initial context - auth will be populated by AuthPlugin
                    context: { request, auth: emptyAuthUtils },
                    eventIteratorKeepAliveInterval: 5000, // 5 seconds
                };
            },
            inject: [REQUEST, AuthService],
        }),
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes("*"); // Apply the logger middleware to all routes
    }
}
