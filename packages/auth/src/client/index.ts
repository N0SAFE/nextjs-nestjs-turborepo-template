// Export the client factory
export { createAuthClientFactory } from "./auth-client";
export type { CreateAuthClientFactoryOptions } from "./auth-client";

// Export client plugins
export { default as masterTokenClient } from "./plugins/masterToken";
export { loginAsClientPlugin } from "./plugins/loginAs";

// Export guards
export * from "./plugins/guards";

// Re-export plugin utilities
export * from "./plugins/masterToken/state";
export type { MasterTokenActions } from "./plugins/masterToken/guard";

// Export components
export { MasterTokenProvider, useMasterToken } from "./plugins/masterToken/components/provider";
