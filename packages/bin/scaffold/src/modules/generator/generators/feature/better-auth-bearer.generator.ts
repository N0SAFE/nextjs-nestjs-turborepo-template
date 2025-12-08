/**
 * Better Auth Bearer Token Generator
 *
 * Sets up Bearer token authentication for Better Auth.
 * Enables token-based authentication for mobile apps, API clients,
 * and third-party integrations instead of cookie-based sessions.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class BetterAuthBearerGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "better-auth-bearer",
    priority: 35, // After OAuth providers
    version: "1.0.0",
    description: "Bearer token authentication for API access without cookies",
    contributesTo: [
      "apps/api/src/auth/**",
      "apps/web/src/lib/**",
      "apps/web/src/hooks/**",
    ],
    dependsOn: ["better-auth"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // API: Bearer token plugin configuration
    files.push(
      this.file(
        "apps/api/src/auth/plugins/bearer.ts",
        this.getBearerPluginConfig(),
        { mergeStrategy: "replace", priority: 35 },
      ),
    );

    // API: Bearer token validation middleware
    files.push(
      this.file(
        "apps/api/src/auth/middleware/bearer-auth.middleware.ts",
        this.getBearerMiddleware(),
        { mergeStrategy: "replace", priority: 35 },
      ),
    );

    // API: Update auth plugins index to include Bearer
    files.push(
      this.file(
        "apps/api/src/auth/plugins/index.ts",
        this.getPluginsIndex(context),
        { mergeStrategy: "replace", priority: 35 },
      ),
    );

    // Web: Bearer token utilities if Next.js is enabled
    if (this.hasPlugin(context, "nextjs")) {
      // Token storage utilities
      files.push(
        this.file(
          "apps/web/src/lib/bearer-token.ts",
          this.getBearerTokenUtils(),
          { mergeStrategy: "replace", priority: 35 },
        ),
      );

      // Bearer auth client configuration
      files.push(
        this.file(
          "apps/web/src/lib/auth-bearer-client.ts",
          this.getBearerAuthClient(),
          { mergeStrategy: "replace", priority: 35 },
        ),
      );

      // Bearer token hook
      files.push(
        this.file(
          "apps/web/src/hooks/use-bearer-token.ts",
          this.getBearerTokenHook(),
          { mergeStrategy: "replace", priority: 35 },
        ),
      );

      // Bearer auth provider for API requests
      files.push(
        this.file(
          "apps/web/src/providers/bearer-auth-provider.tsx",
          this.getBearerAuthProvider(),
          { mergeStrategy: "replace", priority: 35 },
        ),
      );

      // Types for bearer token auth
      files.push(
        this.file(
          "apps/web/src/types/bearer.ts",
          this.getBearerTypes(),
          { mergeStrategy: "replace", priority: 35 },
        ),
      );
    }

    // Environment example for Bearer configuration
    files.push(
      this.file(
        "apps/api/.env.bearer.example",
        this.getEnvExample(),
        { mergeStrategy: "replace", priority: 35 },
      ),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // Bearer plugin is built into better-auth, no additional dependencies needed
    return [];
  }

  private getBearerPluginConfig(): string {
    return `/**
 * Better Auth Bearer Token Plugin Configuration
 *
 * Enables authentication using Bearer tokens instead of cookies.
 * Useful for:
 * - Mobile applications
 * - Third-party API integrations
 * - Microservice-to-microservice communication
 * - Testing and development tools
 *
 * Configuration Options:
 * - requireSignature: Require tokens to be signed (more secure)
 *
 * Token Flow:
 * 1. Client signs in via /api/auth/sign-in/email or OAuth
 * 2. Response includes "set-auth-token" header
 * 3. Client stores token and sends it in Authorization header
 * 4. Server validates token using auth.api.getSession()
 */
import { bearer } from "better-auth/plugins";

export interface BearerPluginOptions {
  /**
   * Require the bearer token to be signed.
   * When true, only signed tokens from the server are accepted.
   * @default false
   */
  requireSignature?: boolean;
}

/**
 * Get Bearer plugin configuration
 */
export function getBearerPlugin(options: BearerPluginOptions = {}) {
  return bearer({
    requireSignature: options.requireSignature ?? false,
  });
}

/**
 * Default Bearer plugin instance for auth configuration
 */
export const bearerPlugin = getBearerPlugin({
  requireSignature: process.env.BEARER_REQUIRE_SIGNATURE === "true",
});

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7); // Remove "Bearer " prefix
}

/**
 * Check if Bearer authentication is enabled
 */
export function isBearerAuthEnabled(): boolean {
  return process.env.BEARER_AUTH_ENABLED !== "false";
}

/**
 * Format token for Authorization header
 */
export function formatBearerHeader(token: string): string {
  return \`Bearer \${token}\`;
}
`;
  }

  private getBearerMiddleware(): string {
    return `/**
 * Bearer Authentication Middleware
 *
 * NestJS middleware for validating Bearer token authentication.
 * Can be used alongside or instead of cookie-based session auth.
 */
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { auth } from "../auth";
import { extractBearerToken, isBearerAuthEnabled } from "../plugins/bearer";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    emailVerified?: boolean;
  };
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
  };
}

@Injectable()
export class BearerAuthMiddleware implements NestMiddleware {
  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Skip if Bearer auth is disabled
    if (!isBearerAuthEnabled()) {
      return next();
    }

    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    // If no Bearer token, continue (might use cookie auth)
    if (!token) {
      return next();
    }

    try {
      // Validate token using Better Auth
      const session = await auth.api.getSession({
        headers: req.headers as unknown as Headers,
      });

      if (session?.user) {
        // Attach user and session to request
        req.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name ?? undefined,
          role: (session.user as { role?: string }).role,
          emailVerified: session.user.emailVerified ?? false,
        };
        req.session = {
          id: session.session.id,
          userId: session.session.userId,
          expiresAt: new Date(session.session.expiresAt),
          token: session.session.token,
        };
      }
    } catch (error) {
      // Token invalid, continue without auth (let guards handle it)
      console.warn("Bearer token validation failed:", error);
    }

    next();
  }
}

/**
 * Factory for creating Bearer auth middleware with custom options
 */
export function createBearerMiddleware(options?: {
  skipPaths?: string[];
  onAuthError?: (error: Error, req: Request) => void;
}) {
  const skipPaths = options?.skipPaths ?? ["/health", "/api/auth"];

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check if path should be skipped
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return next();
    }

    try {
      const session = await auth.api.getSession({
        headers: req.headers as unknown as Headers,
      });

      if (session?.user) {
        req.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name ?? undefined,
          role: (session.user as { role?: string }).role,
          emailVerified: session.user.emailVerified ?? false,
        };
        req.session = {
          id: session.session.id,
          userId: session.session.userId,
          expiresAt: new Date(session.session.expiresAt),
          token: session.session.token,
        };
      }
    } catch (error) {
      options?.onAuthError?.(error as Error, req);
    }

    next();
  };
}
`;
  }

  private getPluginsIndex(context: GeneratorContext): string {
    const hasAdmin = this.hasPlugin(context, "better-auth-admin");

    let imports = `import { bearerPlugin, getBearerPlugin, isBearerAuthEnabled, extractBearerToken, formatBearerHeader } from "./bearer";`;
    let exports = `export { bearerPlugin, getBearerPlugin, isBearerAuthEnabled, extractBearerToken, formatBearerHeader } from "./bearer";`;
    let pluginsList = `  // Bearer token authentication\n  bearerPlugin,`;
    let enabledList = `  { id: "bearer", name: "Bearer Token Auth", enabled: isBearerAuthEnabled() },`;

    if (hasAdmin) {
      imports = `import { adminPlugin, getAdminPlugin, isAdminEnabled } from "./admin";\n${imports}`;
      exports = `export { adminPlugin, getAdminPlugin, isAdminEnabled } from "./admin";\n${exports}`;
      pluginsList = `  // Admin functionality\n  adminPlugin,\n${pluginsList}`;
      enabledList = `  { id: "admin", name: "Admin", enabled: isAdminEnabled() },\n${enabledList}`;
    }

    return `/**
 * Better Auth Plugins Index
 *
 * Aggregates all configured Better Auth plugins.
 */

${imports}

${exports}

/**
 * Get all enabled Better Auth plugins
 */
export function getEnabledPlugins() {
  return [
${pluginsList}
  ].filter(Boolean);
}

/**
 * Plugin IDs for type safety
 */
export type BetterAuthPluginId = "bearer" | "admin" | "organization" | "two-factor";

/**
 * Check which plugins are available
 */
export function getAvailablePlugins(): { id: BetterAuthPluginId; name: string; enabled: boolean }[] {
  return [
${enabledList}
  ];
}
`;
  }

  private getBearerTokenUtils(): string {
    return `/**
 * Bearer Token Utilities
 *
 * Client-side utilities for managing Bearer authentication tokens.
 * Supports localStorage, sessionStorage, and in-memory storage.
 */

const TOKEN_KEY = "auth_bearer_token";
const TOKEN_EXPIRY_KEY = "auth_bearer_token_expiry";

export type TokenStorage = "localStorage" | "sessionStorage" | "memory";

// In-memory token storage (for SSR or when storage isn't available)
let memoryToken: string | null = null;
let memoryTokenExpiry: number | null = null;

/**
 * Get the appropriate storage based on environment and preference
 */
function getStorage(preferredStorage: TokenStorage): Storage | null {
  if (typeof window === "undefined") {
    return null; // SSR
  }

  if (preferredStorage === "memory") {
    return null;
  }

  try {
    const storage = preferredStorage === "localStorage" 
      ? window.localStorage 
      : window.sessionStorage;
    // Test if storage is available
    storage.setItem("test", "test");
    storage.removeItem("test");
    return storage;
  } catch {
    return null;
  }
}

/**
 * Store Bearer token
 */
export function setBearerToken(
  token: string,
  options?: {
    storage?: TokenStorage;
    expiresIn?: number; // seconds
  }
): void {
  const storage = getStorage(options?.storage ?? "localStorage");
  const expiresAt = options?.expiresIn 
    ? Date.now() + options.expiresIn * 1000 
    : null;

  if (storage) {
    storage.setItem(TOKEN_KEY, token);
    if (expiresAt) {
      storage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
    }
  } else {
    // Use memory storage
    memoryToken = token;
    memoryTokenExpiry = expiresAt;
  }
}

/**
 * Get stored Bearer token
 */
export function getBearerToken(
  options?: { storage?: TokenStorage }
): string | null {
  const storage = getStorage(options?.storage ?? "localStorage");

  if (storage) {
    const token = storage.getItem(TOKEN_KEY);
    const expiryStr = storage.getItem(TOKEN_EXPIRY_KEY);
    
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        // Token expired, clear it
        clearBearerToken(options);
        return null;
      }
    }
    
    return token;
  }

  // Use memory storage
  if (memoryTokenExpiry && Date.now() > memoryTokenExpiry) {
    memoryToken = null;
    memoryTokenExpiry = null;
    return null;
  }
  return memoryToken;
}

/**
 * Clear stored Bearer token
 */
export function clearBearerToken(
  options?: { storage?: TokenStorage }
): void {
  const storage = getStorage(options?.storage ?? "localStorage");

  if (storage) {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(TOKEN_EXPIRY_KEY);
  } else {
    memoryToken = null;
    memoryTokenExpiry = null;
  }
}

/**
 * Check if a Bearer token is stored
 */
export function hasBearerToken(
  options?: { storage?: TokenStorage }
): boolean {
  return getBearerToken(options) !== null;
}

/**
 * Get token expiry time (if set)
 */
export function getBearerTokenExpiry(
  options?: { storage?: TokenStorage }
): Date | null {
  const storage = getStorage(options?.storage ?? "localStorage");

  if (storage) {
    const expiryStr = storage.getItem(TOKEN_EXPIRY_KEY);
    if (expiryStr) {
      return new Date(parseInt(expiryStr, 10));
    }
  } else if (memoryTokenExpiry) {
    return new Date(memoryTokenExpiry);
  }

  return null;
}

/**
 * Check if token is expired or about to expire
 */
export function isTokenExpired(
  bufferSeconds = 60,
  options?: { storage?: TokenStorage }
): boolean {
  const expiry = getBearerTokenExpiry(options);
  if (!expiry) {
    return false; // No expiry set, assume valid
  }
  return Date.now() + bufferSeconds * 1000 > expiry.getTime();
}

/**
 * Format token for Authorization header
 */
export function formatAuthHeader(token?: string | null): string | undefined {
  const t = token ?? getBearerToken();
  return t ? \`Bearer \${t}\` : undefined;
}

/**
 * Parse token from auth response headers
 */
export function extractTokenFromResponse(response: Response): string | null {
  return response.headers.get("set-auth-token");
}

/**
 * Store token from auth response
 */
export function storeTokenFromResponse(
  response: Response,
  options?: {
    storage?: TokenStorage;
    expiresIn?: number;
  }
): string | null {
  const token = extractTokenFromResponse(response);
  if (token) {
    setBearerToken(token, options);
  }
  return token;
}
`;
  }

  private getBearerAuthClient(): string {
    return `/**
 * Bearer Auth Client Configuration
 *
 * Configures the Better Auth client to use Bearer token authentication
 * instead of cookie-based sessions.
 */
import { createAuthClient } from "better-auth/client";
import { getBearerToken } from "./bearer-token";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Create an auth client configured for Bearer token authentication
 */
export function createBearerAuthClient() {
  return createAuthClient({
    baseURL: API_BASE,
    fetchOptions: {
      auth: {
        type: "Bearer",
        token: () => getBearerToken() ?? "",
      },
    },
  });
}

/**
 * Default Bearer auth client instance
 */
export const bearerAuthClient = createBearerAuthClient();

/**
 * Create a fetch function that includes Bearer auth
 */
export function createAuthenticatedFetch(
  baseToken?: string | (() => string | null)
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = typeof baseToken === "function" ? baseToken() : baseToken ?? getBearerToken();
    
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set("Authorization", \`Bearer \${token}\`);
    }

    return fetch(input, {
      ...init,
      headers,
    });
  };
}

/**
 * Wrapper for API requests with Bearer authentication
 */
export async function authenticatedFetch<T = unknown>(
  url: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const token = options?.token ?? getBearerToken();
  
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set("Authorization", \`Bearer \${token}\`);
  }
  headers.set("Content-Type", "application/json");

  const response = await fetch(\`\${API_BASE}\${url}\`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || \`HTTP \${response.status}\`);
  }

  return response.json();
}

/**
 * Sign in and store Bearer token
 */
export async function signInWithBearer(credentials: {
  email: string;
  password: string;
}): Promise<{ token: string; user: unknown }> {
  const response = await fetch(\`\${API_BASE}/api/auth/sign-in/email\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Sign-in failed" }));
    throw new Error(error.message || "Authentication failed");
  }

  const data = await response.json();
  const token = response.headers.get("set-auth-token");

  return {
    token: token || "",
    user: data.user,
  };
}
`;
  }

  private getBearerTokenHook(): string {
    return `"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getBearerToken,
  setBearerToken,
  clearBearerToken,
  hasBearerToken,
  isTokenExpired,
  storeTokenFromResponse,
  type TokenStorage,
} from "@/lib/bearer-token";
import { signInWithBearer, authenticatedFetch } from "@/lib/auth-bearer-client";

export interface UseBearerTokenOptions {
  storage?: TokenStorage;
  autoRefresh?: boolean;
  refreshBuffer?: number; // seconds before expiry to trigger refresh
  onTokenChange?: (token: string | null) => void;
}

export interface UseBearerTokenReturn {
  token: string | null;
  isAuthenticated: boolean;
  isExpired: boolean;
  setToken: (token: string, expiresIn?: number) => void;
  clearToken: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshToken: () => Promise<void>;
  fetch: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
}

/**
 * Hook for managing Bearer token authentication
 */
export function useBearerToken(
  options: UseBearerTokenOptions = {}
): UseBearerTokenReturn {
  const { storage = "localStorage", onTokenChange } = options;
  
  const [token, setTokenState] = useState<string | null>(() => 
    typeof window !== "undefined" ? getBearerToken({ storage }) : null
  );

  // Sync with storage on mount
  useEffect(() => {
    const storedToken = getBearerToken({ storage });
    if (storedToken !== token) {
      setTokenState(storedToken);
    }
  }, [storage, token]);

  const setToken = useCallback((newToken: string, expiresIn?: number) => {
    setBearerToken(newToken, { storage, expiresIn });
    setTokenState(newToken);
    onTokenChange?.(newToken);
  }, [storage, onTokenChange]);

  const clearToken = useCallback(() => {
    clearBearerToken({ storage });
    setTokenState(null);
    onTokenChange?.(null);
  }, [storage, onTokenChange]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInWithBearer({ email, password });
    if (result.token) {
      setToken(result.token);
    }
  }, [setToken]);

  const signOut = useCallback(() => {
    clearToken();
  }, [clearToken]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: token ? { Authorization: \`Bearer \${token}\` } : {},
        credentials: "include",
      });

      if (response.ok) {
        const newToken = storeTokenFromResponse(response, { storage });
        if (newToken) {
          setTokenState(newToken);
          onTokenChange?.(newToken);
        }
      } else {
        // Refresh failed, clear token
        clearToken();
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearToken();
    }
  }, [token, storage, onTokenChange, clearToken]);

  const fetchWithAuth = useCallback(<T = unknown>(
    url: string,
    options?: RequestInit
  ): Promise<T> => {
    return authenticatedFetch<T>(url, { ...options, token: token ?? undefined });
  }, [token]);

  return {
    token,
    isAuthenticated: hasBearerToken({ storage }),
    isExpired: isTokenExpired(options.refreshBuffer ?? 60, { storage }),
    setToken,
    clearToken,
    signIn,
    signOut,
    refreshToken,
    fetch: fetchWithAuth,
  };
}

/**
 * Simplified hook for just checking auth status
 */
export function useIsAuthenticated(storage?: TokenStorage): boolean {
  const [isAuth, setIsAuth] = useState(() => 
    typeof window !== "undefined" ? hasBearerToken({ storage }) : false
  );

  useEffect(() => {
    setIsAuth(hasBearerToken({ storage }));
    
    // Listen for storage changes (cross-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "auth_bearer_token") {
        setIsAuth(!!e.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storage]);

  return isAuth;
}
`;
  }

  private getBearerAuthProvider(): string {
    return `"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useBearerToken, type UseBearerTokenReturn, type UseBearerTokenOptions } from "@/hooks/use-bearer-token";

/**
 * Bearer Auth Context
 */
const BearerAuthContext = createContext<UseBearerTokenReturn | null>(null);

/**
 * Bearer Auth Provider Props
 */
interface BearerAuthProviderProps extends UseBearerTokenOptions {
  children: ReactNode;
}

/**
 * Bearer Auth Provider
 *
 * Provides Bearer token authentication context to the application.
 * Wrap your app or specific routes with this provider to enable
 * token-based authentication.
 *
 * @example
 * \`\`\`tsx
 * // In your app layout
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <BearerAuthProvider storage="localStorage">
 *       {children}
 *     </BearerAuthProvider>
 *   );
 * }
 *
 * // In a component
 * function MyComponent() {
 *   const { isAuthenticated, signIn, signOut, fetch } = useBearerAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginForm onSubmit={signIn} />;
 *   }
 *
 *   return <Dashboard fetch={fetch} />;
 * }
 * \`\`\`
 */
export function BearerAuthProvider({
  children,
  ...options
}: BearerAuthProviderProps) {
  const bearerAuth = useBearerToken(options);

  const value = useMemo(() => bearerAuth, [
    bearerAuth.token,
    bearerAuth.isAuthenticated,
    bearerAuth.isExpired,
  ]);

  return (
    <BearerAuthContext.Provider value={value}>
      {children}
    </BearerAuthContext.Provider>
  );
}

/**
 * Hook to access Bearer auth context
 *
 * @throws Error if used outside BearerAuthProvider
 */
export function useBearerAuth(): UseBearerTokenReturn {
  const context = useContext(BearerAuthContext);
  
  if (!context) {
    throw new Error(
      "useBearerAuth must be used within a BearerAuthProvider. " +
      "Wrap your component tree with <BearerAuthProvider>."
    );
  }
  
  return context;
}

/**
 * HOC for protecting routes with Bearer authentication
 */
export function withBearerAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    redirectTo?: string;
  }
) {
  return function WithBearerAuthComponent(props: P) {
    const { isAuthenticated } = useBearerAuth();

    if (!isAuthenticated) {
      if (options?.fallback) {
        return <>{options.fallback}</>;
      }
      
      if (options?.redirectTo && typeof window !== "undefined") {
        window.location.href = options.redirectTo;
        return null;
      }
      
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
`;
  }

  private getBearerTypes(): string {
    return `/**
 * Bearer Token Authentication Types
 *
 * Type definitions for Bearer token authentication.
 */

/**
 * Token storage location options
 */
export type TokenStorage = "localStorage" | "sessionStorage" | "memory";

/**
 * Bearer token data structure
 */
export interface BearerTokenData {
  token: string;
  expiresAt?: Date;
  issuedAt: Date;
  scope?: string[];
}

/**
 * Bearer authentication state
 */
export interface BearerAuthState {
  isAuthenticated: boolean;
  token: string | null;
  expiresAt: Date | null;
  user: BearerAuthUser | null;
}

/**
 * User data from Bearer token auth
 */
export interface BearerAuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  emailVerified: boolean;
}

/**
 * Sign-in credentials
 */
export interface BearerSignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Sign-in response
 */
export interface BearerSignInResponse {
  success: boolean;
  token?: string;
  expiresIn?: number;
  user?: BearerAuthUser;
  error?: string;
}

/**
 * Token validation response
 */
export interface TokenValidationResponse {
  valid: boolean;
  user?: BearerAuthUser;
  expiresAt?: string;
  error?: string;
}

/**
 * Auth fetch options
 */
export interface AuthFetchOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

/**
 * Bearer plugin configuration
 */
export interface BearerPluginConfig {
  /** Require tokens to be signed */
  requireSignature?: boolean;
  /** Token expiry time in seconds */
  expiresIn?: number;
  /** Custom token header name (default: Authorization) */
  headerName?: string;
  /** Token prefix (default: Bearer) */
  tokenPrefix?: string;
}

/**
 * Bearer auth event types
 */
export type BearerAuthEvent =
  | { type: "token_set"; token: string }
  | { type: "token_cleared" }
  | { type: "token_expired" }
  | { type: "token_refreshed"; token: string }
  | { type: "auth_error"; error: Error };

/**
 * Event handler for auth events
 */
export type BearerAuthEventHandler = (event: BearerAuthEvent) => void;
`;
  }

  private getEnvExample(): string {
    return `# Better Auth Bearer Token Configuration
# These settings configure Bearer token authentication for API access

# Enable/disable Bearer token authentication (default: true)
# Set to "false" to disable Bearer auth and use only cookie sessions
BEARER_AUTH_ENABLED=true

# Require tokens to be signed (default: false)
# When true, only cryptographically signed tokens from the server are accepted
# Provides additional security but requires more processing
BEARER_REQUIRE_SIGNATURE=false

# Token expiry time in seconds (default: 604800 = 7 days)
# Shorter times are more secure but require more frequent re-authentication
BEARER_TOKEN_EXPIRY=604800
`;
  }
}
