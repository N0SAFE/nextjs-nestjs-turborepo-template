/**
 * Better Auth OAuth Discord Generator
 *
 * Sets up Discord OAuth provider for Better Auth authentication.
 * Provides Discord social login functionality with proper configuration.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class BetterAuthOAuthDiscordGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "better-auth-oauth-discord",
    priority: 34, // After better-auth-oauth-github (33)
    version: "1.0.0",
    description: "Discord OAuth provider for Better Auth social login",
    contributesTo: [
      "apps/api/src/auth/**",
      "apps/web/src/components/auth/**",
    ],
    dependsOn: ["better-auth"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // API: Discord OAuth configuration
    files.push(
      this.file(
        "apps/api/src/auth/providers/discord.ts",
        this.getDiscordProviderConfig(),
        { mergeStrategy: "replace", priority: 34 },
      ),
    );

    // API: Update OAuth providers index to include Discord
    files.push(
      this.file(
        "apps/api/src/auth/providers/index.ts",
        this.getProvidersIndex(context),
        { mergeStrategy: "replace", priority: 34 },
      ),
    );

    // Web: Discord OAuth components if Next.js is enabled
    if (this.hasPlugin(context, "nextjs")) {
      // Discord sign-in button component
      files.push(
        this.file(
          "apps/web/src/components/auth/discord-sign-in-button.tsx",
          this.getDiscordSignInButton(),
          { mergeStrategy: "replace", priority: 34 },
        ),
      );

      // Update OAuth buttons container to include Discord
      files.push(
        this.file(
          "apps/web/src/components/auth/social-login-buttons.tsx",
          this.getSocialLoginButtons(context),
          { mergeStrategy: "replace", priority: 34 },
        ),
      );

      // OAuth callback handler component
      files.push(
        this.file(
          "apps/web/src/app/auth/callback/discord/page.tsx",
          this.getDiscordCallbackPage(),
          { mergeStrategy: "replace", priority: 34 },
        ),
      );

      // Loading component for OAuth callback
      files.push(
        this.file(
          "apps/web/src/app/auth/callback/discord/loading.tsx",
          this.getCallbackLoading(),
          { mergeStrategy: "replace", priority: 34 },
        ),
      );

      // Update OAuth hooks to include Discord
      files.push(
        this.file(
          "apps/web/src/hooks/use-oauth.ts",
          this.getOAuthHooks(context),
          { mergeStrategy: "replace", priority: 34 },
        ),
      );

      // Update OAuth types to include Discord
      files.push(
        this.file(
          "apps/web/src/types/oauth.ts",
          this.getOAuthTypes(context),
          { mergeStrategy: "replace", priority: 34 },
        ),
      );
    }

    // Environment example for Discord OAuth
    files.push(
      this.file(
        "apps/api/.env.oauth.example",
        this.getEnvExample(),
        { mergeStrategy: "append", priority: 34 },
      ),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // Discord OAuth is built into better-auth, no additional dependencies needed
    return [];
  }

  private getDiscordProviderConfig(): string {
    return `/**
 * Discord OAuth Provider Configuration
 *
 * Configures Discord OAuth for Better Auth social login.
 *
 * Required Environment Variables:
 * - DISCORD_CLIENT_ID: OAuth Client ID from Discord Developer Portal
 * - DISCORD_CLIENT_SECRET: OAuth Client Secret
 *
 * Setup Instructions:
 * 1. Go to Discord Developer Portal (https://discord.com/developers/applications)
 * 2. Create a new application or select existing one
 * 3. Go to OAuth2 settings
 * 4. Add redirect URLs:
 *    - Development: http://localhost:3001/api/auth/callback/discord
 *    - Production: https://your-domain.com/api/auth/callback/discord
 * 5. Copy Client ID and Client Secret
 */

export interface DiscordOAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes?: string[];
  redirectUri?: string;
}

/**
 * Get Discord OAuth configuration from environment variables
 */
export function getDiscordOAuthConfig(): DiscordOAuthConfig {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Discord OAuth requires DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables"
    );
  }

  return {
    clientId,
    clientSecret,
    scopes: ["identify", "email"],
  };
}

/**
 * Discord OAuth provider plugin configuration for Better Auth
 */
export const discordProvider = {
  id: "discord",
  name: "Discord",
  type: "oauth" as const,
  
  // Authorization endpoint
  authorization: {
    url: "https://discord.com/api/oauth2/authorize",
    params: {
      scope: "identify email",
    },
  },
  
  // Token endpoint
  token: {
    url: "https://discord.com/api/oauth2/token",
  },
  
  // User info endpoint
  userinfo: {
    url: "https://discord.com/api/users/@me",
  },
  
  // Profile mapping
  profile(profile: DiscordProfile): OAuthUserProfile {
    const avatarUrl = profile.avatar
      ? \`https://cdn.discordapp.com/avatars/\${profile.id}/\${profile.avatar}.png\`
      : \`https://cdn.discordapp.com/embed/avatars/\${parseInt(profile.discriminator) % 5}.png\`;
    
    return {
      id: profile.id,
      email: profile.email,
      name: profile.global_name || profile.username,
      image: avatarUrl,
      emailVerified: profile.verified ?? false,
    };
  },
};

/**
 * Discord OAuth profile response type
 */
export interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
  email: string;
  verified?: boolean;
  locale?: string;
  mfa_enabled?: boolean;
  premium_type?: number;
  flags?: number;
  banner?: string;
  accent_color?: number;
}

/**
 * Normalized OAuth user profile
 */
export interface OAuthUserProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
  emailVerified: boolean;
}

/**
 * Check if Discord OAuth is configured
 */
export function isDiscordOAuthConfigured(): boolean {
  return !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
}
`;
  }

  private getProvidersIndex(context: GeneratorContext): string {
    const hasGoogle = this.hasPlugin(context, "better-auth-oauth-google");
    const hasGitHub = this.hasPlugin(context, "better-auth-oauth-github");
    
    // Build imports, exports, provider list, types, and available list dynamically
    let imports = `import { discordProvider, isDiscordOAuthConfigured } from "./discord";`;
    let exports = `export { discordProvider, isDiscordOAuthConfigured } from "./discord";`;
    let providersList = `  ...(isDiscordOAuthConfigured() ? [discordProvider] : []),`;
    let providerTypes = `"discord"`;
    let availableList = `    { id: "discord", name: "Discord", configured: isDiscordOAuthConfigured() },`;
    
    if (hasGitHub) {
      imports = `import { githubProvider, isGitHubOAuthConfigured } from "./github";\n${imports}`;
      exports = `export { githubProvider, isGitHubOAuthConfigured } from "./github";\n${exports}`;
      providersList = `  ...(isGitHubOAuthConfigured() ? [githubProvider] : []),\n${providersList}`;
      providerTypes = `"github" | ${providerTypes}`;
      availableList = `    { id: "github", name: "GitHub", configured: isGitHubOAuthConfigured() },\n${availableList}`;
    }
    
    if (hasGoogle) {
      imports = `import { googleProvider, isGoogleOAuthConfigured } from "./google";\n${imports}`;
      exports = `export { googleProvider, isGoogleOAuthConfigured } from "./google";\n${exports}`;
      providersList = `  ...(isGoogleOAuthConfigured() ? [googleProvider] : []),\n${providersList}`;
      providerTypes = `"google" | ${providerTypes}`;
      availableList = `    { id: "google", name: "Google", configured: isGoogleOAuthConfigured() },\n${availableList}`;
    }

    return `/**
 * OAuth Providers Index
 *
 * Aggregates all configured OAuth providers for Better Auth.
 */

${imports}

${exports}

/**
 * Get all enabled OAuth providers based on environment configuration
 */
export function getEnabledProviders() {
  return [
${providersList}
  ].filter(Boolean);
}

/**
 * Provider IDs for type safety
 */
export type OAuthProviderId = ${providerTypes};

/**
 * Check which providers are available
 */
export function getAvailableProviders(): { id: OAuthProviderId; name: string; configured: boolean }[] {
  return [
${availableList}
  ];
}
`;
  }

  private getDiscordSignInButton(): string {
    return `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOAuth } from "@/hooks/use-oauth";
import { cn } from "@/lib/utils";

interface DiscordSignInButtonProps {
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  text?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Discord Sign-In Button Component
 *
 * Provides a styled button for Discord OAuth authentication.
 */
export function DiscordSignInButton({
  className,
  variant = "outline",
  size = "default",
  text = "Continue with Discord",
  onSuccess,
  onError,
}: DiscordSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithDiscord } = useOAuth();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await signInWithDiscord();
      onSuccess?.();
    } catch (error) {
      console.error("Discord sign-in error:", error);
      onError?.(error instanceof Error ? error : new Error("Sign-in failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("w-full gap-2", className)}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <DiscordIcon className="h-4 w-4" />
      )}
      {text}
    </Button>
  );
}

/**
 * Discord Logo Icon
 */
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
      />
    </svg>
  );
}

export { DiscordIcon };
`;
  }

  private getSocialLoginButtons(context: GeneratorContext): string {
    const hasGoogle = this.hasPlugin(context, "better-auth-oauth-google");
    const hasGitHub = this.hasPlugin(context, "better-auth-oauth-github");

    // Build imports and buttons dynamically
    let imports = `import { DiscordSignInButton } from "./discord-sign-in-button";`;
    let buttons = `        <DiscordSignInButton onError={onError} />`;
    let reexports = `export { DiscordSignInButton } from "./discord-sign-in-button";`;

    if (hasGitHub) {
      imports = `import { GitHubSignInButton } from "./github-sign-in-button";\n${imports}`;
      buttons = `        <GitHubSignInButton onError={onError} />\n${buttons}`;
      reexports = `export { GitHubSignInButton } from "./github-sign-in-button";\n${reexports}`;
    }

    if (hasGoogle) {
      imports = `import { GoogleSignInButton } from "./google-sign-in-button";\n${imports}`;
      buttons = `        <GoogleSignInButton onError={onError} />\n${buttons}`;
      reexports = `export { GoogleSignInButton } from "./google-sign-in-button";\n${reexports}`;
    }

    return `"use client";

import { useState } from "react";
${imports}

interface SocialLoginButtonsProps {
  onError?: (error: Error) => void;
  showDivider?: boolean;
  dividerText?: string;
}

/**
 * Social Login Buttons Container
 *
 * Renders all available OAuth provider buttons with optional divider.
 */
export function SocialLoginButtons({
  onError,
  showDivider = true,
  dividerText = "or continue with",
}: SocialLoginButtonsProps) {
  return (
    <div className="space-y-4">
      {showDivider && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {dividerText}
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-2">
${buttons}
      </div>
    </div>
  );
}

${reexports}
`;
  }

  private getDiscordCallbackPage(): string {
    return `"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

/**
 * Discord OAuth Callback Page
 *
 * Handles the OAuth callback from Discord and completes the authentication flow.
 */
export default function DiscordCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        setStatus("error");
        setError(errorDescription || errorParam || "Authentication failed");
        return;
      }

      if (!code) {
        setStatus("error");
        setError("No authorization code received");
        return;
      }

      try {
        // The callback is typically handled by the auth library automatically
        // This page just shows the status to the user
        setStatus("success");
        
        // Redirect to dashboard or intended page after a short delay
        setTimeout(() => {
          const callbackUrl = searchParams.get("state") || "/dashboard";
          router.push(callbackUrl);
        }, 1500);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Discord Sign In</CardTitle>
          <CardDescription>
            {status === "loading" && "Completing authentication..."}
            {status === "success" && "Authentication successful!"}
            {status === "error" && "Authentication failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
          
          {status === "success" && (
            <>
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Redirecting to your dashboard...
              </p>
            </>
          )}
          
          {status === "error" && (
            <>
              <XCircle className="h-8 w-8 text-destructive" />
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <button
                onClick={() => router.push("/auth/login")}
                className="text-sm text-primary hover:underline"
              >
                Back to login
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;
  }

  private getCallbackLoading(): string {
    return `import { Loader2 } from "lucide-react";

/**
 * Loading component for Discord OAuth callback
 */
export default function DiscordCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Signing in with Discord...
        </p>
      </div>
    </div>
  );
}
`;
  }

  private getOAuthHooks(context: GeneratorContext): string {
    const hasGoogle = this.hasPlugin(context, "better-auth-oauth-google");
    const hasGitHub = this.hasPlugin(context, "better-auth-oauth-github");

    // Build sign-in methods, return methods, and available providers dynamically
    let signInMethods = `
  /**
   * Sign in with Discord OAuth
   */
  const signInWithDiscord = async (callbackUrl?: string) => {
    return signInWithOAuth("discord", callbackUrl);
  };`;

    let returnMethods = `    signInWithDiscord,`;
    let availableProviders = `"discord"`;

    if (hasGitHub) {
      signInMethods = `
  /**
   * Sign in with GitHub OAuth
   */
  const signInWithGitHub = async (callbackUrl?: string) => {
    return signInWithOAuth("github", callbackUrl);
  };
${signInMethods}`;
      returnMethods = `    signInWithGitHub,\n${returnMethods}`;
      availableProviders = `"github", ${availableProviders}`;
    }

    if (hasGoogle) {
      signInMethods = `
  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async (callbackUrl?: string) => {
    return signInWithOAuth("google", callbackUrl);
  };
${signInMethods}`;
      returnMethods = `    signInWithGoogle,\n${returnMethods}`;
      availableProviders = `"google", ${availableProviders}`;
    }

    return `"use client";

import { useCallback } from "react";
import { authClient } from "@/lib/auth";
import type { OAuthProviderId } from "@/types/oauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * OAuth Authentication Hooks
 *
 * Provides methods for OAuth sign-in with various providers.
 */
export function useOAuth() {
  /**
   * Initiate OAuth sign-in flow
   */
  const signInWithOAuth = useCallback(async (
    provider: OAuthProviderId,
    callbackUrl?: string
  ) => {
    const redirectUrl = callbackUrl || window.location.origin + "/dashboard";
    
    // Use Better Auth's OAuth sign-in
    await authClient.signIn.social({
      provider,
      callbackURL: redirectUrl,
    });
  }, []);
${signInMethods}

  /**
   * Get OAuth authorization URL for custom flows
   */
  const getOAuthUrl = useCallback((
    provider: OAuthProviderId,
    callbackUrl?: string
  ) => {
    const state = encodeURIComponent(callbackUrl || "/dashboard");
    return \`\${API_BASE}/api/auth/\${provider}?state=\${state}\`;
  }, []);

  /**
   * Check if a provider is available
   */
  const isProviderAvailable = useCallback((provider: OAuthProviderId) => {
    // This could be extended to check server-side configuration
    const availableProviders: OAuthProviderId[] = [${availableProviders}];
    return availableProviders.includes(provider);
  }, []);

  return {
    signInWithOAuth,
${returnMethods}
    getOAuthUrl,
    isProviderAvailable,
  };
}

/**
 * Hook for handling OAuth callback
 */
export function useOAuthCallback() {
  const handleCallback = useCallback(async (
    code: string,
    provider: OAuthProviderId,
    state?: string
  ) => {
    try {
      const response = await fetch(\`\${API_BASE}/api/auth/callback/\${provider}\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "OAuth callback failed");
      }

      return await response.json();
    } catch (error) {
      console.error("OAuth callback error:", error);
      throw error;
    }
  }, []);

  return { handleCallback };
}
`;
  }

  private getOAuthTypes(context: GeneratorContext): string {
    // Add Discord-specific profile if needed (it's always included when this generator runs)
    return `/**
 * OAuth Types
 *
 * Type definitions for OAuth authentication.
 */

/**
 * Supported OAuth provider IDs
 */
export type OAuthProviderId = "google" | "github" | "discord" | "twitter" | "facebook";

/**
 * OAuth provider configuration
 */
export interface OAuthProvider {
  id: OAuthProviderId;
  name: string;
  icon?: string;
  configured: boolean;
}

/**
 * OAuth callback parameters
 */
export interface OAuthCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

/**
 * OAuth user profile (normalized across providers)
 */
export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
  emailVerified: boolean;
  provider: OAuthProviderId;
  providerAccountId: string;
}

/**
 * OAuth sign-in options
 */
export interface OAuthSignInOptions {
  callbackUrl?: string;
  redirect?: boolean;
}

/**
 * OAuth error types
 */
export type OAuthErrorCode =
  | "access_denied"
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unauthorized_client"
  | "unsupported_grant_type"
  | "server_error"
  | "temporarily_unavailable";

/**
 * OAuth error
 */
export interface OAuthError {
  code: OAuthErrorCode;
  message: string;
  description?: string;
}

/**
 * Discord-specific profile fields
 */
export interface DiscordOAuthProfile extends OAuthProfile {
  username: string;
  discriminator: string;
  globalName?: string;
  avatarUrl: string;
  locale?: string;
  mfaEnabled?: boolean;
  premiumType?: number;
  flags?: number;
  banner?: string;
  accentColor?: number;
}
`;
  }

  private getEnvExample(): string {
    return `
# Discord OAuth Configuration
# Get credentials from Discord Developer Portal: https://discord.com/developers/applications
# 1. Create or select an application
# 2. Go to OAuth2 settings
# 3. Add redirect URLs:
#    - http://localhost:3001/api/auth/callback/discord (development)
#    - https://your-domain.com/api/auth/callback/discord (production)

DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
`;
  }
}
