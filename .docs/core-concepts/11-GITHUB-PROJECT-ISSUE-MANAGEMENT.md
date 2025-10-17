# GitHub Project & Issue Management Protocol

> **Type**: Core Concept - Process & Workflow  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-16

## Overview

This core concept establishes the **mandatory workflow** for managing GitHub Issues and Projects during development. All work MUST be tracked through GitHub Issues, and all issues MUST be properly organized in the GitHub Project board with correct status, priority, and metadata.

**This is not optional** - it ensures project visibility, accountability, and proper task management.

## Core Principle

**Every feature, bug fix, or significant change MUST have a corresponding GitHub Issue, and that issue MUST be properly tracked in the GitHub Project.**

### The Golden Rules

1. **Before starting work**: Check if an issue exists. If not, create one.
2. **During development**: Update issue status as work progresses.
3. **When completing work**: Mark issue as "Done" and close it.
4. **At all times**: Keep issues synchronized with actual work state.

## Workflow Steps

### 1. Check for Existing Issue

Before starting ANY work:

```bash
# Search for related issues
gh issue list --repo N0SAFE/nextjs-nestjs-turborepo-template --search "keyword"

# Or use MCP tool (if available)
# mcp_github_search_issues with appropriate query
```

**Decision tree:**
- ✅ Issue exists → Proceed to step 2
- ❌ Issue doesn't exist → Create one (step 1.1)

### 1.1. Create New Issue (If Needed)

When creating an issue, include:
- **Clear title** describing the feature/bug
- **Detailed description** with context from documentation
- **Appropriate labels** (feature, bug, documentation, etc.)
- **References** to relevant documentation files

```bash
# Using GitHub CLI
gh issue create --repo N0SAFE/nextjs-nestjs-turborepo-template \
  --title "🔧 Feature: Add user authentication" \
  --body "Description here" \
  --label "feature,auth"

# Or use MCP tool (if available)
# mcp_github_create_issue with appropriate parameters
```

### 2. Add Issue to Project

Every issue MUST be added to the GitHub Project:

```bash
# Get issue database ID first
ISSUE_DB_ID=$(gh api graphql -f query='
  query { 
    repository(owner: "N0SAFE", name: "nextjs-nestjs-turborepo-template") { 
      issue(number: 123) { databaseId } 
    } 
  }' | jq -r '.data.repository.issue.databaseId')

# Add to project using MCP tool (preferred)
# mcp_github_add_project_item with:
# - item_id: $ISSUE_DB_ID
# - item_type: "issue"
# - owner: "N0SAFE"
# - owner_type: "user"
# - project_number: 3
```

**If MCP tools are not available**, verify GitHub CLI is installed:

```bash
# Check if gh is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI not found!"
  echo "Please install it: https://cli.github.com/"
  exit 1
fi

# Check if authenticated with project scope
gh auth status | grep -q "project" || {
  echo "❌ Missing 'project' scope!"
  echo "Run: gh auth refresh -s project"
  exit 1
}
```

### 3. Set Issue Metadata

Configure the issue in the project board:

**Status Options:**
- `Backlog` - Planned but not ready to start
- `Ready` - Ready to be picked up
- `In Progress` - Currently being worked on
- `In Review` - Code review in progress
- `Done` - Completed and verified

**Priority Options:**
- `P0` - Critical/Urgent (bugs, blockers)
- `P1` - High priority (important features)
- `P2` - Normal priority (nice to have)

**Size Options:**
- `XS` - < 1 hour (tiny fixes, doc updates)
- `S` - 1-4 hours (small features, bug fixes)
- `M` - 1-2 days (medium features)
- `L` - 3-5 days (large features)
- `XL` - 1+ weeks (epics, major refactors)

```bash
# Get project field IDs (run once to discover)
gh project field-list 3 --owner N0SAFE --format json

# Set status to "In Progress"
gh project item-edit \
  --project-id PVT_kwHOBKEgKs4BFsoA \
  --id <PROJECT_ITEM_ID> \
  --field-id PVTSSF_lAHOBKEgKs4BFsoAzg29Y3M \
  --single-select-option-id 47fc9ee4

# Set priority to P0
gh project item-edit \
  --project-id PVT_kwHOBKEgKs4BFsoA \
  --id <PROJECT_ITEM_ID> \
  --field-id PVTSSF_lAHOBKEgKs4BFsoAzg29ZDg \
  --single-select-option-id 79628723

# Set size to M
gh project item-edit \
  --project-id PVT_kwHOBKEgKs4BFsoA \
  --id <PROJECT_ITEM_ID> \
  --field-id PVTSSF_lAHOBKEgKs4BFsoAzg29ZDk \
  --single-select-option-id 7515a9f1
```

### 4. Update Status During Development

As work progresses, update the issue status:

**When starting work:**
```bash
# Move to "In Progress"
gh project item-edit --project-id PVT_kwHOBKEgKs4BFsoA \
  --id <PROJECT_ITEM_ID> \
  --field-id PVTSSF_lAHOBKEgKs4BFsoAzg29Y3M \
  --single-select-option-id 47fc9ee4
```

**When creating PR:**
```bash
# Move to "In Review"
gh project item-edit --project-id PVT_kwHOBKEgKs4BFsoA \
  --id <PROJECT_ITEM_ID> \
  --field-id PVTSSF_lAHOBKEgKs4BFsoAzg29Y3M \
  --single-select-option-id df73e18b

# Create PR linked to issue
gh pr create --fill --body "Closes #123"
```

**When completing work:**
```bash
# Move to "Done"
gh project item-edit --project-id PVT_kwHOBKEgKs4BFsoA \
  --id <PROJECT_ITEM_ID> \
  --field-id PVTSSF_lAHOBKEgKs4BFsoAzg29Y3M \
  --single-select-option-id 98236657

# Close issue
gh issue close 123 --comment "Completed and verified"
```

## Tool Hierarchy

Use tools in this priority order:

### 1. MCP GitHub Tools (Preferred)

When available, use these MCP tools:
- `mcp_github_create_issue` - Create new issues
- `mcp_github_add_project_item` - Add issues to project
- `mcp_github_update_project_item` - Update issue metadata
- `mcp_github_search_issues` - Search existing issues
- `mcp_github_list_project_items` - List project items

**Advantages:**
- ✅ Type-safe parameters
- ✅ Better error handling
- ✅ Integrated with AI workflow

### 2. GitHub CLI (Fallback)

If MCP tools are unavailable or disabled:

```bash
# Verify installation
gh --version || {
  echo "❌ Install GitHub CLI: https://cli.github.com/"
  exit 1
}

# Verify authentication with project scope
gh auth status | grep "project" || {
  echo "⚠️  Need project scope"
  gh auth refresh -s project
}
```

**Common commands:**
```bash
# Issue management
gh issue create --repo OWNER/REPO --title "..." --body "..."
gh issue list --repo OWNER/REPO --search "keyword"
gh issue view 123 --repo OWNER/REPO
gh issue close 123 --comment "..."

# Project management
gh project list --owner OWNER
gh project item-list 3 --owner OWNER
gh project item-add 3 --owner OWNER --url https://github.com/OWNER/REPO/issues/123
gh project item-edit --project-id PROJECT_ID --id ITEM_ID --field-id FIELD_ID --single-select-option-id OPTION_ID

# Get field and option IDs
gh project field-list 3 --owner OWNER --format json
```

### 3. Stop and Request User Action (Last Resort)

If neither MCP tools nor GitHub CLI are available:

```markdown
❌ **Cannot proceed with issue management**

Required tools are not available:
- MCP GitHub tools: Not available/disabled
- GitHub CLI: Not installed

**Action required:**
1. Install GitHub CLI: https://cli.github.com/
2. Authenticate: `gh auth login`
3. Add project scope: `gh auth refresh -s project`

Once installed, please confirm so we can continue.
```

**Do not proceed** without proper tooling - manual issue management via web UI is error-prone and not tracked.

## Examples

### ✅ CORRECT: Full Workflow

```bash
# 1. Check for existing issue
gh issue list --search "user authentication"

# 2. Create issue (if not exists)
gh issue create \
  --title "🔧 Implement user authentication with Better Auth" \
  --body "See docs/features/BETTER-AUTH-INTEGRATION.md" \
  --label "feature,auth,priority:high"

# 3. Get issue database ID
ISSUE_NUM=95
ISSUE_DB_ID=$(gh api graphql -f query="
  query { 
    repository(owner: \"N0SAFE\", name: \"nextjs-nestjs-turborepo-template\") { 
      issue(number: $ISSUE_NUM) { databaseId } 
    } 
  }" | jq -r '.data.repository.issue.databaseId')

# 4. Add to project (using MCP tool or CLI)
# MCP: mcp_github_add_project_item ...
# Or CLI: gh project item-add 3 --owner N0SAFE --url https://github.com/N0SAFE/nextjs-nestjs-turborepo-template/issues/95

# 5. Get project item ID
ITEM_ID=$(gh project item-list 3 --owner N0SAFE --format json | \
  jq -r ".items[] | select(.content.number == $ISSUE_NUM) | .id")

# 6. Set metadata
gh project item-edit --project-id PVT_kwHOBKEgKs4BFsoA \
  --id $ITEM_ID \
  --field-id PVTSSF_lAHOBKEgKs4BFsoAzg29Y3M \
  --single-select-option-id 47fc9ee4  # In Progress

# 7. Work on feature...

# 8. Create PR
gh pr create --fill --body "Closes #95"

# 9. Update to "In Review"
gh project item-edit --project-id PVT_kwHOBKEgKs4BFsoA \
  --id $ITEM_ID \
  --field-id PVTSSF_lAHOBKEgKs4BFsoAzg29Y3M \
  --single-select-option-id df73e18b  # In Review

# 10. After merge, mark as Done
gh project item-edit --project-id PVT_kwHOBKEgKs4BFsoA \
  --id $ITEM_ID \
  --field-id PVTSSF_lAHOBKEgKs4BFsoAzg29Y3M \
  --single-select-option-id 98236657  # Done
```

### ❌ WRONG: Skipping Issue Creation

```bash
# Don't do this
git checkout -b feature/user-auth
# ... make changes ...
git commit -m "Add user auth"
git push

# Problem: No issue tracking, no project visibility
```

### ❌ WRONG: Creating Issue But Not Adding to Project

```bash
# Don't do this
gh issue create --title "Add feature X"
# ... work on feature ...
# ... never add to project board ...

# Problem: Issue exists but not tracked in project
```

### ❌ WRONG: Not Updating Status

```bash
# Don't do this
# Create issue, add to project with status "Ready"
# ... work on feature for 3 days ...
# ... status still shows "Ready" ...

# Problem: Project board shows incorrect state
```

## AI Assistant Responsibilities

When working on ANY task, the AI assistant MUST:

### Before Starting Work
1. ✅ Search for related issues
2. ✅ Create issue if none exists
3. ✅ Add issue to project board
4. ✅ Set appropriate metadata (status: Ready, priority, size)

### During Development
1. ✅ Update status to "In Progress" when starting
2. ✅ Add comments to issue with progress updates
3. ✅ Link commits to issue number in commit messages

### When Creating PR
1. ✅ Update status to "In Review"
2. ✅ Link PR to issue with "Closes #123" in PR body
3. ✅ Ensure PR description references the issue

### After Completion
1. ✅ Update status to "Done"
2. ✅ Close issue with completion comment
3. ✅ Verify issue appears in "Done" column

## Quick Reference: Field IDs

**Project Information:**
- Project ID: `PVT_kwHOBKEgKs4BFsoA`
- Project Number: `3`
- Owner: `N0SAFE`
- Repository: `nextjs-nestjs-turborepo-template`

**Field IDs:**
- Status Field: `PVTSSF_lAHOBKEgKs4BFsoAzg29Y3M`
- Priority Field: `PVTSSF_lAHOBKEgKs4BFsoAzg29ZDg`
- Size Field: `PVTSSF_lAHOBKEgKs4BFsoAzg29ZDk`

**Status Options:**
- Backlog: `f75ad846`
- Ready: `61e4505c`
- In Progress: `47fc9ee4`
- In Review: `df73e18b`
- Done: `98236657`

**Priority Options:**
- P0 (Critical): `79628723`
- P1 (High): `0a877460`
- P2 (Normal): `da944a9c`

**Size Options:**
- XS: `6c6483d2`
- S: `f784b110`
- M: `7515a9f1`
- L: `817d0097`
- XL: `db339eb2`

## Enforcement

**This is a CRITICAL core concept** - violations break project management and visibility.

### Mandatory Actions
- ❌ **NEVER** start work without an issue
- ❌ **NEVER** skip adding issues to the project
- ❌ **NEVER** leave issue status outdated
- ❌ **ALWAYS** use MCP tools or GitHub CLI (no manual web UI)

### Consequences of Violations
- Lost work visibility
- Duplicate efforts
- Missed dependencies
- Poor project planning
- Accountability gaps

## Related Core Concepts

- [00-EFFICIENT-EXECUTION-PROTOCOL.md](./00-EFFICIENT-EXECUTION-PROTOCOL.md) - Silent execution includes issue management
- [01-DOCUMENTATION-FIRST-WORKFLOW.md](./01-DOCUMENTATION-FIRST-WORKFLOW.md) - Reference docs in issue descriptions
- [10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md](./10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md) - Update docs when closing doc-related issues

## Troubleshooting

### GitHub CLI Not Installed
```bash
# Install on macOS
brew install gh

# Install on Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### Missing Project Scope
```bash
gh auth refresh -s project
```

### Can't Find Issue Database ID
```bash
gh api graphql -f query='
query { 
  repository(owner: "N0SAFE", name: "nextjs-nestjs-turborepo-template") { 
    issue(number: 123) { 
      databaseId 
      id 
      number 
      title 
    } 
  } 
}'
```

### Can't Find Project Item ID
```bash
gh project item-list 3 --owner N0SAFE --format json | \
  jq -r '.items[] | select(.content.number == 123) | "Issue #\(.content.number): \(.id)"'
```
