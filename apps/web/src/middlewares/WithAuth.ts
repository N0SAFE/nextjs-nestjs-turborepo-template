/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {
  NextFetchEvent,
  NextProxy,
  NextRequest,
  NextResponse,
} from "next/server";
import { ConfigFactory, Matcher, MiddlewareFactory } from "./utils/types";
import { nextjsRegexpPageOnly, nextNoApi } from "./utils/static";
import { matcherHandler } from "./utils/utils";
import { validateEnvSafe } from "#/env";
import { toAbsoluteUrl } from "@/lib/utils";
import { AuthSignin } from "@/routes/index";
import { createDebug } from "@/lib/debug";
import { getCookieCache, getSessionCookie } from "better-auth/cookies";
import type { Session } from "@repo/auth";

const debugAuth = createDebug("middleware/auth");
const debugAuthError = createDebug("middleware/auth/error");

// Helper to get readable timestamp HH:MM:SS.mmm
const ts = () => new Date().toISOString().substring(11, 23);

const env = validateEnvSafe(process.env).data;

const showcaseRegexpAndChildren = /^\/showcase(\/.*)?$/;
const dashboardRegexpAndChildren = /^\/dashboard(\/.*)?$/;

const withAuth: MiddlewareFactory = (next: NextProxy) => {
  if (!env) {
    debugAuthError("Environment variables are not valid", {
      env: process.env,
      error: validateEnvSafe(process.env).error,
    });
    throw new Error("env is not valid");
  }
  return async (request: NextRequest, _next: NextFetchEvent) => {
    console.log(`[${ts()}] 🔐 AUTH-MW: START - ${request.nextUrl.pathname}`);

    debugAuth(`Checking authentication for ${request.nextUrl.pathname}`, {
      path: request.nextUrl.pathname,
    });

    const masterTokenEnabled =
      env.NODE_ENV === "development"
        ? request.cookies.get("master-token-enabled")?.value === "true"
        : false;

    if (masterTokenEnabled) {
      console.log(`[${ts()}] 🔐 AUTH-MW: Master token enabled, skipping auth`);
      return next(request, _next);
    }

    // Get session using Better Auth directly
    let sessionCookie: string | null = null;
    let sessionError: unknown = null;

    try {
      debugAuth("Getting session using Better Auth");
      console.log(`[${ts()}] 🔐 AUTH-MW: Getting session cookie...`);

      sessionCookie = getSessionCookie(request);
      console.log(`[${ts()}] 🔐 AUTH-MW: Got session cookie: ${sessionCookie ? 'yes' : 'no'}`);

      console.log(`[${ts()}] 🔐 AUTH-MW: Calling getCookieCache...`);
      const s = await getCookieCache<
        Session & {
          updatedAt: number;
        }
      >(request, {
        secret: env.BETTER_AUTH_SECRET,
        // Match the cookie security setting from the API
        // In Docker without HTTPS termination, use non-secure cookies
        isSecure: env.NEXT_PUBLIC_API_URL?.startsWith("https://") ?? false,
      });
      console.log(`[${ts()}] 🔐 AUTH-MW: getCookieCache done, hasSession: ${String(!!s)}`);

      debugAuth("Session processed:", {
        hasSession: !!sessionCookie,
        hasCachedSession: !!s,
      });
    } catch (error) {
      console.error(`[${ts()}] 🔐 AUTH-MW: Error getting session:`, error);
      sessionError = error;
      debugAuthError("Error getting session from Better Auth:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
      });
    }

    const isAuth = !!sessionCookie;

    console.log(`[${ts()}] 🔐 AUTH-MW: isAuth=${String(isAuth)}, hasError=${String(!!sessionError)}`);

    debugAuth(
      `Session result - isAuth: ${String(isAuth)}, hasError: ${String(!!sessionError)}`,
      {
        path: request.nextUrl.pathname,
        isAuth,
        hasError: !!sessionError,
      },
    );

    if (isAuth) {
      const matcher = matcherHandler(request.nextUrl.pathname, [
        {
          and: ["/me/customer"],
        },
        () => {
          // No-op function
        },
      ]);
      if (matcher.hit) {
        return matcher.data; // return the Response associated
      }
      console.log(`[${ts()}] 🔐 AUTH-MW: END - authenticated, calling next()`);
      return next(request, _next); // call the next middleware because the route is good
    } else {
      // User is not authenticated, redirect to login for protected routes
      debugAuth(
        `Redirecting unauthenticated user from ${request.nextUrl.pathname} to signin`,
      );
      console.log(`[${ts()}] 🔐 AUTH-MW: END - redirecting to signin`);
      return NextResponse.redirect(
        toAbsoluteUrl(
          AuthSignin(
            {},
            {
              callbackUrl:
                request.nextUrl.pathname + (request.nextUrl.search ?? ""),
            },
          ),
        ),
      );
    }
  };
};

export default withAuth;

export const matcher: Matcher = [
  {
    and: [
      nextNoApi,
      nextjsRegexpPageOnly,
      {
        or: [
          showcaseRegexpAndChildren,
          dashboardRegexpAndChildren,
          "/settings",
          "/profile",
        ],
      },
    ],
  },
];

export const config: ConfigFactory = {
  name: "withAuth",
  matcher: true,
};
