import { Controller, Logger, Inject, All, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { AUTH_INSTANCE_KEY } from "../types/symbols";
import type { Auth } from "@/core/modules/auth/types/auth";
import { Public } from "../decorators/decorators";

/**
 * Controller that handles all Better Auth routes using NestJS routing system
 */
@Controller('api/auth')
@Public()
export class AuthController {
	private readonly logger = new Logger(AuthController.name);
	private handler: ReturnType<typeof toNodeHandler>;

	constructor(@Inject(AUTH_INSTANCE_KEY) private readonly auth: Auth) {
		this.handler = toNodeHandler(this.auth)
	}

	/**
	 * Catch-all route that proxies all requests to Better Auth
	 * This replaces the problematic wildcard middleware approach
	 */
	@All('*')
	async handleAuth(@Req() req: Request, @Res() res: Response): Promise<void> {
		try {
			
			// Log the request for debugging
			this.logger.debug(`Handling auth request: ${req.method} ${req.url}`);
			
			// Proxy to Better Auth handler
			await this.handler(req, res);
		} catch (error) {
			this.logger.error('Error handling auth request:', error);

			throw new Error('Authentication request failed');
		}
	}
}