import type { NextRequest, NextFetchEvent, NextProxy } from "next/server";
import { nextNoApi, nextjsRegexpPageOnly } from "./utils/static";
import type { MiddlewareFactory } from "./utils/types";

// Helper to get readable timestamp HH:MM:SS.mmm
const ts = () => new Date().toISOString().substring(11, 23);

const withTiming: MiddlewareFactory = (next: NextProxy) => {
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
};

export default withTiming

export const matcher = [{ and: [nextNoApi, nextjsRegexpPageOnly] }];
