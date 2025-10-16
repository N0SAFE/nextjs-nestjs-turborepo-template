# GitHub Project Setup Guide

This guide helps you create a GitHub Project and populate it with tasks from the Feature Roadmap.

## Prerequisites

- GitHub account with repository access
- GitHub CLI (`gh`) installed and authenticated
- Repository: `N0SAFE/nextjs-nestjs-turborepo-template`

## Option 1: Manual Setup via GitHub UI

### Step 1: Create GitHub Project

1. Go to https://github.com/N0SAFE/nextjs-nestjs-turborepo-template
2. Click on "Projects" tab
3. Click "New project"
4. Choose "Board" template
5. Name it: "Feature Development Roadmap"
6. Description: "Tracking unimplemented features and enhancements"

### Step 2: Configure Project Columns

Create the following columns:
- 📋 **Backlog** - Features not yet started
- 🔄 **In Progress** - Features being worked on
- 👀 **In Review** - Features in code review
- ✅ **Done** - Completed features

### Step 3: Add Custom Fields

Add these custom fields:
1. **Priority**: Single select (Critical, High, Medium, Low)
2. **Category**: Single select (API, Frontend, Testing, DevOps, Docs, DX, MCP)
3. **Effort**: Single select (Small, Medium, Large)
4. **Phase**: Single select (Phase 1, Phase 2, Phase 3, Phase 4)

### Step 4: Create Labels

Create these labels in the repository:
- `priority: critical` (red)
- `priority: high` (orange)
- `priority: medium` (yellow)
- `priority: low` (green)
- `api` (blue)
- `frontend` (purple)
- `testing` (cyan)
- `devops` (brown)
- `docs` (gray)
- `dx` (pink)
- `mcp` (lime)
- `enhancement` (teal)
- `feature` (indigo)

### Step 5: Create Issues from Roadmap

Reference: `.docs/planning/FEATURE-ROADMAP.md`

For each feature in the roadmap, create an issue with:

**Example for "Role-Based Authenticated API Calls":**

```markdown
Title: [MCP] Role-Based Authenticated API Calls

Labels: priority: high, mcp, enhancement

Description:
## Description
Enable LLM to make authenticated API calls as different user roles for testing and debugging.

## Benefits
- RBAC testing without manual setup
- Data-driven debugging
- Security auditing
- Test generation based on API responses

## Tasks
- [ ] Update database seed for role-based users
- [ ] Add MCP tool for authenticated calls
- [ ] Create resource for role-based users
- [ ] Test with different roles (admin, moderator, user, guest)
- [ ] Document usage in AGENTS.md

## Acceptance Criteria
- [ ] Can authenticate as admin, moderator, user, guest
- [ ] API calls return appropriate responses based on role
- [ ] Temporary sessions are created and cleaned up
- [ ] Error handling for invalid roles
- [ ] Documentation includes examples

## Related Documentation
- `.docs/deprecated/MCP-ENHANCEMENTS-IDEA.md`
- `packages/mcp-repo-manager/README.md`

## Priority
High

## Estimated Effort
Large

## Phase
Phase 2
```

## Option 2: Automated Setup with GitHub CLI

### Step 1: Authenticate GitHub CLI

```bash
gh auth login
```

### Step 2: Create Project (Manual - Projects V2 API limited in CLI)

Currently, GitHub CLI has limited support for Projects V2. You'll need to:

1. Create the project manually via web UI (see Option 1, Step 1-4)
2. Get the project number from the URL

### Step 3: Create Issues Programmatically

Save this script as `scripts/create-roadmap-issues.sh`:

```bash
#!/bin/bash

# Repository
REPO="N0SAFE/nextjs-nestjs-turborepo-template"

# Create labels first
gh label create "priority: critical" --color "d73a4a" --repo $REPO 2>/dev/null
gh label create "priority: high" --color "ff9800" --repo $REPO 2>/dev/null
gh label create "priority: medium" --color "ffeb3b" --repo $REPO 2>/dev/null
gh label create "priority: low" --color "4caf50" --repo $REPO 2>/dev/null
gh label create "api" --color "0366d6" --repo $REPO 2>/dev/null
gh label create "frontend" --color "7057ff" --repo $REPO 2>/dev/null
gh label create "testing" --color "00bcd4" --repo $REPO 2>/dev/null
gh label create "devops" --color "795548" --repo $REPO 2>/dev/null
gh label create "docs" --color "9e9e9e" --repo $REPO 2>/dev/null
gh label create "dx" --color "e91e63" --repo $REPO 2>/dev/null
gh label create "mcp" --color "cddc39" --repo $REPO 2>/dev/null
gh label create "enhancement" --color "00897b" --repo $REPO 2>/dev/null
gh label create "feature" --color "3f51b5" --repo $REPO 2>/dev/null

echo "Labels created successfully"

# Phase 1: Critical Features
echo "Creating Phase 1 (Critical) issues..."

gh issue create --repo $REPO \
  --title "[API] Example CRUD Operations" \
  --label "priority: critical,api,enhancement" \
  --body "## Description
Complete CRUD examples beyond basic user module.

## Benefits
- Demonstrates best practices
- Provides templates for new features
- Shows patterns for common operations

## Tasks
- [ ] Create Posts module (CRUD example)
- [ ] Add Comments module (nested CRUD)
- [ ] Implement Categories module
- [ ] Add validation examples
- [ ] Document patterns

## Acceptance Criteria
- [ ] Posts module with create, read, update, delete
- [ ] Comments nested under posts
- [ ] Categories with relationships
- [ ] Comprehensive validation
- [ ] Tests for all endpoints

## Priority
Critical

## Phase
Phase 1"

gh issue create --repo $REPO \
  --title "[API] Pagination Implementation" \
  --label "priority: critical,api,enhancement" \
  --body "## Description
Standard pagination pattern across all API endpoints.

## Benefits
- Scalable data fetching
- Consistent API interface
- Performance optimization

## Tasks
- [ ] Create pagination utility
- [ ] Add to user endpoints
- [ ] Document pagination pattern
- [ ] Add limit/offset support
- [ ] Add cursor-based pagination option

## Acceptance Criteria
- [ ] Reusable pagination utility
- [ ] Applied to all list endpoints
- [ ] Documentation with examples
- [ ] Tests for pagination logic

## Priority
Critical

## Phase
Phase 1"

# Add more issues as needed...

echo "Issues created successfully"
```

Make it executable:
```bash
chmod +x scripts/create-roadmap-issues.sh
```

Run it:
```bash
./scripts/create-roadmap-issues.sh
```

## Option 3: Bulk Import via CSV

### Step 1: Create CSV File

Create `scripts/roadmap-issues.csv`:

```csv
Title,Description,Labels,Priority,Phase
[MCP] Role-Based Authenticated API Calls,Enable LLM to make authenticated API calls as different user roles,"priority: high,mcp,enhancement",High,Phase 2
[API] Example CRUD Operations,Complete CRUD examples beyond basic user,"priority: critical,api,enhancement",Critical,Phase 1
[API] Pagination Implementation,Standard pagination pattern across API,"priority: critical,api,enhancement",Critical,Phase 1
```

### Step 2: Import Issues

Use a tool like https://github.com/gavinr/github-csv-tools or manually create from CSV.

## Recommended Approach

For this repository, I recommend:

1. **Manual Project Creation** (Option 1, Steps 1-4)
   - More control over project structure
   - Easier to customize fields and views

2. **Semi-Automated Issue Creation** (Option 2)
   - Create labels with script
   - Create high-priority issues first manually
   - Automate bulk creation of lower priority items

3. **Iterative Population**
   - Start with Phase 1 (Critical) features
   - Add Phase 2 features as Phase 1 progresses
   - Keep backlog manageable

## Post-Setup Tasks

After creating the project:

1. **Link Project to Repository**
   - Add project link to repository README
   - Update `.docs/planning/README.md` with project link

2. **Create Milestone for Each Phase**
   - Milestone 1: Foundation (Phase 1)
   - Milestone 2: Core Features (Phase 2)
   - Milestone 3: Enhancement (Phase 3)
   - Milestone 4: Polish (Phase 4)

3. **Set Up Automation**
   - Auto-add new issues to project
   - Auto-move to "In Progress" when PR linked
   - Auto-move to "Done" when PR merged

4. **Create Project Views**
   - View by Priority
   - View by Category
   - View by Phase
   - View by Effort

## Issue Creation Priority

Create issues in this order:

### Week 1: Critical Foundation (10 issues)
1. Example CRUD Operations
2. Pagination Implementation
3. Error Handling Standardization
4. Form Validation Examples
5. Error Boundaries
6. Loading States
7. API Integration Tests
8. Frontend Component Tests
9. CI/CD Pipeline
10. Automated Testing in CI

### Week 2: High Priority API (7 issues)
1. Role-Based API Calls (MCP)
2. API Schema Access (MCP)
3. ORPC Contracts Schema (MCP)
4. File Upload/Download
5. Search and Filter
6. Caching Strategy
7. Rate Limiting

### Week 3: High Priority Frontend (8 issues)
1. Data Tables with Pagination
2. File Upload UI
3. Real-time Features
4. E2E Tests
5. Visual Regression Tests
6. Dependency Vulnerability Scanning
7. Performance Monitoring
8. Automated Deployment

### Week 4+: Medium/Low Priority
- Create remaining issues in batches
- Focus on MCP enhancements
- Add documentation tasks
- Include developer experience improvements

## Maintenance

- **Weekly Review**: Check project status and update priorities
- **Monthly Planning**: Plan next phase based on completed work
- **Quarterly Roadmap Update**: Update `.docs/planning/FEATURE-ROADMAP.md`

## Resources

- GitHub Projects Documentation: https://docs.github.com/en/issues/planning-and-tracking-with-projects
- GitHub CLI Projects: https://cli.github.com/manual/gh_project
- Feature Roadmap: `.docs/planning/FEATURE-ROADMAP.md`

---

**Note**: Due to GitHub API limitations in the current environment, project creation and bulk issue creation may need to be done manually through the GitHub web interface. This guide provides the structure and content needed to set everything up efficiently.
