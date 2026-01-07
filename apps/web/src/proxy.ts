// middleware.ts

import { stackMiddlewares } from "./middlewares/utils/stackMiddlewares";
import { withHeaders } from "./middlewares/WithHeaders";
import * as HealthCheckMiddleware from "./middlewares/WithHealthCheck";
import * as AuthMiddleware from "./middlewares/WithAuth";
import * as EnvMiddleware from "./middlewares/WithEnv";
import type { Middleware } from "./middlewares/utils/types";
import type { NextFetchEvent, NextRequest } from "next/server";
import { nextNoApi, nextjsRegexpPageOnly } from "./middlewares/utils/static";

// Helper to get readable timestamp HH:MM:SS.mmm
const ts = () => new Date().toISOString().substring(11, 23);

// Entry timing middleware - wraps the entire middleware chain
const TimingEntryMiddleware: Middleware = {
  matcher: [{ and: [nextNoApi, nextjsRegexpPageOnly] }],
  default: (next) => {
    return async (request: NextRequest, event: NextFetchEvent) => {
      console.log(
        `[${ts()}] 🚀 PROXY: START - ${request.method} ${request.nextUrl.pathname}`,
      );
      const response = await next(request, event);
      console.log(
        `[${ts()}] ✅ PROXY: END - ${request.method} ${request.nextUrl.pathname}`,
      );
      return response;
    };
  },
};

const middlewares = [
  TimingEntryMiddleware,
  EnvMiddleware,
  HealthCheckMiddleware,
  // WithRedirect,
  AuthMiddleware,
  withHeaders,
] satisfies Middleware[];

export default stackMiddlewares(middlewares);
