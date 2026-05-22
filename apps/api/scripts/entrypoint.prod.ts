#!/usr/bin/env -S bun

import { existsSync } from "fs";
import { execSync, spawn } from "child_process";
import { validateApiEnv, apiEnvIsValid, validateApiEnvSafe } from "@repo/env";
import zod from "zod/v4";

interface EntrypointConfig {
  skipMigrations: boolean;
  diagnosePath: string;
  migrateScript: string;
  seedScript: string;
}

/**
 * Validate environment variables at startup
 */
function validateEnvironment(): void {
  console.log("🔍 Validating environment variables...");

  if (!apiEnvIsValid(process.env)) {
    const result = validateApiEnvSafe(process.env);
    console.error("❌ Environment validation failed:");
    if (!result.success) {
      console.error(zod.prettifyError(result.error));
    }
    process.exit(1);
  }

  console.log("✅ Environment validation passed\n");
}

/**
 * Run diagnostics if available
 */
function runDiagnostics(config: EntrypointConfig): void {
  if (existsSync(config.diagnosePath)) {
    console.log("════════════════════════════════════════════════════════");
    console.log("Running Build Environment Diagnostics...");
    console.log("════════════════════════════════════════════════════════");

    try {
      execSync(`bun --bun ${config.diagnosePath}`, { stdio: "inherit" });
    } catch (error) {
      console.error("⚠️  Diagnostics failed, continuing...");
    }

    console.log("════════════════════════════════════════════════════════");
  }
}

/**
 * Run database migrations
 */
function runMigrations(config: EntrypointConfig): void {
  if (config.skipMigrations) {
    console.log("⏭️  SKIP_MIGRATIONS set, skipping migrations and seeding");
    return;
  }

  const apiPackageJson = "package.json";

  if (!existsSync(apiPackageJson)) {
    console.log("⚠️  package.json missing, skipping migrations and seeding");
    return;
  }

  console.log("Found package.json - running migrations");

  try {
    console.log("📦 Running database migrations...");
    execSync(`bun run ${config.migrateScript}`, { stdio: "inherit" });
  } catch (error) {
    console.error("⚠️  db:migrate failed (continuing)");
  }
}

/**
 * Run database seeding (optional, controlled by environment)
 */
function runSeeding(config: EntrypointConfig): void {
  if (config.skipMigrations) {
    console.log("⏭️  SKIP_MIGRATIONS set, skipping seeding");
    return;
  }

  // Only seed if explicitly enabled via ENABLE_SEEDING=true
  if (process.env.ENABLE_SEEDING !== "true") {
    console.log(
      "⏭️  ENABLE_SEEDING not set, skipping seeding (production mode)",
    );
    return;
  }

  try {
    console.log("🌱 Running database seeding...");
    execSync(`bun run ${config.seedScript}`, { stdio: "inherit" });
  } catch (error) {
    console.error("⚠️  db:seed failed (continuing)");
  }
}

/**
 * Create default admin user if needed
 */
function createDefaultAdmin(): void {
  // In production, use the compiled script from dist/
  const createAdminScript = "dist/create-default-admin.js";

  if (!existsSync(createAdminScript)) {
    console.log(
      "⚠️  create-default-admin script not found at",
      createAdminScript,
      ", skipping",
    );
    return;
  }

  try {
    console.log("👤 Creating default admin user if needed...");
    execSync(`bun --bun ${createAdminScript}`, { stdio: "inherit" });
  } catch (error) {
    console.error("⚠️  Failed to create default admin user:", error);
    // Don't exit - this is not critical
  }
}

/**
 * Start API in production mode
 */
function startAPI(): void {
  const mode =
    process.env.ENABLE_SEEDING === "true"
      ? "production-like (with mock data)"
      : "production";
  console.log(`🚀 Starting API in ${mode} mode...`);

  try {
    execSync("bun run start:prod", { stdio: "inherit" });
  } catch (error) {
    console.error("❌ API failed to start:", error);
    process.exit(1);
  }
}

/**
 * Main entrypoint
 */
function main(): void {
  const config: EntrypointConfig = {
    skipMigrations: process.env.SKIP_MIGRATIONS === "true",
    diagnosePath: "scripts/diagnose-build.ts",
    migrateScript: "db:migrate:prod",
    seedScript: "db:seed:prod",
  };

  const mode =
    process.env.ENABLE_SEEDING === "true"
      ? "Production-Like (with mock data)"
      : "Production";
  console.log(`🎯 API ${mode} Entrypoint Started\n`);

  // Validate environment before starting
  validateEnvironment();

  runDiagnostics(config);

  // Run migrations first (schema must exist before any user creation)
  runMigrations(config);

  // Create default admin BEFORE seeding so seed can detect existing admin
  createDefaultAdmin();

  // Run seeding after admin creation (only in production-like mode)
  runSeeding(config);

  startAPI();
}

main();
