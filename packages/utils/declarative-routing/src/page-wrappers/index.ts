/**
 * @repo/declarative-routing/page-wrappers
 * 
 * This file serves as the default entry point when the bundler/runtime
 * doesn't support React Server Components conditional exports.
 * 
 * It re-exports from the client implementation since that's the safe default.
 * 
 * For proper server/client separation, use the conditional exports:
 * - Server components: Import from 'page-wrappers' (react-server condition)
 * - Client components: Import from 'page-wrappers' (default)
 * 
 * The package.json exports handle this automatically:
 * {
 *   "./page-wrappers": {
 *     "react-server": "./dist/page-wrappers/server.js",
 *     "default": "./dist/page-wrappers/client.js"
 *   }
 * }
 */

// Default to client exports (safe for all environments)
export * from './client.js'
