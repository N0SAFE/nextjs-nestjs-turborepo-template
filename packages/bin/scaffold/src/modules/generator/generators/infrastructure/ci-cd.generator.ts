import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  DependencySpec,
  FileSpec,
  GeneratorContext,
  ScriptSpec,
} from "../../../../types/generator.types";

/**
 * CI/CD Generator
 *
 * Creates comprehensive CI/CD configuration including:
 * - GitHub Actions workflows (lint, test, build, deploy)
 * - Branch protection configuration templates
 * - Environment-specific deployment configs
 * - PR templates and labeling automation
 * - Release workflow with semantic versioning
 * - Security scanning workflows
 *
 * This generator provides a foundation for continuous integration
 * and deployment that can be extended with platform-specific
 * generators like ci-cd-render or ci-cd-vercel.
 */
@Injectable()
export class CiCdGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "ci-cd",
    priority: 45,
    version: "1.0.0",
    description:
      "Comprehensive CI/CD configuration with GitHub Actions workflows for lint, test, build, and deploy",
    contributesTo: [".github/"],
    dependsOn: [],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];
    const projectName = context.projectConfig.name || "my-project";
    const hasVitest = this.hasPlugin(context, "vitest");
    const hasDocker = this.hasPlugin(context, "docker");
    const hasPostgresql = this.hasPlugin(context, "postgresql");
    const hasDrizzle = this.hasPlugin(context, "drizzle");

    // Main CI workflow
    files.push(
      this.file(
        ".github/workflows/ci.yml",
        this.generateCiWorkflow(context, {
          hasVitest,
          hasDocker,
          hasPostgresql,
          hasDrizzle,
        }),
        { mergeStrategy: "replace", priority: 45 },
      ),
    );

    // PR workflow
    files.push(
      this.file(".github/workflows/pr.yml", this.generatePrWorkflow(context), {
        mergeStrategy: "replace",
        priority: 45,
      }),
    );

    // Release workflow
    files.push(
      this.file(
        ".github/workflows/release.yml",
        this.generateReleaseWorkflow(context),
        { mergeStrategy: "replace", priority: 45 },
      ),
    );

    // Security scanning workflow
    files.push(
      this.file(
        ".github/workflows/security.yml",
        this.generateSecurityWorkflow(),
        { mergeStrategy: "replace", priority: 45 },
      ),
    );

    // Dependency updates workflow (Dependabot)
    files.push(
      this.file(".github/dependabot.yml", this.generateDependabotConfig(), {
        mergeStrategy: "replace",
        priority: 45,
      }),
    );

    // PR template
    files.push(
      this.file(
        ".github/pull_request_template.md",
        this.generatePrTemplate(projectName),
        { mergeStrategy: "replace", priority: 45, skipIfExists: true },
      ),
    );

    // Issue templates
    files.push(
      this.file(
        ".github/ISSUE_TEMPLATE/bug_report.md",
        this.generateBugReportTemplate(projectName),
        { mergeStrategy: "replace", priority: 45, skipIfExists: true },
      ),
    );

    files.push(
      this.file(
        ".github/ISSUE_TEMPLATE/feature_request.md",
        this.generateFeatureRequestTemplate(),
        { mergeStrategy: "replace", priority: 45, skipIfExists: true },
      ),
    );

    // Issue template config
    files.push(
      this.file(
        ".github/ISSUE_TEMPLATE/config.yml",
        this.generateIssueConfig(),
        { mergeStrategy: "replace", priority: 45, skipIfExists: true },
      ),
    );

    // Labeler configuration
    files.push(
      this.file(".github/labeler.yml", this.generateLabelerConfig(), {
        mergeStrategy: "replace",
        priority: 45,
      }),
    );

    // Branch protection rules (as documentation)
    files.push(
      this.file(
        ".github/BRANCH_PROTECTION.md",
        this.generateBranchProtectionDocs(),
        { mergeStrategy: "replace", priority: 45, skipIfExists: true },
      ),
    );

    // CODEOWNERS file
    files.push(
      this.file(".github/CODEOWNERS", this.generateCodeowners(), {
        mergeStrategy: "replace",
        priority: 45,
        skipIfExists: true,
      }),
    );

    return files;
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      {
        name: "ci:lint",
        command: "turbo run lint --parallel",
        target: "root",
      },
      {
        name: "ci:type-check",
        command: "turbo run type-check --parallel",
        target: "root",
      },
      {
        name: "ci:test",
        command: "turbo run test --parallel",
        target: "root",
      },
      {
        name: "ci:build",
        command: "turbo run build",
        target: "root",
      },
      {
        name: "ci:all",
        command: "bun run ci:lint && bun run ci:type-check && bun run ci:test && bun run ci:build",
        target: "root",
      },
    ];
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // CI/CD doesn't add runtime dependencies, only workflow files
    return [];
  }

  private generateCiWorkflow(
    context: GeneratorContext,
    options: {
      hasVitest: boolean;
      hasDocker: boolean;
      hasPostgresql: boolean;
      hasDrizzle: boolean;
    },
  ): string {
    const projectName = context.projectConfig.name || "my-project";
    const nodeVersion = "20";
    const bunVersion = "latest";

    let servicesBlock = "";
    if (options.hasPostgresql) {
      servicesBlock = `
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5`;
    }

    let envBlock = "";
    if (options.hasPostgresql) {
      envBlock = `
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db`;
    }

    let migrateStep = "";
    if (options.hasDrizzle && options.hasPostgresql) {
      migrateStep = `
      - name: Run database migrations
        run: bun run api -- db:push`;
    }

    return `# CI/CD Pipeline for ${projectName}
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${bunVersion}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run ESLint
        run: bun run lint

      - name: Check formatting
        run: bun run format:check

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${bunVersion}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run type check
        run: bun run type-check

  test:
    name: Test
    runs-on: ubuntu-latest${servicesBlock}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${bunVersion}

      - name: Install dependencies
        run: bun install --frozen-lockfile${migrateStep}

      - name: Run tests
        run: bun run test${envBlock}

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        if: \${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
        with:
          token: \${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${bunVersion}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build all packages
        run: bun run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            apps/*/dist
            apps/*/.next
            packages/*/dist
          retention-days: 7

  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name == 'pull_request'
    environment:
      name: preview
      url: \${{ steps.deploy.outputs.url }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Deploy to preview
        id: deploy
        run: |
          echo "Preview deployment would happen here"
          echo "url=https://preview-\${{ github.event.pull_request.number }}.example.com" >> \$GITHUB_OUTPUT

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment:
      name: production
      url: \${{ steps.deploy.outputs.url }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Deploy to production
        id: deploy
        run: |
          echo "Production deployment would happen here"
          echo "url=https://example.com" >> \$GITHUB_OUTPUT
`;
  }

  private generatePrWorkflow(context: GeneratorContext): string {
    const projectName = context.projectConfig.name || "my-project";

    return `# PR Automation for ${projectName}
name: PR

on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled, edited]

permissions:
  contents: read
  pull-requests: write

jobs:
  labeler:
    name: Auto Label
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Label PR based on paths
        uses: actions/labeler@v5
        with:
          repo-token: \${{ secrets.GITHUB_TOKEN }}
          configuration-path: .github/labeler.yml

  size-label:
    name: Size Label
    runs-on: ubuntu-latest
    steps:
      - name: Label PR size
        uses: codelytv/pr-size-labeler@v1
        with:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          xs_label: 'size/xs'
          xs_max_size: 10
          s_label: 'size/s'
          s_max_size: 100
          m_label: 'size/m'
          m_max_size: 500
          l_label: 'size/l'
          l_max_size: 1000
          xl_label: 'size/xl'
          message_if_xl: >
            This PR is quite large. Consider breaking it into smaller PRs
            for easier review.

  conventional-commits:
    name: Conventional Commits
    runs-on: ubuntu-latest
    steps:
      - name: Check PR title follows conventional commits
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            build
            ci
            chore
            revert
          requireScope: false
          subjectPattern: ^[A-Z].*(?<!\\.)$
          subjectPatternError: |
            The subject "{subject}" must start with a capital letter
            and not end with a period.

  pr-description:
    name: PR Description Check
    runs-on: ubuntu-latest
    steps:
      - name: Check PR description
        uses: jadrol/pr-description-checker@v1
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          minimum-length: 50
          error-message: |
            Please provide a more detailed PR description (minimum 50 characters).
            Include context about what changes were made and why.
`;
  }

  private generateReleaseWorkflow(context: GeneratorContext): string {
    const projectName = context.projectConfig.name || "my-project";

    return `# Release Workflow for ${projectName}
name: Release

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type (patch, minor, major)'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Generate changelog
        id: changelog
        uses: conventional-changelog/conventional-changelog-action@v6
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          skip-version-file: true
          skip-commit: true

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        if: \${{ steps.changelog.outputs.skipped == 'false' }}
        with:
          tag_name: \${{ steps.changelog.outputs.tag }}
          name: Release \${{ steps.changelog.outputs.tag }}
          body: \${{ steps.changelog.outputs.clean_changelog }}
          draft: false
          prerelease: false

  release-notes:
    name: Update Release Notes
    runs-on: ubuntu-latest
    needs: [release]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate release notes
        uses: release-drafter/release-drafter@v6
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
  }

  private generateSecurityWorkflow(): string {
    return `# Security Scanning Workflow
name: Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    # Run every Monday at 9 AM UTC
    - cron: '0 9 * * 1'

permissions:
  contents: read
  security-events: write
  actions: read

jobs:
  dependency-audit:
    name: Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run security audit
        run: bun audit || true
        continue-on-error: true

  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        language: ['javascript', 'typescript']
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: \${{ matrix.language }}

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:\${{ matrix.language }}"

  secrets-scan:
    name: Secrets Scanning
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog secrets scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: \${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified
`;
  }

  private generateDependabotConfig(): string {
    return `# Dependabot configuration
version: 2
updates:
  # Root dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        dependency-type: "development"
        patterns:
          - "*"
      production-dependencies:
        dependency-type: "production"
        patterns:
          - "*"
    commit-message:
      prefix: "chore(deps)"
    labels:
      - "dependencies"
      - "automated"
    reviewers:
      - "@org/maintainers"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    commit-message:
      prefix: "ci(deps)"
    labels:
      - "ci"
      - "dependencies"
      - "automated"

  # Docker dependencies
  - package-ecosystem: "docker"
    directory: "/docker/compose/api"
    schedule:
      interval: "monthly"
    commit-message:
      prefix: "chore(docker)"
    labels:
      - "docker"
      - "dependencies"

  - package-ecosystem: "docker"
    directory: "/docker/compose/web"
    schedule:
      interval: "monthly"
    commit-message:
      prefix: "chore(docker)"
    labels:
      - "docker"
      - "dependencies"
`;
  }

  private generatePrTemplate(projectName: string): string {
    return `## Description

<!-- Please include a summary of the changes and which issue is fixed. -->

## Type of Change

<!-- Please check the relevant option. -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📝 Documentation update
- [ ] 🧹 Chore (maintenance, refactoring, etc.)
- [ ] 🎨 Style (formatting, missing semicolons, etc.)
- [ ] ♻️ Refactor (code change that neither fixes a bug nor adds a feature)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test (adding or correcting tests)
- [ ] 🔧 Configuration change

## Related Issues

<!-- Link to related issues using "Closes #123" or "Fixes #123" -->

## Screenshots / Videos

<!-- If applicable, add screenshots or videos to help explain your changes. -->

## Checklist

<!-- Please check all items that apply. -->

- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Additional Notes

<!-- Any additional information that reviewers should know. -->
`;
  }

  private generateBugReportTemplate(projectName: string): string {
    return `---
name: Bug Report
about: Create a report to help us improve ${projectName}
title: '[BUG] '
labels: bug, needs-triage
assignees: ''
---

## Bug Description

<!-- A clear and concise description of what the bug is. -->

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

<!-- A clear and concise description of what you expected to happen. -->

## Actual Behavior

<!-- A clear and concise description of what actually happened. -->

## Screenshots / Logs

<!-- If applicable, add screenshots or error logs to help explain your problem. -->

## Environment

- OS: [e.g., macOS 14.0, Windows 11, Ubuntu 22.04]
- Node.js version: [e.g., 20.10.0]
- Bun version: [e.g., 1.0.25]
- Browser: [e.g., Chrome 120, Firefox 121]

## Additional Context

<!-- Add any other context about the problem here. -->
`;
  }

  private generateFeatureRequestTemplate(): string {
    return `---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement, needs-triage
assignees: ''
---

## Problem Statement

<!-- A clear and concise description of what problem this feature would solve. -->
<!-- Ex. I'm always frustrated when [...] -->

## Proposed Solution

<!-- A clear and concise description of what you want to happen. -->

## Alternative Solutions

<!-- A clear and concise description of any alternative solutions or features you've considered. -->

## Use Cases

<!-- Describe the use cases that would benefit from this feature. -->

1. As a [type of user], I want [goal] so that [benefit].

## Additional Context

<!-- Add any other context, mockups, or screenshots about the feature request here. -->
`;
  }

  private generateIssueConfig(): string {
    return `blank_issues_enabled: false
contact_links:
  - name: 💬 Discussions
    url: https://github.com/YOUR_ORG/YOUR_REPO/discussions
    about: Ask questions and discuss ideas
  - name: 📚 Documentation
    url: https://docs.example.com
    about: Check out the documentation for answers
`;
  }

  private generateLabelerConfig(): string {
    return `# Auto-label PRs based on changed files

# Apps
'app:api':
  - changed-files:
      - any-glob-to-any-file: 'apps/api/**/*'

'app:web':
  - changed-files:
      - any-glob-to-any-file: 'apps/web/**/*'

'app:doc':
  - changed-files:
      - any-glob-to-any-file: 'apps/doc/**/*'

# Packages
'pkg:ui':
  - changed-files:
      - any-glob-to-any-file: 'packages/ui/**/*'

'pkg:contracts':
  - changed-files:
      - any-glob-to-any-file: 'packages/contracts/**/*'

'pkg:types':
  - changed-files:
      - any-glob-to-any-file: 'packages/types/**/*'

'pkg:configs':
  - changed-files:
      - any-glob-to-any-file: 'packages/configs/**/*'

# Infrastructure
'infra:docker':
  - changed-files:
      - any-glob-to-any-file:
          - 'docker/**/*'
          - 'docker-compose*.yml'
          - '**/Dockerfile*'

'infra:ci':
  - changed-files:
      - any-glob-to-any-file: '.github/**/*'

# Documentation
'documentation':
  - changed-files:
      - any-glob-to-any-file:
          - '**/*.md'
          - 'docs/**/*'
          - '.docs/**/*'

# Tests
'tests':
  - changed-files:
      - any-glob-to-any-file:
          - '**/*.test.ts'
          - '**/*.spec.ts'
          - '**/__tests__/**/*'
          - '**/vitest.config.*'
`;
  }

  private generateBranchProtectionDocs(): string {
    return `# Branch Protection Configuration

This document describes the recommended branch protection rules for this repository.

## Main Branch Protection

Configure the following settings for the \`main\` branch:

### Required Status Checks

Enable "Require status checks to pass before merging" with the following checks:

- \`CI / Lint & Format\`
- \`CI / Type Check\`
- \`CI / Test\`
- \`CI / Build\`

### Pull Request Reviews

- ✅ Require a pull request before merging
- ✅ Require approvals: 1 (or more for larger teams)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners

### Branch Restrictions

- ✅ Require conversation resolution before merging
- ✅ Require signed commits (recommended for security)
- ✅ Do not allow bypassing the above settings

### Additional Settings

- ✅ Require linear history (optional, for cleaner git history)
- ✅ Include administrators in restrictions

## Develop Branch Protection (if using GitFlow)

Similar to main branch with these differences:

- Required approvals: 1
- Allow bypassing for repository administrators (for hotfixes)

## Setting Up via GitHub CLI

\`\`\`bash
# Install GitHub CLI if not already installed
# brew install gh

# Authenticate
gh auth login

# Set up branch protection (adjust settings as needed)
gh api repos/{owner}/{repo}/branches/main/protection -X PUT -f \\
  required_status_checks='{"strict":true,"contexts":["CI / Lint & Format","CI / Type Check","CI / Test","CI / Build"]}' \\
  required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1}' \\
  enforce_admins=true \\
  restrictions=null
\`\`\`

## Automation

The CI/CD workflows in this repository are configured to work with these branch protection rules.
PRs will automatically be validated against all required checks before merging is allowed.
`;
  }

  private generateCodeowners(): string {
    return `# CODEOWNERS file
# These owners will be requested for review when someone opens a PR
# that modifies code that they own.
#
# Order matters - the last matching pattern takes precedence.

# Default owners for everything
* @your-org/maintainers

# Apps
/apps/api/ @your-org/backend-team
/apps/web/ @your-org/frontend-team
/apps/doc/ @your-org/docs-team

# Packages
/packages/ui/ @your-org/frontend-team
/packages/contracts/ @your-org/backend-team @your-org/frontend-team
/packages/types/ @your-org/backend-team @your-org/frontend-team
/packages/configs/ @your-org/devops-team

# Infrastructure
/docker/ @your-org/devops-team
/.github/ @your-org/devops-team

# Documentation
*.md @your-org/docs-team
/docs/ @your-org/docs-team
/.docs/ @your-org/docs-team

# Security-sensitive files
/.env* @your-org/security-team
/packages/*/src/auth/ @your-org/security-team
/apps/api/src/auth/ @your-org/security-team
`;
  }
}
