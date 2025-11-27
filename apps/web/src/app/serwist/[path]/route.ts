import { createSerwistRoute } from "@serwist/turbopack";

// Create the Serwist route handler with the service worker source file
export const { GET, generateStaticParams } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  nextConfig: {
    basePath: "/",
    distDir: ".next",
  },
});
