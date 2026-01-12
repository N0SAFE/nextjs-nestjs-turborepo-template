/**
 * Isomorphic page wrapper module
 * 
 * This index.ts serves as the TypeScript entry point, re-exporting from server.tsx.
 * At runtime, the bundler uses package.json conditional exports:
 * - In RSC context (react-server condition): ./server.tsx is used
 * - In client context (default condition): ./client.tsx is used
 * 
 * This pattern follows React RFC #227 (Server Module Conventions).
 * The server.tsx exports a superset of types that TypeScript needs for type-checking.
 * 
 * @see https://github.com/reactjs/rfcs/blob/main/text/0227-server-module-conventions.md
 */
export * from './server'
