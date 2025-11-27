import { Inject, Logger, Module } from "@nestjs/common";
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
                (o: { metatype }): o is InstanceWrapper<(new (...args: unknown[]) => unknown) & Record<string, (...args: unknown[]) => unknown>> => {
                    if (!o.metatype || typeof o.metatype !== 'function') return false;
                    return Reflect.getMetadata(HOOK_KEY, o.metatype as object) as boolean;
                }
            );

		const hasHookProviders = providers.length > 0;
		const hooksConfigured =
			'hooks' in this.options.auth.options && typeof this.options.auth.options.hooks === "object";

		if (hasHookProviders && !hooksConfigured)
			throw new Error(
				"Detected @Hook providers but Better Auth 'hooks' are not configured. Add 'hooks: {}' to your betterAuth(...) options.",
			);

		if (!hooksConfigured) return;

		for (const provider of providers) {
            const providerPrototype = Object.getPrototypeOf(provider.instance) as typeof provider.instance;
            const methods = this.metadataScanner.getAllMethodNames(providerPrototype);

            for (const method of methods) {
                const providerMethod = providerPrototype[method];
                if (providerMethod) {
                    this.setupHooks(providerMethod, provider.instance);
                }
            }
        }
	}

	configure(consumer: MiddlewareConsumer): void {
		const trustedOrigins = "trustedOrigins" in this.options.auth.options ? this.options.auth.options.trustedOrigins : null;
        // function-based trustedOrigins requires a Request (from web-apis) object to evaluate, which is not available in NestJS (we only have a express Request object)
        // if we ever need this, take a look at better-call which show an implementation for this
        const isNotFunctionBased = trustedOrigins && Array.isArray(trustedOrigins);

        if (!this.options.disableTrustedOriginsCors && isNotFunctionBased) {
            this.adapter.httpAdapter.enableCors({
                origin: trustedOrigins,
                methods: ["GET", "POST", "PUT", "DELETE"],
                credentials: true,
                allowedHeaders: ["Content-Type", "Authorization", "Cookie"], // Explicit headers
                exposedHeaders: ["Set-Cookie"], // Allow Set-Cookie to be read
            });
        } else if (trustedOrigins && !this.options.disableTrustedOriginsCors && !isNotFunctionBased)
            throw new Error("Function-based trustedOrigins not supported in NestJS. Use string array or disable CORS with disableTrustedOriginsCors: true.");

		// Get basePath from options or use default
        let basePath = "basePath" in this.options.auth.options && typeof this.options.auth.options.basePath === "string" ? this.options.auth.options.basePath : "/api/auth";

		// Ensure basePath starts with /
		if (!basePath.startsWith("/")) {
			basePath = `/${basePath}`;
		}

		// Ensure basePath doesn't end with /
		if (basePath.endsWith("/")) {
			basePath = basePath.slice(0, -1);
		}

		// Only apply body parsing middleware if NestJS global body parser is disabled
		// If bodyParser: true in main.ts, NestJS handles body parsing automatically
		if (!this.options.disableBodyParser) {
			consumer.apply(SkipBodyParsingMiddleware(basePath)).forRoutes("*path");
		}

		const handler = toNodeHandler(this.options.auth);
        this.adapter.httpAdapter
            .getInstance<{
                use: (path: string, handler: (req: Request, res: Response) => void | Promise<void>) => void;
            }>()
            // little hack to ignore any global prefix
            // for now i'll just not support a global prefix
            .use(`${basePath}/*path`, async (req: Request, res: Response) => {
                await handler(req, res);
            });
		this.logger.log(`AuthModule initialized BetterAuth on '${basePath}/*'`);
	}
    
    private setupHooks(providerMethod: (...args: unknown[]) => unknown, providerClass: new (...args: unknown[]) => unknown) {
        if (!("hooks" in this.options.auth.options) || typeof this.options.auth.options.hooks !== "object" || this.options.auth.options.hooks === null) return;

        for (const { metadataKey, hookType } of HOOKS) {
            const hookPath = Reflect.getMetadata(metadataKey, providerMethod) as string | undefined;
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
            this.options.auth.options.hooks[hookType] = createAuthMiddleware(async (ctx) => {
                if (originalHook) {
                    await originalHook(ctx);
                }

                if (hookPath === ctx.path) {
                    await providerMethod.apply(providerClass, [ctx]);
                }
            });
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
		options?: Omit<typeof OPTIONS_TYPE, "auth">,
	): DynamicModule;
	static forRoot(
		arg1: Auth | typeof OPTIONS_TYPE,
		arg2?: Omit<typeof OPTIONS_TYPE, "auth">,
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
