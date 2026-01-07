# Declarative Routing Migrations

This folder contains migration scripts for the `@repo/declarative-routing` package. Migrations help users upgrade their codebase when breaking changes are introduced to the declarative routing system.

## Folder Structure

```
migrations/
├── README.md                              # This file
├── YYYY-MM-DD-migration-name.migration.ts # Migration script
└── YYYY-MM-DD-migration-name.doc.md       # Documentation for the migration
```

## Naming Convention

Each migration consists of two files with matching names:

1. **Migration Script**: `YYYY-MM-DD-migration-name.migration.ts`
   - Contains the executable migration logic
   - Can be run via `npx tsx migrations/YYYY-MM-DD-migration-name.migration.ts`

2. **Documentation**: `YYYY-MM-DD-migration-name.doc.md`
   - Explains what the migration does
   - Documents the "before" and "after" states
   - Lists any manual steps required
   - Provides rollback instructions if applicable

## Running Migrations

### From the declarative-routing package directory

```bash
# Run a specific migration
npx tsx migrations/YYYY-MM-DD-migration-name.migration.ts [options]

# Example with dry-run
npx tsx migrations/2026-01-01-unified-info-files.migration.ts --dry-run

# Example targeting a specific app
npx tsx migrations/2026-01-01-unified-info-files.migration.ts --app-dir /path/to/your/app
```

### From the monorepo root

```bash
# Using the package script (if configured)
bun run @repo/declarative-routing migrate:MIGRATION_NAME

# Or directly
bun run --filter=@repo/declarative-routing tsx migrations/YYYY-MM-DD-migration-name.migration.ts
```

## Common Options

Most migration scripts support these options:

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without modifying files |
| `--app-dir <path>` | Target a specific app directory |
| `--verbose` | Show detailed output |
| `--help` | Show migration-specific help |

## Creating New Migrations

When adding a new migration:

1. **Create the migration script** following the naming convention
2. **Create the documentation file** with the same date prefix
3. **Add a script entry** to `package.json` for easy access
4. **Test thoroughly** with `--dry-run` before running

### Migration Script Template

```typescript
#!/usr/bin/env npx tsx
/**
 * Migration: MIGRATION_NAME
 * Date: YYYY-MM-DD
 * 
 * Description: Brief description of what this migration does
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

// Migration options
interface MigrationOptions {
  dryRun: boolean;
  appDir: string;
  verbose: boolean;
}

// Parse CLI arguments
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    appDir: args.find((_, i, arr) => arr[i - 1] === "--app-dir") || process.cwd(),
    verbose: args.includes("--verbose"),
  };
}

// Main migration logic
async function migrate(options: MigrationOptions): Promise<void> {
  // Implementation here
}

// Run
migrate(parseArgs()).catch(console.error);
```

## Migration History

| Date | Name | Description |
|------|------|-------------|
| 2026-01-01 | unified-info-files | Migrate `page.info.ts` → `route.info.ts` and API `route.info.ts` → `api.info.ts` |

## Safety Notes

- **Always backup** your project before running migrations
- **Use `--dry-run`** first to preview changes
- **Review the documentation** for each migration before running
- **Check git status** after migration to verify changes
- Migrations are **idempotent** - running them multiple times should be safe
