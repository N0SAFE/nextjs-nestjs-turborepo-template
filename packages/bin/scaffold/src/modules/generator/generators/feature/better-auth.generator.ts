/**
 * Better Auth Generator
 *
 * Sets up Better Auth for authentication with session management.
 * Integrates with NestJS and Next.js with complete auth module including:
 * - Guards (AuthGuard, RoleGuard)
 * - Decorators (AllowAnonymous, RequireRole, Session, etc.)
 * - Filters (APIErrorExceptionFilter)
 * - Middlewares (SkipBodyParsingMiddleware)
 * - Services (AuthService)
 * - Types and Symbols
 * - Access Control Utilities
 * - Module Definition with ConfigurableModuleBuilder
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class BetterAuthGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "better-auth",
    priority: 30,
    version: "2.0.0",
    description: "Better Auth authentication with complete NestJS auth module",
    contributesTo: [
      "apps/api/src/auth/**",
      "apps/api/src/core/modules/auth/**",
      "apps/web/src/lib/auth.ts",
    ],
    dependsOn: ["nestjs", "drizzle"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // ============================================
    // API Auth Configuration (root auth setup)
    // ============================================
    files.push(
      this.file("apps/api/src/auth.ts", this.getApiAuthConfig(), {
        mergeStrategy: "replace",
        priority: 30,
      }),
    );

    // ============================================
    // Auth Module - Main Module File
    // ============================================
    files.push(
      this.file(
        "apps/api/src/core/modules/auth/auth.module.ts",
        this.getAuthModule(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // ============================================
    // Auth Module - Types
    // ============================================
    files.push(
      this.file(
        "apps/api/src/core/modules/auth/types/auth.ts",
        this.getAuthTypes(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    files.push(
      this.file(
        "apps/api/src/core/modules/auth/types/symbols.ts",
        this.getSymbols(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // ============================================
    // Auth Module - Definitions
    // ============================================
    files.push(
      this.file(
        "apps/api/src/core/modules/auth/definitions/auth-module-definition.ts",
        this.getAuthModuleDefinition(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // ============================================
    // Auth Module - Guards
    // ============================================
    files.push(
      this.file(
        "apps/api/src/core/modules/auth/guards/auth.guard.ts",
        this.getAuthGuard(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    files.push(
      this.file(
        "apps/api/src/core/modules/auth/guards/role.guard.ts",
        this.getRoleGuard(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // ============================================
    // Auth Module - Decorators
    // ============================================
    files.push(
      this.file(
        "apps/api/src/core/modules/auth/decorators/decorators.ts",
        this.getDecorators(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // ============================================
    // Auth Module - Filters
    // ============================================
    files.push(
      this.file(
        "apps/api/src/core/modules/auth/filters/api-error-exception-filter.ts",
        this.getApiErrorExceptionFilter(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // ============================================
    // Auth Module - Middlewares
    // ============================================
    files.push(
      this.file(
        "apps/api/src/core/modules/auth/middlewares/middlewares.ts",
        this.getMiddlewares(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // ============================================
    // Auth Module - Services
    // ============================================
    files.push(
      this.file(
        "apps/api/src/core/modules/auth/services/auth.service.ts",
        this.getAuthService(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // ============================================
    // Auth Module - Utils
    // ============================================
    files.push(
      this.file(
        "apps/api/src/core/modules/auth/utils/index.ts",
        this.getUtilsIndex(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    files.push(
      this.file(
        "apps/api/src/core/modules/auth/utils/context.ts",
        this.getContextUtils(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    files.push(
      this.file(
        "apps/api/src/core/modules/auth/utils/access-control.utils.ts",
        this.getAccessControlUtils(),
        { mergeStrategy: "replace", priority: 30 },
      ),
    );

    // ============================================
    // Web Auth Client
    // ============================================
    if (this.hasPlugin(context, "nextjs")) {
      files.push(
        this.file(
          "apps/web/src/lib/auth.ts",
          this.getWebAuthClient(context),
          { mergeStrategy: "replace", priority: 30 },
        ),
      );

      files.push(
        this.file(
          "apps/web/src/lib/auth-client.ts",
          this.getWebAuthClientHook(),
          { mergeStrategy: "replace", priority: 30 },
        ),
      );
    }

    return files;
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    const deps: DependencySpec[] = [
      {
        name: "better-auth",
        version: "^1.2.0",
        type: "prod",
        target: "apps/api",
        pluginId: "better-auth",
      },
      {
        name: "express",
        version: "^4.21.0",
        type: "prod",
        target: "apps/api",
        pluginId: "better-auth",
      },
      {
        name: "@types/express",
        version: "^5.0.0",
        type: "dev",
        target: "apps/api",
        pluginId: "better-auth",
      },
    ];

    if (this.hasPlugin(context, "nextjs")) {
      deps.push({
        name: "better-auth",
        version: "^1.2.0",
        type: "prod",
        target: "apps/web",
        pluginId: "better-auth",
      });
    }

    return deps;
  }

  // ============================================
  // API Auth Configuration
  // ============================================
  private getApiAuthConfig(): string {
    return `import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/drizzle";

/**
 * Create the Better Auth instance with configuration
 */
export function createBetterAuth() {
  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ],
    // Enable hooks for NestJS integration
    hooks: {},
  });

  return { auth };
}

export const { auth } = createBetterAuth();

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];
`;
  }

  // ============================================
  // Auth Module - Main Module
  // ============================================
  private getAuthModule(): string {
    return `import { Inject, Logger, Module } from "@nestjs/common";
import type {
  DynamicModule,
  MiddlewareConsumer,
  NestModule,
  OnModuleInit,
} from "@nestjs/common";
import {
  DiscoveryModule,
  DiscoveryService,
  HttpAdapterHost,
  MetadataScanner,
} from "@nestjs/core";
import { toNodeHandler } from "better-auth/node";
import { createAuthMiddleware } from "better-auth/plugins";
import type { Request, Response } from "express";
import {
  type ASYNC_OPTIONS_TYPE,
  type AuthModuleOptions,
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  type OPTIONS_TYPE,
} from "./definitions/auth-module-definition";
import { AuthService } from "./services/auth.service";
import { SkipBodyParsingMiddleware } from "./middlewares/middlewares";
import { AFTER_HOOK_KEY, BEFORE_HOOK_KEY, HOOK_KEY } from "./types/symbols";
import { AuthGuard } from "./guards/auth.guard";
import { APP_GUARD } from "@nestjs/core";
import type { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import type { AuthContext, MiddlewareContext, MiddlewareOptions } from "better-auth";
import type { Auth } from "@/auth";

const HOOKS = [
  { metadataKey: BEFORE_HOOK_KEY, hookType: "before" as const },
  { metadataKey: AFTER_HOOK_KEY, hookType: "after" as const },
];

/**
 * NestJS module that integrates the Auth library with NestJS applications.
 * Provides authentication middleware, hooks, and exception handling.
 */
@Module({
  imports: [DiscoveryModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule
  extends ConfigurableModuleClass
  implements NestModule, OnModuleInit
{
  private readonly logger = new Logger(AuthModule.name);
  constructor(
    @Inject(DiscoveryService)
    private readonly discoveryService: DiscoveryService,
    @Inject(MetadataScanner)
    private readonly metadataScanner: MetadataScanner,
    @Inject(HttpAdapterHost)
    private readonly adapter: HttpAdapterHost,
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions,
  ) {
    super();
  }

  onModuleInit(): void {
    const providers = this.discoveryService
      .getProviders()
      .filter(
        (
          o: { metatype }
        ): o is InstanceWrapper<
          (new (...args: unknown[]) => unknown) &
            Record<string, (...args: unknown[]) => unknown>
        > => {
          if (!o.metatype || typeof o.metatype !== "function") return false;
          return Reflect.getMetadata(HOOK_KEY, o.metatype as object) as boolean;
        }
      );

    const hasHookProviders = providers.length > 0;
    const hooksConfigured =
      "hooks" in this.options.auth.options &&
      typeof this.options.auth.options.hooks === "object";

    if (hasHookProviders && !hooksConfigured)
      throw new Error(
        "Detected @Hook providers but Better Auth 'hooks' are not configured. Add 'hooks: {}' to your betterAuth(...) options."
      );

    if (!hooksConfigured) return;

    for (const provider of providers) {
      const providerPrototype = Object.getPrototypeOf(
        provider.instance
      ) as typeof provider.instance;
      const methods =
        this.metadataScanner.getAllMethodNames(providerPrototype);

      for (const method of methods) {
        const providerMethod = providerPrototype[method];
        if (providerMethod) {
          this.setupHooks(providerMethod, provider.instance);
        }
      }
    }
  }

  configure(consumer: MiddlewareConsumer): void {
    const trustedOrigins =
      "trustedOrigins" in this.options.auth.options
        ? this.options.auth.options.trustedOrigins
        : null;
    const isNotFunctionBased =
      trustedOrigins && Array.isArray(trustedOrigins);

    if (!this.options.disableTrustedOriginsCors && isNotFunctionBased) {
      this.adapter.httpAdapter.enableCors({
        origin: trustedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
        exposedHeaders: ["Set-Cookie"],
      });
    } else if (
      trustedOrigins &&
      !this.options.disableTrustedOriginsCors &&
      !isNotFunctionBased
    )
      throw new Error(
        "Function-based trustedOrigins not supported in NestJS. Use string array or disable CORS with disableTrustedOriginsCors: true."
      );

    let basePath =
      "basePath" in this.options.auth.options &&
      typeof this.options.auth.options.basePath === "string"
        ? this.options.auth.options.basePath
        : "/api/auth";

    if (!basePath.startsWith("/")) {
      basePath = \`/\${basePath}\`;
    }

    if (basePath.endsWith("/")) {
      basePath = basePath.slice(0, -1);
    }

    if (!this.options.disableBodyParser) {
      consumer.apply(SkipBodyParsingMiddleware(basePath)).forRoutes("*path");
    }

    const handler = toNodeHandler(this.options.auth);
    this.adapter.httpAdapter
      .getInstance<{
        use: (
          path: string,
          handler: (req: Request, res: Response) => void | Promise<void>
        ) => void;
      }>()
      .use(\`\${basePath}/*path\`, async (req: Request, res: Response) => {
        await handler(req, res);
      });
    this.logger.log(\`AuthModule initialized BetterAuth on '\${basePath}/*'\`);
  }

  private setupHooks(
    providerMethod: (...args: unknown[]) => unknown,
    providerClass: new (...args: unknown[]) => unknown
  ) {
    if (
      !("hooks" in this.options.auth.options) ||
      typeof this.options.auth.options.hooks !== "object" ||
      this.options.auth.options.hooks === null
    )
      return;

    for (const { metadataKey, hookType } of HOOKS) {
      const hookPath = Reflect.getMetadata(
        metadataKey,
        providerMethod
      ) as string | undefined;
      if (!hookPath) continue;

      const originalHook = this.options.auth.options.hooks[hookType] as
        | ((
            ctx: MiddlewareContext<
              MiddlewareOptions,
              AuthContext & {
                returned?: unknown;
                responseHeaders?: Headers;
              }
            >
          ) => Promise<void>)
        | undefined;
      this.options.auth.options.hooks[hookType] = createAuthMiddleware(
        async (ctx) => {
          if (originalHook) {
            await originalHook(ctx);
          }

          if (hookPath === ctx.path) {
            await providerMethod.apply(providerClass, [ctx]);
          }
        }
      );
    }
  }

  static forRootAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const forRootAsyncResult = super.forRootAsync(options);
    return {
      ...super.forRootAsync(options),
      providers: [
        ...(forRootAsyncResult.providers ?? []),
        ...(!options.disableGlobalAuthGuard
          ? [
              {
                provide: APP_GUARD,
                useClass: AuthGuard,
              },
            ]
          : []),
      ],
    };
  }

  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule;
  /**
   * @deprecated Use the object-based signature: AuthModule.forRoot({ auth, ...options })
   */
  static forRoot(
    auth: Auth,
    options?: Omit<typeof OPTIONS_TYPE, "auth">
  ): DynamicModule;
  static forRoot(
    arg1: Auth | typeof OPTIONS_TYPE,
    arg2?: Omit<typeof OPTIONS_TYPE, "auth">
  ): DynamicModule {
    const normalizedOptions: typeof OPTIONS_TYPE =
      typeof arg1 === "object" && "auth" in (arg1 as object)
        ? (arg1 as typeof OPTIONS_TYPE)
        : ({ ...(arg2 ?? {}), auth: arg1 as Auth } as typeof OPTIONS_TYPE);

    const forRootResult = super.forRoot(normalizedOptions);

    return {
      ...forRootResult,
      providers: [
        ...(forRootResult.providers ?? []),
        ...(!normalizedOptions.disableGlobalAuthGuard
          ? [
              {
                provide: APP_GUARD,
                useClass: AuthGuard,
              },
            ]
          : []),
      ],
    };
  }
}
`;
  }

  // ============================================
  // Auth Types
  // ============================================
  private getAuthTypes(): string {
    return `import type { createBetterAuth } from "@/auth";

export type Auth = ReturnType<typeof createBetterAuth>["auth"];

export type Session = Auth["$Infer"]["Session"];
`;
  }

  // ============================================
  // Symbols
  // ============================================
  private getSymbols(): string {
    return `export const BEFORE_HOOK_KEY = Symbol("BEFORE_HOOK");
export const AFTER_HOOK_KEY = Symbol("AFTER_HOOK");
export const HOOK_KEY = Symbol("HOOK");
export const AUTH_MODULE_OPTIONS_KEY = Symbol("AUTH_MODULE_OPTIONS");
`;
  }

  // ============================================
  // Auth Module Definition
  // ============================================
  private getAuthModuleDefinition(): string {
    return `import type { Auth } from "@/auth";
import { ConfigurableModuleBuilder } from "@nestjs/common";

export interface AuthModuleOptions<A = Auth> {
  auth: A;
  disableTrustedOriginsCors?: boolean;
  disableBodyParser?: boolean;
  disableGlobalAuthGuard?: boolean;
}

export const MODULE_OPTIONS_TOKEN = Symbol("AUTH_MODULE_OPTIONS");

export const { ConfigurableModuleClass, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<AuthModuleOptions>({
    optionsInjectionToken: MODULE_OPTIONS_TOKEN,
  })
    .setClassMethodName("forRoot")
    .setExtras(
      {
        isGlobal: true,
        disableTrustedOriginsCors: false,
        disableBodyParser: false,
        disableGlobalAuthGuard: false,
      },
      (def, extras) => {
        return {
          ...def,
          exports: [MODULE_OPTIONS_TOKEN],
          global: extras.isGlobal,
        };
      }
    )
    .build();
`;
  }

  // ============================================
  // Auth Guard
  // ============================================
  private getAuthGuard(): string {
    return `import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { CanActivate, ContextType, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "http";
import { getRequestFromContext } from "../utils/context";
import {
  MODULE_OPTIONS_TOKEN,
  type AuthModuleOptions,
} from "../definitions/auth-module-definition";

export const AuthErrorType = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
} as const;

export const AuthContextErrorMap: Record<
  Exclude<ContextType, "ws">,
  Record<keyof typeof AuthErrorType, (args?: unknown) => Error>
> = {
  http: {
    UNAUTHORIZED: (args) =>
      new UnauthorizedException(
        args ?? {
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        }
      ),
    FORBIDDEN: (args) =>
      new ForbiddenException(
        args ?? {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        }
      ),
  },
  rpc: {
    UNAUTHORIZED: () => new Error("UNAUTHORIZED"),
    FORBIDDEN: () => new Error("FORBIDDEN"),
  },
};

/**
 * NestJS guard that handles authentication for protected routes
 * Can be configured with @Public() or @Optional() decorators to modify authentication behavior
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions
  ) {}

  /**
   * Validates if the current request is authenticated
   * Attaches session and user information to the request object
   * @param context - The execution context of the current request
   * @returns True if the request is authorized to proceed, throws an error otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = getRequestFromContext(context);

    const session = await this.options.auth.api.getSession({
      headers: fromNodeHeaders(
        request.headers as unknown as IncomingHttpHeaders
      ),
    });

    request.session = session;
    request.user = session?.user;

    const isPublic = this.reflector.getAllAndOverride<boolean>("PUBLIC", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isOptional = this.reflector.getAllAndOverride<boolean>("OPTIONAL", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isOptional && !session) {
      return true;
    }

    const ctxType = context.getType<Exclude<ContextType, "ws">>();

    if (!session) {
      throw AuthContextErrorMap[ctxType].UNAUTHORIZED();
    }
    return true;
  }
}
`;
  }

  // ============================================
  // Role Guard
  // ============================================
  private getRoleGuard(): string {
    return `import { Inject, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Auth } from "@/auth";
import { APIError } from "better-auth/api";
import {
  MODULE_OPTIONS_TOKEN,
  type AuthModuleOptions,
} from "../definitions/auth-module-definition";

/**
 * Permission and Role types - customize these for your application
 */
export type RoleName = string;
export type Permission = Record<string, string[]>;

/**
 * Permission checker utilities
 */
export const PermissionChecker = {
  getUserRoles(userRole: string): RoleName[] {
    // Parse role string - customize based on your role format
    return userRole ? [userRole] : [];
  },

  hasRole(userRole: string, requiredRole: RoleName): boolean {
    const roles = this.getUserRoles(userRole);
    return roles.includes(requiredRole);
  },

  validatePermission(_permission: Permission): boolean {
    return true; // Customize validation logic
  },
};

/**
 * NestJS guard that handles role and permission-based access control
 * for protected routes using Better Auth admin plugin.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & {
        session: {
          session: Auth["$Infer"]["Session"]["session"];
          user?: Auth["$Infer"]["Session"]["user"];
        };
        user?: Auth["$Infer"]["Session"]["user"];
      }
    >();

    const session = request.session;

    const requiredRoles = this.reflector.getAllAndOverride<RoleName[] | null>(
      "REQUIRED_ROLES",
      [context.getHandler(), context.getClass()]
    );

    const requiredAllRoles = this.reflector.getAllAndOverride<
      RoleName[] | null
    >("REQUIRED_ALL_ROLES", [context.getHandler(), context.getClass()]);

    const requiredPermissions = this.reflector.getAllAndOverride<
      Permission | null
    >("REQUIRED_PERMISSIONS", [context.getHandler(), context.getClass()]);

    const hasAnyReflectorRequirements =
      (requiredRoles && requiredRoles.length > 0) ??
      (requiredAllRoles && requiredAllRoles.length > 0) ??
      requiredPermissions;

    if (!hasAnyReflectorRequirements) {
      return true;
    }

    if (!session.user) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: "Authentication required for this resource",
      });
    }

    const user = session.user;
    const userRole = (user as { role?: string }).role;

    if (!userRole) {
      throw new APIError(500, {
        code: "INTERNAL_SERVER_ERROR",
        message: "User role information is missing",
      });
    }

    if ((requiredRoles || requiredAllRoles) && !userRole) {
      throw new APIError(403, {
        code: "FORBIDDEN",
        message: "No role assigned to user",
      });
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = PermissionChecker.getUserRoles(userRole);
      const hasRequiredRole = requiredRoles.some((role) =>
        PermissionChecker.hasRole(userRole, role)
      );

      if (!hasRequiredRole) {
        throw new APIError(403, {
          code: "FORBIDDEN",
          message: \`Access denied. Required roles: \${requiredRoles.join(", ")}. User roles: \${userRoles.join(", ")}\`,
        });
      }
    }

    if (requiredAllRoles && requiredAllRoles.length > 0) {
      const hasAllRequiredRoles = requiredAllRoles.every((role) =>
        PermissionChecker.hasRole(userRole, role)
      );

      if (!hasAllRequiredRoles) {
        const userRoles = PermissionChecker.getUserRoles(userRole);
        throw new APIError(403, {
          code: "FORBIDDEN",
          message: \`Access denied. All required roles: \${requiredAllRoles.join(", ")}. User roles: \${userRoles.join(", ")}\`,
        });
      }
    }

    if (requiredPermissions) {
      if (!PermissionChecker.validatePermission(requiredPermissions)) {
        throw new APIError(500, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid permission configuration",
        });
      }

      try {
        const authApi = this.options.auth.api as {
          userHasPermission?: (opts: {
            body: { userId: string; permissions: Permission };
          }) => Promise<{ success: boolean }>;
        };

        if (authApi.userHasPermission) {
          const hasPermission = await authApi.userHasPermission({
            body: {
              userId: user.id,
              permissions: requiredPermissions,
            },
          });

          if (!hasPermission.success) {
            throw new APIError(403, {
              code: "FORBIDDEN",
              message: \`Access denied. Missing required permissions: \${JSON.stringify(requiredPermissions)}\`,
            });
          }
        }
      } catch (error) {
        if (error instanceof APIError) {
          throw error;
        }

        console.error("Permission check failed:", error);
        throw new APIError(500, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Permission validation failed",
        });
      }
    }

    return true;
  }

  static hasRole(userRole: string, requiredRole: RoleName): boolean {
    return PermissionChecker.hasRole(userRole, requiredRole);
  }

  static getUserRoles(userRole: string): RoleName[] {
    return PermissionChecker.getUserRoles(userRole);
  }
}
`;
  }

  // ============================================
  // Decorators
  // ============================================
  private getDecorators(): string {
    return `import { createParamDecorator, SetMetadata } from "@nestjs/common";
import type { CustomDecorator, ExecutionContext } from "@nestjs/common";
import type { createAuthMiddleware } from "better-auth/api";
import { AFTER_HOOK_KEY, BEFORE_HOOK_KEY, HOOK_KEY } from "../types/symbols";
import { getRequestFromContext } from "../utils/context";

// Re-export types from role guard for convenience
export type { RoleName, Permission } from "../guards/role.guard";
import { type RoleName, type Permission, PermissionChecker } from "../guards/role.guard";

/**
 * Allows unauthenticated (anonymous) access to a route or controller.
 * When applied, the AuthGuard will not perform authentication checks.
 */
export const AllowAnonymous = (): CustomDecorator =>
  SetMetadata("PUBLIC", true);

/**
 * Marks a route or controller as having optional authentication.
 * When applied, the AuthGuard allows the request to proceed
 * even if no session is present.
 */
export const OptionalAuth = (): CustomDecorator =>
  SetMetadata("OPTIONAL", true);

/**
 * @deprecated Use AllowAnonymous() instead.
 */
export const Public = AllowAnonymous;

/**
 * @deprecated Use OptionalAuth() instead.
 */
export const Optional = OptionalAuth;

/**
 * Parameter decorator that extracts the user session from the request.
 * Provides easy access to the authenticated user's session data in controller methods.
 * Works with both HTTP and GraphQL execution contexts.
 */
export const Session: ReturnType<typeof createParamDecorator> =
  createParamDecorator(
    (_data: unknown, context: ExecutionContext): unknown => {
      const request = getRequestFromContext(context);
      return request.session;
    }
  );

/**
 * Represents the context object passed to hooks.
 */
export type AuthHookContext = Parameters<
  Parameters<typeof createAuthMiddleware>[0]
>[0];

/**
 * Registers a method to be executed before a specific auth route is processed.
 * @param path - The auth route path that triggers this hook (must start with '/')
 */
export const BeforeHook = (path?: \`/\${string}\`): CustomDecorator<symbol> =>
  SetMetadata(BEFORE_HOOK_KEY, path);

/**
 * Registers a method to be executed after a specific auth route is processed.
 * @param path - The auth route path that triggers this hook (must start with '/')
 */
export const AfterHook = (path?: \`/\${string}\`): CustomDecorator<symbol> =>
  SetMetadata(AFTER_HOOK_KEY, path);

/**
 * Class decorator that marks a provider as containing hook methods.
 * Must be applied to classes that use BeforeHook or AfterHook decorators.
 */
export const Hook = (): ClassDecorator => SetMetadata(HOOK_KEY, true);

// ===== PERMISSION-BASED ACCESS CONTROL DECORATORS =====

/**
 * Specifies the roles required to access a route or controller.
 * The user must have ANY of the specified roles to access the resource.
 */
export const RequireRole = (...roles: RoleName[]): CustomDecorator =>
  SetMetadata("REQUIRED_ROLES", roles);

/**
 * Specifies that the user must have ALL of the specified roles.
 */
export const RequireAllRoles = (...roles: RoleName[]): CustomDecorator =>
  SetMetadata("REQUIRED_ALL_ROLES", roles);

/**
 * Specifies the exact permissions required to access a route or controller.
 */
export const RequirePermissions = (permissions: Permission): CustomDecorator =>
  SetMetadata("REQUIRED_PERMISSIONS", permissions);

/**
 * Combines role and permission requirements.
 * The user must have the specified role AND the specified permissions.
 */
export const RequireRoleAndPermissions = (
  role: RoleName,
  permissions: Permission
): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol | undefined,
    descriptor: PropertyDescriptor
  ) => {
    if (propertyKey === undefined) {
      throw new Error(
        "RequireRoleAndPermissions can only be applied to methods"
      );
    }

    RequireRole(role)(target, propertyKey, descriptor);
    RequirePermissions(permissions)(target, propertyKey, descriptor);
    return descriptor;
  };
};

/**
 * Parameter decorator that extracts the user's roles from the request.
 */
export const UserRoles: ReturnType<typeof createParamDecorator> =
  createParamDecorator(
    (_data: unknown, context: ExecutionContext): RoleName[] => {
      const request = context.switchToHttp().getRequest<
        Request & {
          session: { user?: { role?: string } };
          user?: { role?: string };
        }
      >();
      const user = request.user;

      if (!user?.role) {
        return [];
      }

      return PermissionChecker.getUserRoles(user.role);
    }
  );

/**
 * Parameter decorator that extracts the current user with their role information.
 */
export const AuthenticatedUser: ReturnType<typeof createParamDecorator> =
  createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<
      Request & {
        session: { user?: { role?: string; id: string } };
        user?: { role?: string };
      }
    >();
    const session = request.session;
    const user = request.user;

    if (!session.user) {
      return null;
    }

    const roles = user?.role ? PermissionChecker.getUserRoles(user.role) : [];

    return {
      ...session.user,
      role: user?.role ?? null,
      roles,
    };
  });
`;
  }

  // ============================================
  // API Error Exception Filter
  // ============================================
  private getApiErrorExceptionFilter(): string {
    return `import type { ArgumentsHost } from "@nestjs/common";
import { Catch } from "@nestjs/common";
import type { ExceptionFilter } from "@nestjs/common";
import { APIError } from "better-auth/api";
import type { Response } from "express";

@Catch(APIError)
export class APIErrorExceptionFilter implements ExceptionFilter {
  catch(exception: APIError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.statusCode;
    const message = exception.body?.message;

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
`;
  }

  // ============================================
  // Middlewares
  // ============================================
  private getMiddlewares(): string {
    return `import type { NextFunction, Request, Response } from "express";
import * as express from "express";

/**
 * Factory that returns a Nest middleware which skips body parsing for the
 * configured basePath.
 */
export function SkipBodyParsingMiddleware(basePath = "/api/auth") {
  const jsonParser = express.json();
  const urlencodedParser = express.urlencoded({ extended: true });

  return (req: Request, res: Response, next: NextFunction): void => {
    const requestPath = req.url || req.path || "";
    const isAuthRoute = requestPath.startsWith(basePath);

    if (isAuthRoute) {
      next();
      return;
    }

    jsonParser(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }

      urlencodedParser(req, res, (parseErr) => {
        if (parseErr) {
          next(parseErr);
          return;
        }
        next();
      });
    });
  };
}
`;
  }

  // ============================================
  // Auth Service
  // ============================================
  private getAuthService(): string {
    return `import { Inject, Injectable } from "@nestjs/common";
import type { Auth } from "@/auth";
import {
  type AuthModuleOptions,
  MODULE_OPTIONS_TOKEN,
} from "../definitions/auth-module-definition";

/**
 * NestJS service that provides access to the Better Auth instance
 * Use generics to support auth instances extended by plugins
 */
@Injectable()
export class AuthService<T extends { api: T["api"] } = Auth> {
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions<T>
  ) {}

  /**
   * Returns the API endpoints provided by the auth instance
   */
  get api(): T["api"] {
    return this.options.auth.api;
  }

  /**
   * Returns the complete auth instance
   * Access this for plugin-specific functionality
   */
  get instance(): T {
    return this.options.auth;
  }
}
`;
  }

  // ============================================
  // Utils Index
  // ============================================
  private getUtilsIndex(): string {
    return `/**
 * Auth utilities module exports
 *
 * This module provides utilities for authentication and access control:
 * - Context utilities for extracting request information
 * - Access control utilities for flexible role and permission checks
 */

// Context utilities
export * from "./context";

// Access control utilities
export * from "./access-control.utils";
`;
  }

  // ============================================
  // Context Utils
  // ============================================
  private getContextUtils(): string {
    return `import type { ExecutionContext } from "@nestjs/common";
import type { Auth } from "../types/auth";

/**
 * Extracts the request object from either HTTP, GraphQL or WebSocket execution context
 * @param context - The execution context
 * @returns The request object
 */
export function getRequestFromContext(context: ExecutionContext) {
  const contextType = context.getType();
  if (contextType === "ws") {
    return context.switchToWs().getClient<
      Request & {
        session: {
          session: Auth["$Infer"]["Session"]["session"];
          user?: Auth["$Infer"]["Session"]["user"];
        } | null;
        user?: Auth["$Infer"]["Session"]["user"];
      }
    >();
  }

  return context.switchToHttp().getRequest<
    Request & {
      session: {
        session: Auth["$Infer"]["Session"]["session"];
        user?: Auth["$Infer"]["Session"]["user"];
      } | null;
      user?: Auth["$Infer"]["Session"]["user"];
    }
  >();
}
`;
  }

  // ============================================
  // Access Control Utils
  // ============================================
  private getAccessControlUtils(): string {
    return `import type { ExecutionContext } from "@nestjs/common";
import { APIError } from "better-auth/api";
import type { Auth } from "../types/auth";
import { type RoleName, type Permission, PermissionChecker } from "../guards/role.guard";

/**
 * Type for request with session
 */
export type RequestWithSession = Request & {
  session: Auth["$Infer"]["Session"] | null;
  user?: Auth["$Infer"]["Session"]["user"];
};

/**
 * Options for role checking
 */
export interface RoleCheckOptions {
  throwOnFail?: boolean;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * Options for permission checking
 */
export interface PermissionCheckOptions extends RoleCheckOptions {
  validateStructure?: boolean;
}

/**
 * Result type for access control checks
 */
export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
  userRoles?: RoleName[];
}

/**
 * Access control utilities for flexible role and permission-based access control
 */
export class AccessControlUtils {
  static getUserFromContext(
    context: ExecutionContext
  ): Auth["$Infer"]["Session"]["user"] | undefined {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithSession>();
    return request.session?.user;
  }

  static getUserRoleFromContext(
    context: ExecutionContext
  ): string | undefined {
    const user = this.getUserFromContext(context);
    return (user as { role?: string } | undefined)?.role ?? undefined;
  }

  static getUserRolesFromContext(context: ExecutionContext): RoleName[] {
    const userRole = this.getUserRoleFromContext(context);
    if (!userRole) return [];
    return PermissionChecker.getUserRoles(userRole);
  }

  static isAuthenticated(context: ExecutionContext): boolean {
    const user = this.getUserFromContext(context);
    return !!user;
  }

  static requireAuth(
    context: ExecutionContext,
    errorMessage?: string
  ): Auth["$Infer"]["Session"]["user"] {
    const user = this.getUserFromContext(context);
    if (!user) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: errorMessage ?? "Authentication required",
      });
    }
    return user;
  }
}

/**
 * Check if user has ANY of the specified roles
 */
export function allowRoles(
  context: ExecutionContext,
  roles: RoleName[],
  options: RoleCheckOptions = {}
): AccessControlResult {
  const { throwOnFail = true, errorMessage, errorCode = "FORBIDDEN" } = options;

  const user = AccessControlUtils.getUserFromContext(context);

  if (!user) {
    const reason = "User not authenticated";
    if (throwOnFail) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  const userRole = (user as { role?: string }).role;
  if (!userRole) {
    const reason = "User has no role assigned";
    if (throwOnFail) {
      throw new APIError(403, {
        code: errorCode,
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  const userRoles = PermissionChecker.getUserRoles(userRole);
  const hasAnyRole = roles.some((role) =>
    PermissionChecker.hasRole(userRole, role)
  );

  if (!hasAnyRole) {
    const reason = \`User lacks required roles. Required: \${roles.join(", ")}. User has: \${userRoles.join(", ")}\`;
    if (throwOnFail) {
      throw new APIError(403, {
        code: errorCode,
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason, userRoles };
  }

  return { allowed: true, userRoles };
}

/**
 * Check if user has ALL of the specified roles
 */
export function allowAllRoles(
  context: ExecutionContext,
  roles: RoleName[],
  options: RoleCheckOptions = {}
): AccessControlResult {
  const { throwOnFail = true, errorMessage, errorCode = "FORBIDDEN" } = options;

  const user = AccessControlUtils.getUserFromContext(context);

  if (!user) {
    const reason = "User not authenticated";
    if (throwOnFail) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  const userRole = (user as { role?: string }).role;
  if (!userRole) {
    const reason = "User has no role assigned";
    if (throwOnFail) {
      throw new APIError(403, {
        code: errorCode,
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  const userRoles = PermissionChecker.getUserRoles(userRole);
  const hasAllRoles = roles.every((role) =>
    PermissionChecker.hasRole(userRole, role)
  );

  if (!hasAllRoles) {
    const reason = \`User must have all roles. Required: \${roles.join(", ")}. User has: \${userRoles.join(", ")}\`;
    if (throwOnFail) {
      throw new APIError(403, {
        code: errorCode,
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason, userRoles };
  }

  return { allowed: true, userRoles };
}

/**
 * Check if user DOES NOT have any of the specified roles
 */
export function denyRoles(
  context: ExecutionContext,
  roles: RoleName[],
  options: RoleCheckOptions = {}
): AccessControlResult {
  const { throwOnFail = true, errorMessage, errorCode = "FORBIDDEN" } = options;

  const user = AccessControlUtils.getUserFromContext(context);

  if (!user) {
    const reason = "User not authenticated";
    if (throwOnFail) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  const userRole = (user as { role?: string }).role;
  if (!userRole) {
    return { allowed: true };
  }

  const userRoles = PermissionChecker.getUserRoles(userRole);
  const hasDeniedRole = roles.some((role) =>
    PermissionChecker.hasRole(userRole, role)
  );

  if (hasDeniedRole) {
    const reason = \`User has forbidden roles. Forbidden: \${roles.join(", ")}. User has: \${userRoles.join(", ")}\`;
    if (throwOnFail) {
      throw new APIError(403, {
        code: errorCode,
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason, userRoles };
  }

  return { allowed: true, userRoles };
}

/**
 * Check if user has the required permissions
 */
export async function allowPermissions(
  context: ExecutionContext,
  auth: Auth,
  permissions: Permission,
  options: PermissionCheckOptions = {}
): Promise<AccessControlResult> {
  const {
    throwOnFail = true,
    errorMessage,
    errorCode = "FORBIDDEN",
    validateStructure = true,
  } = options;

  const user = AccessControlUtils.getUserFromContext(context);

  if (!user) {
    const reason = "User not authenticated";
    if (throwOnFail) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  if (validateStructure && !PermissionChecker.validatePermission(permissions)) {
    const reason = "Invalid permission structure";
    if (throwOnFail) {
      throw new APIError(500, {
        code: "INTERNAL_SERVER_ERROR",
        message: reason,
      });
    }
    return { allowed: false, reason };
  }

  try {
    const authApi = auth.api as {
      userHasPermission?: (opts: {
        body: { userId: string; permissions: Permission };
      }) => Promise<{ success: boolean }>;
    };

    if (authApi.userHasPermission) {
      const hasPermission = await authApi.userHasPermission({
        body: {
          userId: user.id,
          permissions,
        },
      });

      if (!hasPermission.success) {
        const reason = \`User lacks required permissions: \${JSON.stringify(permissions)}\`;
        if (throwOnFail) {
          throw new APIError(403, {
            code: errorCode,
            message: errorMessage ?? reason,
          });
        }
        return { allowed: false, reason };
      }
    }

    return { allowed: true };
  } catch (error) {
    if (error instanceof APIError && !throwOnFail) {
      return { allowed: false, reason: error.message };
    }
    throw error;
  }
}

/**
 * Check if user is the resource owner or has admin access
 */
export function allowOwnerOrAdmin(
  context: ExecutionContext,
  resourceOwnerId: string,
  adminRoles: RoleName[] = ["admin", "superAdmin"],
  options: RoleCheckOptions = {}
): AccessControlResult {
  const user = AccessControlUtils.getUserFromContext(context);

  if (!user) {
    const reason = "User not authenticated";
    if (options.throwOnFail !== false) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: options.errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  if (user.id === resourceOwnerId) {
    return { allowed: true };
  }

  return allowRoles(context, adminRoles, options);
}

/**
 * Custom access control with a predicate function
 */
export function customAccess(
  context: ExecutionContext,
  predicate: (user: Auth["$Infer"]["Session"]["user"]) => boolean,
  options: RoleCheckOptions = {}
): AccessControlResult {
  const user = AccessControlUtils.getUserFromContext(context);

  if (!user) {
    const reason = "User not authenticated";
    if (options.throwOnFail !== false) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: options.errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  const allowed = predicate(user);

  if (!allowed) {
    const reason = "Custom access check failed";
    if (options.throwOnFail !== false) {
      throw new APIError(403, {
        code: options.errorCode ?? "FORBIDDEN",
        message: options.errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  return { allowed: true };
}
`;
  }

  // ============================================
  // Web Auth Client
  // ============================================
  private getWebAuthClient(context: GeneratorContext): string {
    const apiUrl = `http://localhost:${context.projectConfig.ports.api || 3001}`;

    return `import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "${apiUrl}",
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
`;
  }

  // ============================================
  // Web Auth Client Hook
  // ============================================
  private getWebAuthClientHook(): string {
    return `"use client";

import { useSession } from "./auth";

export function useAuth() {
  const { data: session, isPending } = useSession();

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
  };
}
`;
  }
}
