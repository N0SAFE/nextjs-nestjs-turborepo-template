import withBundleAnalyzer from "@next/bundle-analyzer";
import { NextConfig } from "next";
import { envSchema } from "./env";

// Check if we're running in a lint context or other non-build contexts
const commandLine = process.argv.join(" ");
const isLintContext =
  process.argv.includes("lint") ||
  process.argv.some((arg) => arg.includes("eslint")) ||
  process.env.npm_lifecycle_event === "lint" ||
  process.env.npm_lifecycle_script?.includes("lint") ||
  process.argv.some((arg) => arg.includes("next-lint")) ||
  commandLine.endsWith("lint");
  
  const isCompileContext = 
  process.env.COMPILE_MODE === "true" ||
  process.argv.includes("--experimental-build-mode=compile") ||
  process.argv.includes("--build-mode=compile") ||
  process.env.npm_lifecycle_event === "compile" ||
  process.env.npm_lifecycle_script?.includes("compile");

if (!process.env.API_URL) {
  if (isLintContext || isCompileContext) {
    // Provide a default URL for linting context to avoid breaking the lint process
    process.env.API_URL = "http://localhost:3001";
    console.warn(
      "API_URL not defined, using default for lint context:",
      process.env.API_URL,
    );
  } else {
    throw new Error("API_URL is not defined");
  }
}

// Handle both full URLs and hostname-only values (for Render deployment)
const apiUrl = new URL(envSchema.shape.API_URL.parse(process.env.API_URL));

const noCheck = process.env.CHECK_ON_BUILD !== "true";

const nextConfig: NextConfig = {
  // Required for @serwist/turbopack PWA support
  serverExternalPackages: ["esbuild-wasm"],
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl.href}/api/auth/:path*`,
      },
      {
        source: "/api/nest/:path*",
        destination: `${apiUrl.href}/:path*`,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: noCheck,
    // compilerOptions: {
    //   experimentalDecorators: true,
    //   useDefineForClassFields: true,
    // },
  },
  reactStrictMode: true,
  transpilePackages: ["@repo/nextjs-devtool"],
  cacheComponents: true,
  reactCompiler: true, // disable because of https://github.com/vercel/next.js/issues/85234
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
      },
      {
        hostname: "avatars.githubusercontent.com",
        protocol: "https",
      },
    ],
  },

  webpack: (config, context) => {
    // Enable polling based on env variable being set
    if (process.env.NEXT_WEBPACK_USEPOLLING) {
      config.watchOptions = {
        poll: 500,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

// Enable MDX and Fumadocs source generation
let exp: NextConfig = nextConfig;

if (process.env.ANALYZE === "true") {
  exp = withBundleAnalyzer()(exp);
}

module.exports = (
  phase: string,
  {
    defaultConfig,
  }: {
    defaultConfig: NextConfig;
  },
) => {
  return {
    ...defaultConfig,
    ...exp,
    env: {
      PHASE: phase,
      ...defaultConfig.env,
      ...exp.env,
    },
  };
};
