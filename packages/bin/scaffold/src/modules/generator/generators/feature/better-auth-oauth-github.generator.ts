/**
 * Better Auth OAuth GitHub Generator
 *
 * Sets up GitHub OAuth provider for Better Auth authentication.
 * Provides GitHub social login functionality with proper configuration.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class BetterAuthOAuthGitHubGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "better-auth-oauth-github",
    priority: 33, // After better-auth-oauth-google (32)
    version: "1.0.0",
    description: "GitHub OAuth provider for Better Auth social login",
    contributesTo: [
      "apps/api/src/auth/**",
      "apps/web/src/components/auth/**",
    ],
    dependsOn: ["better-auth"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // API: GitHub OAuth configuration
    files.push(
      this.file(
        "apps/api/src/auth/providers/github.ts",
        this.getGitHubProviderConfig(),
        { mergeStrategy: "replace", priority: 33 },
      ),
    );

    // API: Update OAuth providers index to include GitHub
    files.push(
      this.file(
        "apps/api/src/auth/providers/index.ts",
        this.getProvidersIndex(context),
        { mergeStrategy: "replace", priority: 33 },
      ),
    );

    // Web: GitHub OAuth components if Next.js is enabled
    if (this.hasPlugin(context, "nextjs")) {
      // GitHub sign-in button component
      files.push(
        this.file(
          "apps/web/src/components/auth/github-sign-in-button.tsx",
          this.getGitHubSignInButton(),
          { mergeStrategy: "replace", priority: 33 },
        ),
      );

      // Update OAuth buttons container to include GitHub
      files.push(
        this.file(
          "apps/web/src/components/auth/social-login-buttons.tsx",
          this.getSocialLoginButtons(context),
          { mergeStrategy: "replace", priority: 33 },
        ),
      );

      // OAuth callback handler component
      files.push(
        this.file(
          "apps/web/src/app/auth/callback/github/page.tsx",
          this.getGitHubCallbackPage(),
          { mergeStrategy: "replace", priority: 33 },
        ),
      );

      // Loading component for OAuth callback
      files.push(
        this.file(
          "apps/web/src/app/auth/callback/github/loading.tsx",
          this.getCallbackLoading(),
          { mergeStrategy: "replace", priority: 33 },
        ),
      );

      // Update OAuth hooks to include GitHub
      files.push(
        this.file(
          "apps/web/src/hooks/use-oauth.ts",
          this.getOAuthHooks(context),
          { mergeStrategy: "replace", priority: 33 },
        ),
      );

      // Update OAuth types to include GitHub
      files.push(
        this.file(
          "apps/web/src/types/oauth.ts",
          this.getOAuthTypes(),
          { mergeStrategy: "replace", priority: 33 },
        ),
      );
    }

    // Environment example for GitHub OAuth
    files.push(
      this.file(
        "apps/api/.env.oauth.example",
        this.getEnvExample(),
        { mergeStrategy: "append", priority: 33 },
      ),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // GitHub OAuth is built into better-auth, no additional dependencies needed
    return [];
  }

  private getGitHubProviderConfig(): string {
    return `/**
 * GitHub OAuth Provider Configuration
 *
 * Configures GitHub OAuth for Better Auth social login.
 *
 * Required Environment Variables:
 * - GITHUB_CLIENT_ID: OAuth Client ID from GitHub Developer Settings
 * - GITHUB_CLIENT_SECRET: OAuth Client Secret
 *
 * Setup Instructions:
 * 1. Go to GitHub Developer Settings (https://github.com/settings/developers)
 * 2. Create a new OAuth App or select existing one
 * 3. Set Homepage URL to your application URL
 * 4. Add authorization callback URL:
 *    - Development: http://localhost:3001/api/auth/callback/github
 *    - Production: https://your-domain.com/api/auth/callback/github
 * 5. Copy Client ID and generate a Client Secret
 */

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes?: string[];
  redirectUri?: string;
}

/**
 * Get GitHub OAuth configuration from environment variables
 */
export function getGitHubOAuthConfig(): GitHubOAuthConfig {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GitHub OAuth requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables"
    );
  }

  return {
    clientId,
    clientSecret,
    scopes: ["user:email", "read:user"],
  };
}

/**
 * GitHub OAuth provider plugin configuration for Better Auth
 */
export const githubProvider = {
  id: "github",
  name: "GitHub",
  type: "oauth" as const,
  
  // Authorization endpoint
  authorization: {
    url: "https://github.com/login/oauth/authorize",
    params: {
      scope: "user:email read:user",
    },
  },
  
  // Token endpoint
  token: {
    url: "https://github.com/login/oauth/access_token",
  },
  
  // User info endpoint
  userinfo: {
    url: "https://api.github.com/user",
  },
  
  // Profile mapping
  profile(profile: GitHubProfile): OAuthUserProfile {
    return {
      id: profile.id.toString(),
      email: profile.email,
      name: profile.name || profile.login,
      image: profile.avatar_url,
      emailVerified: true, // GitHub emails are verified
    };
  },
};

/**
 * GitHub OAuth profile response type
 */
export interface GitHubProfile {
  id: number;
  login: string;
  email: string;
  name?: string;
  avatar_url: string;
  html_url: string;
  bio?: string;
  company?: string;
  location?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
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
 * Check if GitHub OAuth is configured
 */
export function isGitHubOAuthConfigured(): boolean {
  return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}
`;
  }

  private getProvidersIndex(context: GeneratorContext): string {
    const hasGoogle = this.hasPlugin(context, "better-auth-oauth-google");
    
    let imports = `import { githubProvider, isGitHubOAuthConfigured } from "./github";`;
    let exports = `export { githubProvider, isGitHubOAuthConfigured } from "./github";`;
    let providersList = `  ...(isGitHubOAuthConfigured() ? [githubProvider] : []),`;
    let providerTypes = `"github"`;
    let availableList = `    { id: "github", name: "GitHub", configured: isGitHubOAuthConfigured() },`;
    
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

  private getGitHubSignInButton(): string {
    return `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOAuth } from "@/hooks/use-oauth";
import { cn } from "@/lib/utils";

interface GitHubSignInButtonProps {
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  text?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * GitHub Sign-In Button Component
 *
 * Provides a styled button for GitHub OAuth authentication.
 */
export function GitHubSignInButton({
  className,
  variant = "outline",
  size = "default",
  text = "Continue with GitHub",
  onSuccess,
  onError,
}: GitHubSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGitHub } = useOAuth();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await signInWithGitHub();
      onSuccess?.();
    } catch (error) {
      console.error("GitHub sign-in error:", error);
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
        <GitHubIcon className="h-4 w-4" />
      )}
      {text}
    </Button>
  );
}

/**
 * GitHub Logo Icon
 */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
      />
    </svg>
  );
}

export { GitHubIcon };
`;
  }

  private getSocialLoginButtons(context: GeneratorContext): string {
    const hasGoogle = this.hasPlugin(context, "better-auth-oauth-google");

    let imports = `import { GitHubSignInButton } from "./github-sign-in-button";`;
    let buttons = `        <GitHubSignInButton onError={onError} />`;
    let reexports = `export { GitHubSignInButton } from "./github-sign-in-button";`;

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

  private getGitHubCallbackPage(): string {
    return `"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

/**
 * GitHub OAuth Callback Page
 *
 * Handles the OAuth callback from GitHub and completes the authentication flow.
 */
export default function GitHubCallbackPage() {
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
          <CardTitle>GitHub Sign In</CardTitle>
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
 * Loading component for GitHub OAuth callback
 */
export default function GitHubCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Signing in with GitHub...
        </p>
      </div>
    </div>
  );
}
`;
  }

  private getOAuthHooks(context: GeneratorContext): string {
    const hasGoogle = this.hasPlugin(context, "better-auth-oauth-google");

    let signInMethods = `
  /**
   * Sign in with GitHub OAuth
   */
  const signInWithGitHub = async (callbackUrl?: string) => {
    return signInWithOAuth("github", callbackUrl);
  };`;

    let returnMethods = `    signInWithGitHub,`;
    let availableProviders = `"github"`;

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

  private getOAuthTypes(): string {
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
 * GitHub-specific profile fields
 */
export interface GitHubOAuthProfile extends OAuthProfile {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  bio?: string;
  company?: string;
  location?: string;
  publicRepos?: number;
  followers?: number;
  following?: number;
}
`;
  }

  private getEnvExample(): string {
    return `
# GitHub OAuth Configuration
# Get credentials from GitHub Developer Settings: https://github.com/settings/developers
# 1. Create or select an OAuth App
# 2. Set Homepage URL to your application URL
# 3. Add callback URL:
#    - http://localhost:3001/api/auth/callback/github (development)
#    - https://your-domain.com/api/auth/callback/github (production)

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
`;
  }
}
