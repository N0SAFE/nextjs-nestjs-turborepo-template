# Migration: Unified Info Files

**Date:** 2026-01-01  
**Migration File:** `2026-01-01-unified-info-files.migration.ts`  
**Status:** Active

## Overview

This migration updates the declarative routing info file naming convention to provide clearer separation between page/layout routes and API routes.

### Changes

| Before | After | Context |
|--------|-------|---------|
| `page.info.ts` | `route.info.ts` | For directories with `page.tsx` or `layout.tsx` |
| `route.info.ts` | `api.info.ts` | For directories with `route.ts` (API routes) |

## Motivation

The previous naming convention used `page.info.ts` for pages and `route.info.ts` for API routes. This was confusing because:

1. **Layouts also need info files** - Using `page.info.ts` for layouts was semantically incorrect
2. **"route" is ambiguous** - In Next.js, "route" specifically refers to API routes (`route.ts`), not page routes
3. **Unified terminology** - Using `route.info.ts` for pages/layouts and `api.info.ts` for API routes provides clearer intent

## Before Migration

```
app/
├── page.tsx
├── page.info.ts          ← Info for the page
├── dashboard/
│   ├── layout.tsx
│   ├── page.info.ts      ← Info for the layout (confusing name!)
│   └── page.tsx
└── api/
    └── users/
        ├── route.ts
        └── route.info.ts ← Info for the API route
```

## After Migration

```
app/
├── page.tsx
├── route.info.ts         ← Info for the page (clearer!)
├── dashboard/
│   ├── layout.tsx
│   ├── route.info.ts     ← Info for the layout (now makes sense)
│   └── page.tsx
└── api/
    └── users/
        ├── route.ts
        └── api.info.ts   ← Info for the API route (explicit!)
```

## Running the Migration

### Prerequisites

- Node.js 18+ or Bun
- `glob` package installed (included in `@repo/declarative-routing`)

### Basic Usage

```bash
# Navigate to the declarative-routing package
cd packages/bin/declarative-routing

# Preview changes (recommended first)
npx tsx migrations/2026-01-01-unified-info-files.migration.ts --dry-run --app-dir ../../apps/web/src/app

# Run the migration
npx tsx migrations/2026-01-01-unified-info-files.migration.ts --app-dir ../../apps/web/src/app
```

### From Monorepo Root

```bash
# Preview changes
bun run --filter=@repo/declarative-routing tsx migrations/2026-01-01-unified-info-files.migration.ts --dry-run --app-dir ./apps/web/src/app

# Run migration
bun run --filter=@repo/declarative-routing tsx migrations/2026-01-01-unified-info-files.migration.ts --app-dir ./apps/web/src/app
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes without modifying files | `false` |
| `--app-dir <path>` | Target directory to scan | Current directory |
| `--verbose`, `-v` | Show detailed output | `false` |
| `--help`, `-h` | Show help message | - |

## Migration Logic

### Phase 1: page.info.* Files

For each `page.info.ts` (or `.js`) file found:

1. **Check directory contents:**
   - If `route.ts` exists → This is an API directory
     - If `api.info.ts` already exists → Delete `page.info.ts`
     - Otherwise → Rename to `api.info.ts`
   - If `page.tsx` or `layout.tsx` exists → This is a page/layout directory
     - If `route.info.ts` already exists → Delete `page.info.ts`
     - Otherwise → Rename to `route.info.ts`
   - If neither exists → Skip (orphaned info file)

### Phase 2: route.info.* Files in API Directories

For each `route.info.ts` (or `.js`) file found:

1. **Check if it's an API directory:**
   - If `route.ts` exists AND no `page.tsx`/`layout.tsx`:
     - If `api.info.ts` already exists → Delete `route.info.ts`
     - Otherwise → Rename to `api.info.ts`
   - If both `route.ts` and `page.tsx`/`layout.tsx` exist → Skip (ambiguous)
   - If only `page.tsx`/`layout.tsx` exists → Skip (already correct location)

## Edge Cases

### Orphaned Info Files

Info files without corresponding source files are skipped:

```
app/
└── old-feature/
    └── page.info.ts  ← Skipped (no page.tsx, layout.tsx, or route.ts)
```

**Resolution:** Manually delete orphaned files or create the corresponding source file.

### Ambiguous Directories

Directories with both `route.ts` AND `page.tsx`/`layout.tsx` are skipped:

```
app/
└── weird/
    ├── route.ts      ← API route
    ├── page.tsx      ← Page component
    └── route.info.ts ← Skipped (ambiguous)
```

**Resolution:** This is an unusual Next.js setup. Manually decide which info file type is appropriate.

### Pre-existing New Files

If both old and new naming exists, the old file is deleted:

```
app/
└── users/
    ├── page.tsx
    ├── page.info.ts  ← Will be DELETED
    └── route.info.ts ← Will be KEPT
```

## Post-Migration Steps

1. **Rebuild routes:**
   ```bash
   bun run dr:build
   # or
   bun run web -- dr:build
   ```

2. **Verify imports:**
   Check that `@/routes/index.ts` now imports from the correct info files.

3. **Run tests:**
   ```bash
   bun run test
   ```

4. **Review git changes:**
   ```bash
   git diff
   git status
   ```

## Rollback

If you need to revert the migration:

### Manual Rollback

```bash
# Revert all changes
git checkout -- .

# Or selectively revert info files
git checkout -- "**/route.info.ts" "**/api.info.ts"
```

### Reverse Migration (Not Recommended)

There is no automated reverse migration. The new naming convention is the preferred standard going forward.

## Troubleshooting

### "No source file found in directory"

The info file exists but there's no corresponding `page.tsx`, `layout.tsx`, or `route.ts`.

**Solution:** Either delete the orphaned info file or create the missing source file.

### "Ambiguous directory"

Both `route.ts` and `page.tsx`/`layout.tsx` exist in the same directory.

**Solution:** This is unusual in Next.js. Review the directory and manually decide on the info file type.

### Migration didn't find any files

The target directory might be incorrect.

**Solution:** Use `--verbose` flag and verify `--app-dir` points to your `app/` directory (e.g., `./apps/web/src/app`).

## Related

- [Declarative Routing README](../README.md)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Route Handlers (API Routes)](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
