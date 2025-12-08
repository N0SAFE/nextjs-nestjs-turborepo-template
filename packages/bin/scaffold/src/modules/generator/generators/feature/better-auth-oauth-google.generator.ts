/**
 * Better Auth OAuth Google Generator
 *
 * Sets up Google OAuth provider for Better Auth authentication.
 * Provides Google social login functionality with proper configuration.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class BetterAuthOAuthGoogleGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "better-auth-oauth-google",
    priority: 32, // After better-auth (30), after admin (31)
    version: "1.0.0",
    description: "Google OAuth provider for Better Auth social login",
    contributesTo: [
      "apps/api/src/auth/**",
      "apps/web/src/components/auth/**",
    ],
    dependsOn: ["better-auth"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // API: Google OAuth configuration
    files.push(
      this.file(
        "apps/api/src/auth/providers/google.ts",
        this.getGoogleProviderConfig(),
        { mergeStrategy: "replace", priority: 32 },
      ),
    );

    // API: OAuth providers index
    files.push(
      this.file(
        "apps/api/src/auth/providers/index.ts",
        this.getProvidersIndex(context),
        { mergeStrategy: "replace", priority: 32 },
      ),
    );

    // Web: Google OAuth components if Next.js is enabled
    if (this.hasPlugin(context, "nextjs")) {
      // Google sign-in button component
      files.push(
        this.file(
          "apps/web/src/components/auth/google-sign-in-button.tsx",
          this.getGoogleSignInButton(),
          { mergeStrategy: "replace", priority: 32 },
        ),
      );

      // OAuth buttons container
      files.push(
        this.file(
          "apps/web/src/components/auth/social-login-buttons.tsx",
          this.getSocialLoginButtons(context),
          { mergeStrategy: "replace", priority: 32 },
        ),
      );

      // OAuth callback handler component
      files.push(
        this.file(
          "apps/web/src/app/auth/callback/google/page.tsx",
          this.getGoogleCallbackPage(),
          { mergeStrategy: "replace", priority: 32 },
        ),
      );

      // Loading component for OAuth callback
      files.push(
        this.file(
          "apps/web/src/app/auth/callback/google/loading.tsx",
          this.getCallbackLoading(),
          { mergeStrategy: "replace", priority: 32 },
        ),
      );

      // OAuth hooks
      files.push(
        this.file(
          "apps/web/src/hooks/use-oauth.ts",
          this.getOAuthHooks(context),
          { mergeStrategy: "replace", priority: 32 },
        ),
      );

      // OAuth types
      files.push(
        this.file(
          "apps/web/src/types/oauth.ts",
          this.getOAuthTypes(),
          { mergeStrategy: "replace", priority: 32 },
        ),
      );
    }

    // Environment example for Google OAuth
    files.push(
      this.file(
        "apps/api/.env.oauth.example",
        this.getEnvExample(),
        { mergeStrategy: "append", priority: 32 },
      ),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // Google OAuth is built into better-auth, no additional dependencies needed
    return [];
  }

  private getGoogleProviderConfig(): string {
    return `/**
 * Google OAuth Provider Configuration
 *
 * Configures Google OAuth for Better Auth social login.
 *
 * Required Environment Variables:
 * - GOOGLE_CLIENT_ID: OAuth 2.0 Client ID from Google Cloud Console
 * - GOOGLE_CLIENT_SECRET: OAuth 2.0 Client Secret
 *
 * Setup Instructions:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com)
 * 2. Create a new project or select existing one
 * 3. Enable Google+ API
 * 4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
 * 5. Configure consent screen
 * 6. Add authorized redirect URIs:
 *    - Development: http://localhost:3001/api/auth/callback/google
 *    - Production: https://your-domain.com/api/auth/callback/google
 */

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes?: string[];
  redirectUri?: string;
}

/**
 * Get Google OAuth configuration from environment variables
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables"
    );
  }

  return {
    clientId,
    clientSecret,
    scopes: ["openid", "email", "profile"],
  };
}

/**
 * Google OAuth provider plugin configuration for Better Auth
 */
export const googleProvider = {
  id: "google",
  name: "Google",
  type: "oauth" as const,
  
  // Authorization endpoint
  authorization: {
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    params: {
      scope: "openid email profile",
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
    },
  },
  
  // Token endpoint
  token: {
    url: "https://oauth2.googleapis.com/token",
  },
  
  // User info endpoint
  userinfo: {
    url: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  
  // Profile mapping
  profile(profile: GoogleProfile): OAuthUserProfile {
    return {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      image: profile.picture,
      emailVerified: profile.email_verified,
    };
  },
};

/**
 * Google OAuth profile response type
 */
export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
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
 * Check if Google OAuth is configured
 */
export function isGoogleOAuthConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
`;
  }

  private getProvidersIndex(context: GeneratorContext): string {
    const hasGitHub = this.hasPlugin(context, "better-auth-oauth-github");
    
    let imports = `import { googleProvider, isGoogleOAuthConfigured } from "./google";`;
    let exports = `export { googleProvider, isGoogleOAuthConfigured } from "./google";`;
    let providersList = `  ...(isGoogleOAuthConfigured() ? [googleProvider] : []),`;
    
    if (hasGitHub) {
      imports += `\nimport { githubProvider, isGitHubOAuthConfigured } from "./github";`;
      exports += `\nexport { githubProvider, isGitHubOAuthConfigured } from "./github";`;
      providersList += `\n  ...(isGitHubOAuthConfigured() ? [githubProvider] : []),`;
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
export type OAuthProviderId = "google"${hasGitHub ? ' | "github"' : ""};

/**
 * Check which providers are available
 */
export function getAvailableProviders(): { id: OAuthProviderId; name: string; configured: boolean }[] {
  return [
    { id: "google", name: "Google", configured: isGoogleOAuthConfigured() },${hasGitHub ? `
    { id: "github", name: "GitHub", configured: isGitHubOAuthConfigured() },` : ""}
  ];
}
`;
  }

  private getGoogleSignInButton(): string {
    return `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOAuth } from "@/hooks/use-oauth";
import { cn } from "@/lib/utils";

interface GoogleSignInButtonProps {
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  text?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Google Sign-In Button Component
 *
 * Provides a styled button for Google OAuth authentication.
 */
export function GoogleSignInButton({
  className,
  variant = "outline",
  size = "default",
  text = "Continue with Google",
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useOAuth();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      console.error("Google sign-in error:", error);
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
        <GoogleIcon className="h-4 w-4" />
      )}
      {text}
    </Button>
  );
}

/**
 * Google "G" Logo Icon
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export { GoogleIcon };
`;
  }

  private getSocialLoginButtons(context: GeneratorContext): string {
    const hasGitHub = this.hasPlugin(context, "better-auth-oauth-github");

    let imports = `import { GoogleSignInButton } from "./google-sign-in-button";`;
    let buttons = `        <GoogleSignInButton onError={onError} />`;

    if (hasGitHub) {
      imports += `\nimport { GitHubSignInButton } from "./github-sign-in-button";`;
      buttons += `\n        <GitHubSignInButton onError={onError} />`;
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

export { GoogleSignInButton } from "./google-sign-in-button";${hasGitHub ? `
export { GitHubSignInButton } from "./github-sign-in-button";` : ""}
`;
  }

  private getGoogleCallbackPage(): string {
    return `"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

/**
 * Google OAuth Callback Page
 *
 * Handles the OAuth callback from Google and completes the authentication flow.
 */
export default function GoogleCallbackPage() {
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
          <CardTitle>Google Sign In</CardTitle>
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
 * Loading component for OAuth callback
 */
export default function GoogleCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Signing in with Google...
        </p>
      </div>
    </div>
  );
}
`;
  }

  private getOAuthHooks(context: GeneratorContext): string {
    const hasGitHub = this.hasPlugin(context, "better-auth-oauth-github");

    let signInMethods = `
  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async (callbackUrl?: string) => {
    return signInWithOAuth("google", callbackUrl);
  };`;

    let returnMethods = `    signInWithGoogle,`;

    if (hasGitHub) {
      signInMethods += `

  /**
   * Sign in with GitHub OAuth
   */
  const signInWithGitHub = async (callbackUrl?: string) => {
    return signInWithOAuth("github", callbackUrl);
  };`;
      returnMethods += `
    signInWithGitHub,`;
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
    const availableProviders: OAuthProviderId[] = ["google"${hasGitHub ? ', "github"' : ""}];
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
`;
  }

  private getEnvExample(): string {
    return `# Google OAuth Configuration
# Get credentials from Google Cloud Console: https://console.cloud.google.com
# 1. Create or select a project
# 2. Enable Google+ API
# 3. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
# 4. Configure consent screen
# 5. Add redirect URIs:
#    - http://localhost:3001/api/auth/callback/google (development)
#    - https://your-domain.com/api/auth/callback/google (production)

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
`;
  }
}
