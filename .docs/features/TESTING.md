📍 [Documentation Hub](../README.md) > [Features](./README.md) > Testing

# Testing Setup

> Works across the Docker-first SaaS template. Tests are runnable locally or in CI, with merged coverage across the monorepo.

This monorepo is equipped with comprehensive testing using Vitest. Each package and app has its own containerized testing setup using the shared `@repo-configs/vitest` package.

## Quick Start

```bash
# Run all tests across the monorepo
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

## Merged Coverage Reports

The monorepo now supports unified coverage reporting across all packages and apps. When you run `bun run test:coverage`, the system will:

1. **Run tests with coverage** in all packages and apps
2. **Collect coverage reports** from each workspace
3. **Merge all reports** into a single unified report
4. **Generate comprehensive reports** in multiple formats

### Coverage Commands

```bash
# Run all tests with merged coverage (recommended)
bun run test:coverage

# Individual coverage collection steps (if needed)
bun run coverage:merge    # Collect and merge coverage files
bun run coverage:report   # Generate final reports
```

### Coverage Output

After running `bun run test:coverage`, you'll find:

- **Individual Coverage Summary**: Displayed in the terminal showing coverage for each package
- **Merged HTML Report**: `./coverage/report/index.html` - Interactive HTML report
- **LCOV Report**: `./coverage/report/lcov.info` - For CI/CD integration
- **Text Summary**: Displayed in terminal with overall coverage percentages

### Coverage Structure

```
coverage/
├── raw/                    # Individual package coverage files
│   ├── web-coverage.json
│   ├── api-coverage.json
│   ├── ui-coverage.json
│   └── ...
├── merged.json            # Merged coverage data
└── report/                # Final reports
    ├── index.html         # Interactive HTML report
    ├── lcov.info          # LCOV format
    └── ...
```

## Package-Level Testing

Each package has its own test configuration and can be tested individually:

```bash
# Test specific packages
bun run test --filter=web
bun run test --filter=@repo/ui
```

## Test Structure

### Shared Vitest Configuration (`@repo-configs/vitest`)

- **Base Config**: Common settings for all packages
- **React Config**: Configuration for React component testing
- **Node Config**: Configuration for Node.js/backend testing
- **Next.js Config**: Special configuration for Next.js applications

### Test Files Organization

```
packages/
├── vitest-config/          # Shared test configurations
├── ui/
│   ├── components/
│   │   └── __tests__/      # Component tests
│   └── vitest.config.ts
├── ui/
│   ├── __tests__/          # SDK tests
│   └── vitest.config.ts
└── types/
    ├── __tests__/          # Type utility tests
    └── vitest.config.ts

apps/
├── web/
│   ├── src/
│   │   ├── middlewares/
│   │   │   └── __tests__/  # Middleware tests
│   │   ├── utils/
│   │   │   └── __tests__/  # Utility tests
│   │   └── __tests__/      # Integration tests
│   └── vitest.config.ts
└── api/
    ├── __tests__/          # API tests
    └── vitest.config.ts
```

## Test Types

### Unit Tests
- Component testing with React Testing Library
- Utility function testing
- Type validation testing
- Middleware testing

### Integration Tests
- Cross-package import validation
- Configuration testing
- End-to-end workflow testing

### Mocking
- Next.js router and navigation
- External dependencies (lodash, etc.)
- Environment variables
- Network requests

## Coverage Reports

Coverage reports are generated in the `coverage/` directory for each package when running:

```bash
bun run test:coverage
```

## Configuration Files

Each package contains:
- `vitest.config.ts` - Vitest configuration
- `vitest.setup.ts` - Test setup and global mocks
- Test files with `.test.ts` or `.spec.ts` extensions

## Continuous Integration

The test setup is designed to work with:
- Turborepo for efficient test execution
- Bun as the JavaScript runtime
- Parallel test execution across packages
- Dependency-aware test ordering

## Adding New Tests

1. Create test files alongside your source code in `__tests__/` directories
2. Use the appropriate vitest config from `@repo-configs/vitest`
3. Follow the naming convention: `*.test.ts` or `*.spec.ts`
4. Import necessary testing utilities from vitest and @testing-library

Example test structure:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  })
})
```

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Mock external dependencies**: Use vi.mock() for external services
3. **Test behavior, not implementation**: Focus on what the code does
4. **Use descriptive test names**: Make tests self-documenting
5. **Organize by feature**: Group related tests together
6. **Clean up**: Use beforeEach/afterEach for setup and teardown
