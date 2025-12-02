import { ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { CanActivate, ContextType, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "http";
import { getRequestFromContext } from "../utils/context";
import { MODULE_OPTIONS_TOKEN, type AuthModuleOptions } from "../definitions/auth-module-definition";


export const AuthErrorType = {
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
} as const;

export const AuthContextErrorMap: Record<
	Exclude<ContextType, 'ws'>, // omit ws since we do not handle websocket yet
	Record<keyof typeof AuthErrorType, (args?: unknown) => Error>
> = {
	http: {
		UNAUTHORIZED: (args) =>
			new UnauthorizedException(
				args ?? {
					code: "UNAUTHORIZED",
					message: "Unauthorized",
				},
			),
		FORBIDDEN: (args) =>
			new ForbiddenException(
				args ?? {
					code: "FORBIDDEN",
					message: "Insufficient permissions",
				},
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
		private readonly options: AuthModuleOptions,
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
				(request.headers || (request as any)?.handshake?.headers || []) as unknown as IncomingHttpHeaders
			),
		});

		request.session = session;
		request.user = session?.user ?? null; // useful for observability tools like Sentry

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

		const ctxType = context.getType<Exclude<ContextType, 'ws'>>();

		if (!session) {
			throw AuthContextErrorMap[ctxType].UNAUTHORIZED();
		}
		return true;
	}
}
