import type { ExecutionContext } from "@nestjs/common";
import type { Auth } from "../types/auth";

/**
 * Extracts the request object from either HTTP, GraphQL or WebSocket execution context
 * @param context - The execution context
 * @returns The request object
 */
export function getRequestFromContext(context: ExecutionContext) {
	const contextType = context.getType();
	if (contextType === "ws") {
		return context.switchToWs().getClient<Request & { session: {session: Auth['$Infer']['Session']['session'] , user?: Auth['$Infer']['Session']['user']} | null; user?: Auth['$Infer']['Session']['user'] }>();
	}

	return context.switchToHttp().getRequest<Request & { session: {session: Auth['$Infer']['Session']['session'] , user?: Auth['$Infer']['Session']['user']} | null; user?: Auth['$Infer']['Session']['user'] }>();
}