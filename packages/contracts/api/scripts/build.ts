#!/usr/bin/env -S bun

import { build } from "bun";
import path from "path";

type ChokidarModule = typeof import("chokidar");

let chokidar: ChokidarModule | null = null;
try {
  chokidar = await import('chokidar');
} catch {
  // chokidar not available, watch mode will be unavailable
}

const rootDir = path.resolve(import.meta.dir, "..");

// Parse command line arguments
const args = process.argv.slice(2);
const watch = args.includes("--watch");

async function buildContracts() {
  console.log("Building ORPC API contracts...");

  const result = await build({
    entrypoints: [path.join(rootDir, "index.ts")],
    outdir: path.join(rootDir, "dist"),
    format: "esm",
    target: "bun",
    minify: {
      whitespace: true,
      identifiers: true,
      syntax: true,
    },
    splitting: true,
    naming: {
      entry: "[dir]/[name].js",
      chunk: "[dir]/[name]-[hash].js",
      asset: "[name]-[hash][ext]",
    },
    external: [
      "@orpc/contract",
      "@orpc/shared",
      "zod",
    ],
    root: rootDir,
  });

  if (!result.success) {
    console.error("Build failed:");
    result.logs.forEach((log) => {
      console.error(log);
    });
    process.exit(1);
  }

  console.log("✓ API contracts built successfully");
  console.log(`  Output directory: ${path.join(rootDir, "dist")}`);
}

// Setup file watcher
function setupWatcher() {
  if (!chokidar) {
    console.error('❌ chokidar not available - watch mode requires: bun add -d chokidar');
    process.exit(1);
  }

  console.log('👀 Watching API contracts for changes...');

  const watcher = chokidar.watch(
    [
      path.join(rootDir, 'index.ts'),
      path.join(rootDir, 'modules/**/*.ts'),
      path.join(rootDir, 'common/**/*.ts'),
    ],
    {
      ignored: /(^|[/\\])\.|node_modules|dist/,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    }
  );

  let isBuilding = false;

  const rebuild = async () => {
    if (isBuilding) return;
    isBuilding = true;
    try {
      await buildContracts();
    } catch (error: unknown) {
      console.error('❌ Build failed:', error);
    } finally {
      isBuilding = false;
    }
  };

  watcher.on('change', () => {
    void rebuild();
  });
  watcher.on('add', () => {
    void rebuild();
  });
  watcher.on('unlink', () => {
    void rebuild();
  });

  console.log('✅ Watcher ready. Press Ctrl+C to stop.');
}

buildContracts()
  .then(() => {
    if (watch) {
      try {
        setupWatcher();
      } catch (error: unknown) {
        console.error("Watcher error:", error);
        process.exit(1);
      }
    }
  })
  .catch((error: unknown) => {
    console.error("Build error:", error);
    process.exit(1);
  });
