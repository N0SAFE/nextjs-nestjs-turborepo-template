import type { NextFunction, Request, Response } from "express";
import * as express from "express";

/**
 * Factory that returns a Nest middleware which skips body parsing for the
 * configured basePath.
 */
export function SkipBodyParsingMiddleware(basePath = "/api/auth") {
	// Create the parsers once, outside the middleware function
	const jsonParser = express.json();
	const urlencodedParser = express.urlencoded({ extended: true });

	return (req: Request, res: Response, next: NextFunction): void => {
		// Check if this is a Better Auth route
		const requestPath = req.url || req.path || '';
		const isAuthRoute = requestPath.startsWith(basePath);
		
		// Skip body parsing for better-auth routes - they need raw body
		if (isAuthRoute) {
			next();
			return;
		}
		
		// Parse JSON first
		jsonParser(req, res, (err) => {
			if (err) {
				next(err);
				return;
			}
			
			// Then parse urlencoded
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
