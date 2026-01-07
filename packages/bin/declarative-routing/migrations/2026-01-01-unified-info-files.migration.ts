#!/usr/bin/env npx tsx
/**
 * Migration: unified-info-files
 * Date: 2026-01-01
 *
 * This migration script handles the transition from the old info file naming convention
 * to the new unified naming system:
 *
 * 1. page.info.ts → route.info.ts (for pages and layouts)
 * 2. route.info.ts → api.info.ts (for API routes only)
 *
 * This migration is AGGRESSIVE - it will:
 * - Delete ALL legacy info files (page.info.ts, route.info.ts in API dirs)
 * - Ensure every directory has the CORRECT info file naming
 * - Never skip - always process and clean up
 *
 * @see ./2026-01-01-unified-info-files.doc.md for full documentation
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

// ============================================================================
// Types
// ============================================================================

interface MigrationOptions {
  dryRun: boolean;
  appDir: string;
  verbose: boolean;
}

interface MigrationResult {
  renamed: string[];
  deleted: string[];
  errors: string[];
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const appDirIndex = args.findIndex((arg) => arg === "--app-dir");
  const appDir =
    appDirIndex !== -1 && args[appDirIndex + 1]
      ? path.resolve(args[appDirIndex + 1])
      : process.cwd();

  return {
    dryRun: args.includes("--dry-run"),
    appDir,
    verbose: args.includes("--verbose") || args.includes("-v"),
  };
}

function printHelp(): void {
  console.log(`
Unified Info Files Migration
=============================

Migrates declarative routing info files to the new naming convention:
  - page.info.ts → route.info.ts (for pages/layouts)
  - route.info.ts → api.info.ts (for API routes)

This migration is AGGRESSIVE - it ensures ALL files are in the correct state.

Usage:
  npx tsx 2026-01-01-unified-info-files.migration.ts [options]

Options:
  --dry-run        Preview changes without modifying files
  --app-dir <path> Target directory (default: current directory)
  --verbose, -v    Show detailed output
  --help, -h       Show this help message

Examples:
  # Preview changes in current directory
  npx tsx 2026-01-01-unified-info-files.migration.ts --dry-run

  # Run migration on a specific app
  npx tsx 2026-01-01-unified-info-files.migration.ts --app-dir ./apps/web/src/app

  # Run with verbose output
  npx tsx 2026-01-01-unified-info-files.migration.ts --verbose
`);
}

// ============================================================================
// File System Helpers
// ============================================================================

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function findSourceFile(
  dir: string,
  type: "page" | "api"
): { exists: boolean; file: string | null } {
  if (type === "page") {
    const pagePatterns = ["page.tsx", "page.ts", "layout.tsx", "layout.ts"];
    for (const pattern of pagePatterns) {
      const filePath = path.join(dir, pattern);
      if (fileExists(filePath)) {
        return { exists: true, file: pattern };
      }
    }
    return { exists: false, file: null };
  } else {
    const routePatterns = ["route.ts", "route.tsx"];
    for (const pattern of routePatterns) {
      const filePath = path.join(dir, pattern);
      if (fileExists(filePath)) {
        return { exists: true, file: pattern };
      }
    }
    return { exists: false, file: null };
  }
}

function safeDelete(filePath: string, dryRun: boolean): boolean {
  if (!fileExists(filePath)) return false;
  if (!dryRun) {
    fs.unlinkSync(filePath);
  }
  return true;
}

function safeRename(oldPath: string, newPath: string, dryRun: boolean): boolean {
  if (!fileExists(oldPath)) return false;
  if (!dryRun) {
    fs.renameSync(oldPath, newPath);
  }
  return true;
}

// ============================================================================
// Migration Logic
// ============================================================================

async function migrateDirectory(
  dir: string,
  options: MigrationOptions,
  result: MigrationResult
): Promise<void> {
  const { appDir, dryRun, verbose } = options;
  const relDir = path.relative(appDir, dir) || ".";

  // Check what source files exist
  const pageSource = findSourceFile(dir, "page");
  const apiSource = findSourceFile(dir, "api");

  // Check what info files exist
  const pageInfoTs = path.join(dir, "page.info.ts");
  const pageInfoJs = path.join(dir, "page.info.js");
  const routeInfoTs = path.join(dir, "route.info.ts");
  const routeInfoJs = path.join(dir, "route.info.js");
  const apiInfoTs = path.join(dir, "api.info.ts");
  const apiInfoJs = path.join(dir, "api.info.js");

  const hasPageInfoTs = fileExists(pageInfoTs);
  const hasPageInfoJs = fileExists(pageInfoJs);
  const hasRouteInfoTs = fileExists(routeInfoTs);
  const hasRouteInfoJs = fileExists(routeInfoJs);
  const hasApiInfoTs = fileExists(apiInfoTs);
  const hasApiInfoJs = fileExists(apiInfoJs);

  // Determine what this directory IS
  const isApiDir = apiSource.exists && !pageSource.exists;
  const isPageDir = pageSource.exists && !apiSource.exists;
  const isAmbiguous = apiSource.exists && pageSource.exists;
  const isOrphan = !apiSource.exists && !pageSource.exists;

  // Determine specific source type for display
  const getSourceLabel = (): string => {
    if (isApiDir) return `API (${apiSource.file})`;
    if (isPageDir) {
      const file = pageSource.file!;
      if (file.startsWith("page")) return `Page (${file})`;
      if (file.startsWith("layout")) return `Layout (${file})`;
      return `Page/Layout (${file})`;
    }
    if (isAmbiguous) return `AMBIGUOUS (${pageSource.file} + ${apiSource.file})`;
    return "ORPHAN";
  };

  if (verbose) {
    console.log(`\n📂 ${relDir}`);
    console.log(`   Source: ${getSourceLabel()}`);
  }

  // Handle orphan directories - delete all info files
  if (isOrphan) {
    let deleted = false;
    if (safeDelete(pageInfoTs, dryRun)) { result.deleted.push(pageInfoTs); deleted = true; }
    if (safeDelete(pageInfoJs, dryRun)) { result.deleted.push(pageInfoJs); deleted = true; }
    if (safeDelete(routeInfoTs, dryRun)) { result.deleted.push(routeInfoTs); deleted = true; }
    if (safeDelete(routeInfoJs, dryRun)) { result.deleted.push(routeInfoJs); deleted = true; }
    if (safeDelete(apiInfoTs, dryRun)) { result.deleted.push(apiInfoTs); deleted = true; }
    if (safeDelete(apiInfoJs, dryRun)) { result.deleted.push(apiInfoJs); deleted = true; }
    if (verbose && deleted) {
      console.log(`   🗑️  Deleted orphan info files (no source file)`);
    }
    return;
  }

  // Handle ambiguous directories - warn but still clean up legacy files
  if (isAmbiguous) {
    if (verbose) {
      console.log(`   ⚠️  Ambiguous: both ${apiSource.file} and ${pageSource.file} exist`);
    }
    // Still delete page.info.* as it's always legacy
    if (safeDelete(pageInfoTs, dryRun)) { result.deleted.push(pageInfoTs); }
    if (safeDelete(pageInfoJs, dryRun)) { result.deleted.push(pageInfoJs); }
    return;
  }

  // Handle API directories - ensure api.info.* exists, delete everything else
  if (isApiDir) {
    // Priority: api.info.ts > route.info.ts > page.info.ts (for migration source)
    if (hasApiInfoTs || hasApiInfoJs) {
      // Already has correct file, delete all legacy
      if (safeDelete(pageInfoTs, dryRun)) { result.deleted.push(pageInfoTs); if (verbose) console.log(`   🗑️  Deleted: page.info.ts`); }
      if (safeDelete(pageInfoJs, dryRun)) { result.deleted.push(pageInfoJs); if (verbose) console.log(`   🗑️  Deleted: page.info.js`); }
      if (safeDelete(routeInfoTs, dryRun)) { result.deleted.push(routeInfoTs); if (verbose) console.log(`   🗑️  Deleted: route.info.ts`); }
      if (safeDelete(routeInfoJs, dryRun)) { result.deleted.push(routeInfoJs); if (verbose) console.log(`   🗑️  Deleted: route.info.js`); }
      if (verbose) console.log(`   ✅ Correct: api.info.* exists`);
    } else if (hasRouteInfoTs) {
      // Rename route.info.ts → api.info.ts
      if (safeRename(routeInfoTs, apiInfoTs, dryRun)) {
        result.renamed.push(`${routeInfoTs} → ${apiInfoTs}`);
        if (verbose) console.log(`   ✅ Renamed: route.info.ts → api.info.ts`);
      }
      // Delete any page.info.*
      if (safeDelete(pageInfoTs, dryRun)) { result.deleted.push(pageInfoTs); if (verbose) console.log(`   🗑️  Deleted: page.info.ts`); }
      if (safeDelete(pageInfoJs, dryRun)) { result.deleted.push(pageInfoJs); if (verbose) console.log(`   🗑️  Deleted: page.info.js`); }
      if (safeDelete(routeInfoJs, dryRun)) { result.deleted.push(routeInfoJs); if (verbose) console.log(`   🗑️  Deleted: route.info.js`); }
    } else if (hasRouteInfoJs) {
      if (safeRename(routeInfoJs, apiInfoJs, dryRun)) {
        result.renamed.push(`${routeInfoJs} → ${apiInfoJs}`);
        if (verbose) console.log(`   ✅ Renamed: route.info.js → api.info.js`);
      }
      if (safeDelete(pageInfoTs, dryRun)) { result.deleted.push(pageInfoTs); if (verbose) console.log(`   🗑️  Deleted: page.info.ts`); }
      if (safeDelete(pageInfoJs, dryRun)) { result.deleted.push(pageInfoJs); if (verbose) console.log(`   🗑️  Deleted: page.info.js`); }
    } else if (hasPageInfoTs) {
      // Rename page.info.ts → api.info.ts
      if (safeRename(pageInfoTs, apiInfoTs, dryRun)) {
        result.renamed.push(`${pageInfoTs} → ${apiInfoTs}`);
        if (verbose) console.log(`   ✅ Renamed: page.info.ts → api.info.ts`);
      }
      if (safeDelete(pageInfoJs, dryRun)) { result.deleted.push(pageInfoJs); if (verbose) console.log(`   🗑️  Deleted: page.info.js`); }
    } else if (hasPageInfoJs) {
      if (safeRename(pageInfoJs, apiInfoJs, dryRun)) {
        result.renamed.push(`${pageInfoJs} → ${apiInfoJs}`);
        if (verbose) console.log(`   ✅ Renamed: page.info.js → api.info.js`);
      }
    }
    return;
  }

  // Handle page/layout directories - ensure route.info.* exists, delete everything else
  if (isPageDir) {
    // Priority: route.info.ts > page.info.ts (for migration source)
    if (hasRouteInfoTs || hasRouteInfoJs) {
      // Already has correct file, delete all legacy
      if (safeDelete(pageInfoTs, dryRun)) { result.deleted.push(pageInfoTs); if (verbose) console.log(`   🗑️  Deleted: page.info.ts`); }
      if (safeDelete(pageInfoJs, dryRun)) { result.deleted.push(pageInfoJs); if (verbose) console.log(`   🗑️  Deleted: page.info.js`); }
      if (safeDelete(apiInfoTs, dryRun)) { result.deleted.push(apiInfoTs); if (verbose) console.log(`   🗑️  Deleted: api.info.ts`); }
      if (safeDelete(apiInfoJs, dryRun)) { result.deleted.push(apiInfoJs); if (verbose) console.log(`   🗑️  Deleted: api.info.js`); }
      if (verbose) console.log(`   ✅ Correct: route.info.* exists`);
    } else if (hasPageInfoTs) {
      // Rename page.info.ts → route.info.ts
      if (safeRename(pageInfoTs, routeInfoTs, dryRun)) {
        result.renamed.push(`${pageInfoTs} → ${routeInfoTs}`);
        if (verbose) console.log(`   ✅ Renamed: page.info.ts → route.info.ts`);
      }
      if (safeDelete(pageInfoJs, dryRun)) { result.deleted.push(pageInfoJs); if (verbose) console.log(`   🗑️  Deleted: page.info.js`); }
      if (safeDelete(apiInfoTs, dryRun)) { result.deleted.push(apiInfoTs); if (verbose) console.log(`   🗑️  Deleted: api.info.ts`); }
      if (safeDelete(apiInfoJs, dryRun)) { result.deleted.push(apiInfoJs); if (verbose) console.log(`   🗑️  Deleted: api.info.js`); }
    } else if (hasPageInfoJs) {
      if (safeRename(pageInfoJs, routeInfoJs, dryRun)) {
        result.renamed.push(`${pageInfoJs} → ${routeInfoJs}`);
        if (verbose) console.log(`   ✅ Renamed: page.info.js → route.info.js`);
      }
      if (safeDelete(apiInfoTs, dryRun)) { result.deleted.push(apiInfoTs); if (verbose) console.log(`   🗑️  Deleted: api.info.ts`); }
      if (safeDelete(apiInfoJs, dryRun)) { result.deleted.push(apiInfoJs); if (verbose) console.log(`   🗑️  Deleted: api.info.js`); }
    }
    return;
  }
}

async function migrate(options: MigrationOptions): Promise<void> {
  const { appDir, dryRun, verbose } = options;

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     Declarative Routing: Unified Info Files Migration      ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No files will be modified\n");
  }

  console.log(`📁 Target directory: ${appDir}`);

  if (!fileExists(appDir)) {
    console.error(`\n❌ Error: Directory does not exist: ${appDir}`);
    process.exit(1);
  }

  const result: MigrationResult = {
    renamed: [],
    deleted: [],
    errors: [],
  };

  // Find ALL directories that have any info files
  const allInfoFiles = await glob("**/*.info.{ts,js}", {
    cwd: appDir,
    absolute: true,
    ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  });

  // Get unique directories
  const directories = [...new Set(allInfoFiles.map((f) => path.dirname(f)))];

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Processing ${directories.length} directories with info files`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  for (const dir of directories.sort()) {
    await migrateDirectory(dir, options, result);
  }

  // Summary
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                     Migration Summary                       ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`  ✅ Renamed: ${result.renamed.length} file(s)`);
  console.log(`  🗑️  Deleted: ${result.deleted.length} file(s)`);
  console.log(`  ❌ Errors:  ${result.errors.length}`);

  if (result.renamed.length > 0 && verbose) {
    console.log("\nRenamed files:");
    result.renamed.forEach((r) => console.log(`  - ${r}`));
  }

  if (result.deleted.length > 0 && verbose) {
    console.log("\nDeleted files:");
    result.deleted.forEach((d) => console.log(`  - ${d}`));
  }

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }

  if (dryRun) {
    console.log("\n📝 This was a dry run. Run without --dry-run to apply changes.");
  } else {
    console.log("\n✨ Migration complete!");
    console.log("\n📌 Next steps:");
    console.log("   1. Run `bun run dr:build` to regenerate routes");
    console.log("   2. Review changes with `git diff`");
    console.log("   3. Run your tests to verify everything works");
  }
}

// Run the migration
migrate(parseArgs()).catch((error) => {
  console.error("\n❌ Migration failed:", error);
  process.exit(1);
});
