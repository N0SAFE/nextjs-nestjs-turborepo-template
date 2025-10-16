#!/bin/bash

# GitHub Project Issue Generator
# Creates issues from the Feature Roadmap for the nextjs-nestjs-turborepo-template

set -e

REPO="N0SAFE/nextjs-nestjs-turborepo-template"
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: $0 [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --dry-run    Print issues without creating them"
      echo "  --help       Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Check if gh is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "Error: GitHub CLI is not authenticated"
    echo "Run: gh auth login"
    exit 1
fi

echo "GitHub Project Issue Generator"
echo "Repository: $REPO"
if [ "$DRY_RUN" = true ]; then
    echo "Mode: DRY RUN (no issues will be created)"
else
    echo "Mode: LIVE (issues will be created)"
fi
echo ""

# Create labels first
echo "Creating labels..."

create_label() {
    local name=$1
    local color=$2
    
    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] Would create label: $name (color: $color)"
    else
        gh label create "$name" --color "$color" --repo "$REPO" 2>/dev/null && echo "  ✓ Created: $name" || echo "  ℹ Already exists: $name"
    fi
}

# Priority labels
create_label "priority: critical" "d73a4a"
create_label "priority: high" "ff9800"
create_label "priority: medium" "ffeb3b"
create_label "priority: low" "4caf50"

# Category labels
create_label "api" "0366d6"
create_label "frontend" "7057ff"
create_label "testing" "00bcd4"
create_label "devops" "795548"
create_label "docs" "9e9e9e"
create_label "dx" "e91e63"
create_label "mcp" "cddc39"

# Type labels
create_label "enhancement" "00897b"
create_label "feature" "3f51b5"

echo ""
echo "Labels created/verified"
echo ""

# Function to create an issue
create_issue() {
    local title=$1
    local labels=$2
    local body=$3
    
    if [ "$DRY_RUN" = true ]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "[DRY RUN] Would create issue:"
        echo "Title: $title"
        echo "Labels: $labels"
        echo "Body:"
        echo "$body"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
    else
        echo "Creating: $title"
        gh issue create \
            --repo "$REPO" \
            --title "$title" \
            --label "$labels" \
            --body "$body" && echo "  ✓ Created" || echo "  ✗ Failed"
    fi
}

# Phase 1: Critical Features
echo "═══════════════════════════════════════════════════"
echo "Phase 1: Critical Features (Foundation)"
echo "═══════════════════════════════════════════════════"
echo ""

create_issue \
    "[API] Example CRUD Operations" \
    "priority: critical,api,enhancement" \
    "## Description
Complete CRUD examples beyond basic user module to demonstrate best practices.

## Benefits
- Demonstrates best practices for API development
- Provides templates for new features
- Shows patterns for common operations
- Helps developers understand the architecture

## Tasks
- [ ] Create Posts module (complete CRUD example)
- [ ] Add Comments module (nested CRUD example)
- [ ] Implement Categories module (many-to-many relationships)
- [ ] Add comprehensive validation examples
- [ ] Document patterns in code comments
- [ ] Add integration tests

## Acceptance Criteria
- [ ] Posts module with create, read, update, delete operations
- [ ] Comments nested under posts with proper relationships
- [ ] Categories with many-to-many relationships
- [ ] Comprehensive validation using class-validator
- [ ] Tests covering all endpoints
- [ ] Documentation with usage examples

## Related Documentation
- \`.docs/planning/FEATURE-ROADMAP.md\`
- \`.docs/guides/DEVELOPMENT-WORKFLOW.md\`

## Priority
Critical

## Estimated Effort
Large

## Phase
Phase 1 - Foundation"

create_issue \
    "[API] Pagination Implementation" \
    "priority: critical,api,enhancement" \
    "## Description
Implement standard pagination pattern across all API endpoints for scalable data fetching.

## Benefits
- Scalable data fetching for large datasets
- Consistent API interface
- Performance optimization
- Better user experience

## Tasks
- [ ] Create reusable pagination utility/decorator
- [ ] Add limit/offset pagination to user endpoints
- [ ] Implement cursor-based pagination option
- [ ] Add pagination metadata to responses
- [ ] Document pagination pattern
- [ ] Add tests for pagination logic

## Acceptance Criteria
- [ ] Reusable pagination utility implemented
- [ ] Applied to all list endpoints
- [ ] Documentation with examples
- [ ] Support for both limit/offset and cursor pagination
- [ ] Tests for edge cases (empty results, invalid params)
- [ ] Pagination metadata in responses (total, page, hasNext, etc.)

## Related Documentation
- \`.docs/planning/FEATURE-ROADMAP.md\`
- \`.docs/core-concepts/02-SERVICE-ADAPTER-PATTERN.md\`

## Priority
Critical

## Estimated Effort
Medium

## Phase
Phase 1 - Foundation"

create_issue \
    "[API] Error Handling Standardization" \
    "priority: critical,api,enhancement" \
    "## Description
Implement consistent error responses across all API endpoints.

## Benefits
- Better developer experience
- Consistent error messages
- Easier debugging
- Proper HTTP status codes

## Tasks
- [ ] Create standardized error response types
- [ ] Implement global error filter
- [ ] Add validation error formatting
- [ ] Handle database errors
- [ ] Add error logging
- [ ] Document error codes

## Acceptance Criteria
- [ ] All errors return consistent format
- [ ] Proper HTTP status codes
- [ ] Clear error messages
- [ ] Stack traces in development only
- [ ] Error logging to console/file
- [ ] Documentation of error codes

## Related Documentation
- \`.docs/planning/FEATURE-ROADMAP.md\`

## Priority
Critical

## Estimated Effort
Medium

## Phase
Phase 1 - Foundation"

create_issue \
    "[Frontend] Form Validation Examples" \
    "priority: critical,frontend,enhancement" \
    "## Description
Create comprehensive form examples with validation using React Hook Form and Zod.

## Benefits
- Form best practices demonstration
- Consistent validation patterns
- Better user experience
- Type-safe forms

## Tasks
- [ ] Add React Hook Form integration
- [ ] Create Zod validation schemas
- [ ] Build example forms (login, signup, profile)
- [ ] Add error message display
- [ ] Implement form submission handling
- [ ] Add loading states

## Acceptance Criteria
- [ ] Login form with validation
- [ ] Signup form with complex validation
- [ ] Profile edit form
- [ ] Clear error messages
- [ ] Loading states during submission
- [ ] Documentation with examples

## Related Documentation
- \`.docs/planning/FEATURE-ROADMAP.md\`

## Priority
Critical

## Estimated Effort
Medium

## Phase
Phase 1 - Foundation"

create_issue \
    "[Frontend] Error Boundaries" \
    "priority: critical,frontend,enhancement" \
    "## Description
Implement proper error handling in UI with error boundary components.

## Benefits
- Better user experience
- Application stability
- Graceful error recovery
- Error reporting

## Tasks
- [ ] Create error boundary components
- [ ] Add fallback UI components
- [ ] Implement error reporting
- [ ] Add error recovery mechanisms
- [ ] Create error pages (404, 500)
- [ ] Add error logging

## Acceptance Criteria
- [ ] Root error boundary
- [ ] Route-specific error boundaries
- [ ] Fallback UI for errors
- [ ] Error reporting to console
- [ ] Custom error pages
- [ ] Documentation

## Related Documentation
- \`.docs/planning/FEATURE-ROADMAP.md\`

## Priority
Critical

## Estimated Effort
Small

## Phase
Phase 1 - Foundation"

create_issue \
    "[Frontend] Loading States" \
    "priority: critical,frontend,enhancement" \
    "## Description
Implement consistent loading indicators across the application.

## Benefits
- Better perceived performance
- Consistent user experience
- Clear feedback to users

## Tasks
- [ ] Create loading components (spinners, skeletons)
- [ ] Add skeleton screens for content
- [ ] Implement suspense patterns
- [ ] Add loading states to forms
- [ ] Create page-level loading indicators
- [ ] Document loading patterns

## Acceptance Criteria
- [ ] Reusable loading components
- [ ] Skeleton screens for major pages
- [ ] Suspense boundaries
- [ ] Loading states in forms
- [ ] Page transition indicators
- [ ] Documentation with examples

## Related Documentation
- \`.docs/planning/FEATURE-ROADMAP.md\`

## Priority
Critical

## Estimated Effort
Small

## Phase
Phase 1 - Foundation"

create_issue \
    "[Testing] API Integration Tests" \
    "priority: critical,testing,enhancement" \
    "## Description
Create comprehensive integration tests for ORPC endpoints.

## Benefits
- Confidence in API functionality
- Catch regressions early
- Documentation through tests
- Type safety validation

## Tasks
- [ ] Create integration test setup
- [ ] Add database test utilities
- [ ] Create tests for all endpoints
- [ ] Add authentication test helpers
- [ ] Implement test data factories
- [ ] Add coverage reporting

## Acceptance Criteria
- [ ] Tests for all API endpoints
- [ ] Test database setup/teardown
- [ ] Authentication testing
- [ ] >80% code coverage
- [ ] CI integration
- [ ] Documentation

## Related Documentation
- \`.docs/features/TESTING.md\`
- \`.docs/planning/FEATURE-ROADMAP.md\`

## Priority
Critical

## Estimated Effort
Large

## Phase
Phase 1 - Foundation"

create_issue \
    "[Testing] Frontend Component Tests" \
    "priority: critical,testing,enhancement" \
    "## Description
Create comprehensive tests for React components using Vitest and Testing Library.

## Benefits
- UI reliability
- Catch UI regressions
- Documentation of component behavior
- Confidence in refactoring

## Tasks
- [ ] Set up component testing framework
- [ ] Create test utilities
- [ ] Add tests for UI components
- [ ] Test user interactions
- [ ] Add accessibility tests
- [ ] Implement coverage reporting

## Acceptance Criteria
- [ ] Tests for all shared components
- [ ] User interaction tests
- [ ] Accessibility tests
- [ ] >80% coverage for components
- [ ] CI integration
- [ ] Documentation

## Related Documentation
- \`.docs/features/TESTING.md\`
- \`.docs/planning/FEATURE-ROADMAP.md\`

## Priority
Critical

## Estimated Effort
Large

## Phase
Phase 1 - Foundation"

create_issue \
    "[DevOps] CI/CD Pipeline" \
    "priority: critical,devops,enhancement" \
    "## Description
Set up automated build, test, and deployment pipeline using GitHub Actions.

## Benefits
- Automated quality checks
- Faster feedback
- Consistent builds
- Automated deployments

## Tasks
- [ ] Create GitHub Actions workflows
- [ ] Add build job for all packages
- [ ] Add test job with coverage
- [ ] Configure linting and type checking
- [ ] Add deployment job
- [ ] Set up environment secrets

## Acceptance Criteria
- [ ] Build workflow running on PRs
- [ ] Test workflow with coverage reporting
- [ ] Lint and type check on PRs
- [ ] Automated deployment to staging
- [ ] Status checks required for merge
- [ ] Documentation

## Related Documentation
- \`.docs/planning/FEATURE-ROADMAP.md\`

## Priority
Critical

## Estimated Effort
Medium

## Phase
Phase 1 - Foundation"

create_issue \
    "[DevOps] Automated Testing in CI" \
    "priority: critical,devops,enhancement" \
    "## Description
Run all tests automatically on every pull request with quality gates.

## Benefits
- Quality gates
- Prevent regressions
- Automated validation
- Coverage tracking

## Tasks
- [ ] Add test workflow
- [ ] Configure test coverage reporting
- [ ] Add coverage thresholds
- [ ] Set up status checks
- [ ] Add test result comments on PRs
- [ ] Configure test matrix (Node versions)

## Acceptance Criteria
- [ ] Tests run on every PR
- [ ] Coverage reported to PR
- [ ] Status checks block merge on failure
- [ ] Test results visible in PR
- [ ] Matrix testing for multiple Node versions
- [ ] Documentation

## Related Documentation
- \`.docs/features/TESTING.md\`
- \`.docs/planning/FEATURE-ROADMAP.md\`

## Priority
Critical

## Estimated Effort
Small

## Phase
Phase 1 - Foundation"

echo ""
echo "═══════════════════════════════════════════════════"
if [ "$DRY_RUN" = true ]; then
    echo "DRY RUN COMPLETE"
    echo "Run without --dry-run to create these issues"
else
    echo "PHASE 1 ISSUES CREATED"
    echo ""
    echo "Next steps:"
    echo "1. Create a GitHub Project"
    echo "2. Add these issues to the project"
    echo "3. Configure project views and automation"
    echo "4. Run this script again for Phase 2 issues"
fi
echo "═══════════════════════════════════════════════════"
