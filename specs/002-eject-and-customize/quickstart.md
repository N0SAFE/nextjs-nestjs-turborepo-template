# Quickstart Guide: Eject and Customize

This guide shows you how to use the eject and customize commands to tailor the monorepo template to your project needs.

## Prerequisites

- Git repository clean (no uncommitted changes)
- Bun 1.2.14+ installed
- Docker running (optional, but recommended for validation)

## Understanding Eject vs Customize

**`bun run eject`**: Removes template showcase code and lets you choose which optional features to remove (ORPC, Better Auth, Redis, etc.)

**`bun run customize`**: Adds new modules or swaps frameworks in an already-ejected project

## Part 1: Running the Eject Command

### Step 1: Start the Eject Process

```bash
bun run eject
```

This creates a pre-eject backup in your Git repository (automatically staged but not committed yet).

### Step 2: View Eject Progress

```
✓ Git environment verified
✓ Feature manifests loaded from .eject-manifests/
✓ Backup checkpoint created
→ Starting interactive feature selection...
```

### Step 3: Respond to Interactive Prompts

The system will ask which features you want to remove:

```
Select features to remove:
❯ ◉ Template Showcase (demo code, README sections)
  ◉ ORPC API Contracts (use REST or tRPC instead)
  ◯ Better Auth (replace with NextAuth or custom auth)
  ◯ Redis Cache (if not needed)
  ◯ Tailwind CSS (use another CSS framework)

Use ↑ ↓ to navigate, Space to toggle, Enter to confirm
```

**Navigation**:
- `↑ ↓` arrow keys to select items
- `Space` to toggle selected feature on/off
- `Enter` to confirm your selections

**Example selections**:

**Minimal setup** (keep everything except showcase):
```
✓ Template Showcase
◯ ORPC API Contracts
◯ Better Auth
◯ Redis Cache
◯ Tailwind CSS
```

**Lean backend** (remove auth and cache):
```
✓ Template Showcase
✓ Better Auth
✓ Redis Cache
◯ ORPC API Contracts
◯ Tailwind CSS
```

**Framework-agnostic** (remove template patterns):
```
✓ Template Showcase
✓ ORPC API Contracts
✓ Better Auth
✓ Redis Cache
◯ Tailwind CSS
```

### Step 4: Review Pre-Removal Analysis

```
Analyzing selected removals...

Files to remove: 245 files
Directories to clean: 18 directories
Dependencies to remove: 12 packages
  - @orpc/contract@latest
  - better-auth@latest
  - redis@latest
  - (9 more)

Compatibility check: ✓ PASS
  - TypeScript compilation passes
  - All remaining imports are valid
  - Build will succeed

Ready to proceed? (yes/no):
```

Review the analysis. Type `yes` to proceed or `no` to abort.

### Step 5: Monitor Removal Execution

```
Removing selected features... (Phase 1/3)
  [████████████████░░░░░░░░░░░░░░░░░░░░░░] 45%
  - Removed showcase pages (12 files)
  - Removed ORPC contracts (8 files)
  - Removed Better Auth config (5 files)

Cleaning up dependencies... (Phase 2/3)
  [██████████████████████████████████████] 100%
  - Removed @orpc/contract
  - Removed better-auth
  - (10 more packages)

Validating result... (Phase 3/3)
  [██████████████████████████████████████] 100%
  ✓ TypeScript: No errors
  ✓ Imports: All valid
  ✓ Build: Ready
  ✓ Docker: Can start containers

✅ Eject completed successfully!

Summary:
  Operation took 1m 23s
  245 files removed
  12 packages removed
  3 configuration files updated
  
Next steps:
  1. Review EJECT_SUMMARY.md for detailed changes
  2. Test your project: bun run dev
  3. Run tests: bun run test
  4. Commit changes: git commit -m "chore: eject template showcase"
```

### Step 6: Verify the Eject

```bash
# Read the detailed summary
cat EJECT_SUMMARY.md

# Check what was removed
git diff HEAD~1 --stat

# Start development to verify everything works
bun run dev
```

### Step 7: Commit Your Changes

```bash
git add .
git commit -m "chore: eject template features

- Removed template showcase code
- Removed ORPC and Better Auth
- Updated documentation
- Cleaned up unused dependencies"
```

## Part 2: Running the Customize Command (Post-Eject)

### Prerequisites for Customize

You must have ejected first:
```bash
✓ Eject completed before customize
```

### Step 1: Start the Customize Process

```bash
bun run customize
```

### Step 2: Choose What to Add

```
What would you like to add to your project?

◯ Modules (add features like Stripe, Analytics, GraphQL)
◯ Framework Swap (replace ORPC with tRPC, etc.)
◯ Custom Configuration (advanced settings)

Use ↑ ↓ to navigate, Space to toggle, Enter to confirm
```

### Step 3a: Adding Modules

Select "Modules":

```
Available modules:

❯ ◯ Stripe Payment Integration
  ◯ PostHog Analytics
  ◯ GraphQL Federation
  ◯ Bull Queue for Background Jobs

Use ↑ ↓ to navigate, Space to toggle, Enter to confirm
```

**To add Stripe**:

1. Navigate to "Stripe Payment Integration"
2. Press Space to select (✓ appears)
3. Press Enter to confirm

```
Installing Stripe Payment Integration...

Checking compatibility:
  ✓ Better Auth present (required)
  ✓ No conflicts detected

Installing dependencies:
  + stripe@latest
  + @stripe/react-stripe-js@latest
  + @stripe/stripe-js@latest
  (3 packages installed)

Creating API endpoints:
  + apps/api/src/modules/payments/stripe.controller.ts
  + apps/api/src/modules/payments/stripe.service.ts

Creating web components:
  + apps/web/src/components/PaymentForm.tsx
  + apps/web/src/components/CheckoutButton.tsx

Updating configuration:
  ✓ Updated apps/api/src/app.module.ts
  ✓ Updated .env with required variables

Required environment variables (add to .env):
  STRIPE_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...

Next steps:
  1. Add Stripe API keys to .env
  2. Run bun run dev
  3. Test payment flow at http://localhost:3000/checkout
  4. See full docs: docs/modules/stripe-integration.md
```

### Step 3b: Framework Swap

Select "Framework Swap":

```
Available framework swaps:

❯ ◯ ORPC to tRPC
  ◯ Better Auth to NextAuth.js
  ◯ Next.js App Router to Pages Router

Use ↑ ↓ to navigate, Space to toggle, Enter to confirm
```

**To swap ORPC to tRPC**:

1. Navigate to "ORPC to tRPC"
2. Press Space to select
3. Press Enter to confirm

```
Pre-swap verification:

Checking requirements:
  ✓ Git repository is clean
  ✓ ORPC contracts found (12 procedures)
  ✓ No active ORPC client calls in tests
  ! 8 files will be modified
  ! 3 new packages will be installed

Pre-swap checklist:
  □ Read tRPC documentation (https://trpc.io)
  □ Backup current ORPC schema
  ✓ All checks passed

Proceed with tRPC migration? (yes/no):
```

Type `yes` to continue:

```
Executing framework swap... (ORPC → tRPC)

Phase 1: Backup current state
  ✓ Backed up to .eject-backup/orpc-to-trpc-{timestamp}

Phase 2: Install tRPC packages
  + @trpc/server@latest
  + @trpc/client@latest
  + @trpc/react-query@latest
  (3 packages installed)

Phase 3: Transform ORPC code to tRPC
  ✓ Converted packages/api-contracts/ → packages/trpc-router/
  ✓ Updated apps/api/src/main.ts
  ✓ Updated apps/web/src/lib/api.ts
  ✓ Migrated 12 procedures to tRPC router
  ✓ Updated type exports

Phase 4: Validate transformation
  ✓ TypeScript: No errors
  ✓ Imports: All valid
  ✓ tRPC router: Ready
  ✓ Build: Success

Post-swap validation:
  ✓ tRPC server starts without errors
  ✓ Client can call tRPC endpoints
  ✓ All 12 procedures accessible
  ✓ Tests pass: 156/156

✅ Framework swap completed successfully!

Swap took 2m 5s

Next steps:
  1. Review swap_summary.md for detailed changes
  2. Test with: bun run dev
  3. Review tRPC configuration: docs/framework-swaps/orpc-to-trpc.md
  4. Commit: git commit -m "chore: swap ORPC to tRPC"

Rollback available for 1 hour:
  git reset --hard .eject-backup/orpc-to-trpc-{timestamp}
```

## Troubleshooting

### Issue: "Eject failed at phase 2"

**Cause**: File removal encountered an error

**Solution**:
```bash
# Rollback to before eject started
git reset --hard
```

### Issue: "Git repository has uncommitted changes"

**Cause**: You have modified files not yet committed

**Solution**:
```bash
# Either commit your changes
git add .
git commit -m "your changes"

# Or stash them temporarily
git stash

# Then retry eject
bun run eject
```

### Issue: "Module X is incompatible"

**Cause**: The module requires a feature you removed

**Solution**:
Check the error message to see which features are required, then either:
1. Re-add that feature using customize
2. Choose a different module
3. Manually implement the feature

### Issue: Framework swap failed mid-way

**Cause**: An error occurred during transformation

**Solution**:
```bash
# Automatic rollback available
git reset --hard

# Or manually use backup
git reset --hard .eject-backup/framework-swap-{timestamp}

# Check logs for detailed error
cat .eject-logs/latest-swap.json
```

### Issue: "Build fails after customize"

**Cause**: New module has dependency conflicts

**Solution**:
```bash
# Check what packages were added
git diff HEAD~1 package.json

# Verify compatibility
bun run type-check

# Check full build output
bun run build 2>&1 | tail -50

# Ask for help with module
cat docs/modules/{module-name}/TROUBLESHOOTING.md
```

## Common Workflows

### Workflow 1: Fresh Project Setup

```bash
# 1. Clone template
git clone <template-url> my-project
cd my-project

# 2. Initialize environment
bun run init

# 3. Eject showcase and keep modern stack
bun run eject
# Select: ✓ Template Showcase only
# Keep everything else

# 4. Add your custom modules
bun run customize
# Select: Stripe + Analytics

# 5. Start development
bun run dev

# 6. Commit
git add .
git commit -m "Initial project setup"
```

### Workflow 2: REST API Instead of ORPC

```bash
# 1. Eject ORPC
bun run eject
# Select: ✓ ORPC API Contracts

# 2. Or swap to tRPC
bun run customize
# Select: Framework Swap → ORPC to tRPC

# 3. Build with your chosen framework
bun run build
```

### Workflow 3: Production-Ready Setup

```bash
# 1. Remove everything unnecessary
bun run eject
# Select: Everything except showcase

# 2. Add only needed modules
bun run customize
# Add: Stripe (payments) + PostHog (analytics)

# 3. Verify production build
bun run build

# 4. Test in Docker
docker-compose -f docker-compose.prod.yml up

# 5. Deploy
git push production
```

## Creating Your Own Feature Manifests

For maintainers: To add new features to be ejected, create a manifest in `.eject-manifests/`:

```json
{
  "version": "1.0",
  "feature": {
    "id": "my-feature",
    "name": "My Feature",
    "description": "Description of what this feature adds"
  },
  "files": {
    "directories": ["path/to/dir"],
    "files": ["path/to/file.ts"],
    "patterns": ["**/*my-feature*"]
  },
  "dependencies": {
    "remove": ["package-name"],
    "packageJsonFields": {
      "scripts": ["my-feature"]
    }
  },
  "configuration": {
    "remove": {
      "configFiles": [".env.example"]
    }
  },
  "documentation": {
    "updateReadme": ["Remove section: 'My Feature'"],
    "removeFiles": ["docs/my-feature/"]
  },
  "validation": {
    "requiredRemains": [],
    "incompatibleWith": ["other-feature"]
  },
  "rollback": {
    "type": "git",
    "backupLocation": ".eject-backup"
  }
}
```

Then use it:
```bash
bun run eject
# Your new feature appears in the selection list
```

## Next Steps

- Read the full documentation: [`docs/eject-customize/`](../../../docs/features/EJECT-CUSTOMIZE.md)
- Check research decisions: [`specs/002-eject-and-customize/research.md`](./research.md)
- Understand the data model: [`specs/002-eject-and-customize/data-model.md`](./data-model.md)
- Review available modules: [`specs/002-eject-and-customize/contracts/feature-registry.example.json`](./contracts/feature-registry.example.json)

---

**Questions?** See [`docs/troubleshooting/EJECT-CUSTOMIZE.md`](../../../docs/troubleshooting/EJECT-CUSTOMIZE.md) or open an issue.
