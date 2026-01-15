/**
 * Injection tokens for CLI commands.
 * 
 * These tokens are used to inject services into nest-commander Command classes
 * using token-based dependency injection, which works reliably in the CLI context
 * where class-based injection fails due to design:paramtypes containing null
 * class references (Bun/ESM module hoisting issue).
 * 
 * NOTE: We use string tokens instead of Symbols because the @Inject() decorator
 * doesn't serialize Symbols properly into self:paramtypes metadata.
 */

export const DATABASE_SERVICE = 'DATABASE_SERVICE';
export const AUTH_CORE_SERVICE = 'AUTH_CORE_SERVICE';
export const CONFIG_SERVICE = 'CONFIG_SERVICE';
export const ENV_SERVICE = 'ENV_SERVICE';
export const CLI_AUTH_SERVICE_TOKEN = 'CLI_AUTH_SERVICE_TOKEN';

/**
 * @deprecated Use AUTH_CORE_SERVICE instead. AuthCoreService is a singleton that
 * contains all business logic and accepts headers as explicit parameters.
 * AuthService (request-scoped) wraps it and auto-injects headers from request.
 */
export const CLI_AUTH_SERVICE = 'CLI_AUTH_SERVICE';

/**
 * @deprecated Use AUTH_CORE_SERVICE instead. The main AuthService is REQUEST-scoped
 * and cannot be injected into CLI commands (no HTTP request context).
 */
export const AUTH_SERVICE = 'AUTH_SERVICE';
