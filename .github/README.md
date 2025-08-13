# 🚀 GitHub Actions CI Setup

This repository includes comprehensive CI workflows for building and testing your Next.js NestJS Turborepo application.

## 📋 Workflows Overview

### 1. CI Pipeline (`.github/workflows/ci.yml`)
Runs on every push and pull request:
- 🔍 **Lint & Type Check**: ESLint and Prettier validation
- 🏗️ **Build & Test**: Builds all packages and runs tests with coverage
- 🐳 **Docker Build Test**: Tests Docker builds (production only)
- 📊 **Coverage Reports**: Collects and merges coverage from all packages
- ✅ **Quality Gates**: Validates if code meets quality standards

### 2. Package Tests (`.github/workflows/package-tests.yml`)
Runs specific package tests:
- 📦 **Individual Package Testing**: Tests specific packages in isolation
- � **Cross-package Dependencies**: Validates package interdependencies
- � **Detailed Coverage**: Per-package coverage reporting

## ⚙️ Setup Instructions

### 1. Code Coverage Setup (Optional)
For code coverage reporting:

1. **Codecov Setup**:
   ```bash
   # Add Codecov token as repository secret
   CODECOV_TOKEN=your-codecov-token
   ```

2. **Visit**: https://codecov.io
3. **Connect**: your GitHub repository
4. **Copy**: the provided token to repository secrets

## 📊 Available Scripts

The workflows use the following scripts from your `package.json`:

```bash
# Building
bun run build              # Build all packages
bun run docker:build       # Build Docker images (for testing)

# Testing
bun run test              # Run all tests
bun run test:coverage     # Run tests with coverage
bun run lint              # Lint all code
bun run format            # Format with Prettier
```

##  Workflow Customization

### Trigger Conditions
- **CI**: Runs on all pushes and PRs
- **Package Tests**: Runs on specific package changes

### Timeout Settings
- **Lint & Test**: 10-20 minutes
- **Docker Build**: 30 minutes
- **Package Tests**: 15 minutes

## 📈 Monitoring & Reports

### Coverage Reports
- **Merged coverage**: Available as workflow artifacts
- **Codecov integration**: Automatic coverage reporting
- **Per-package coverage**: Individual package coverage tracking

### Build Status
- **Status badges**: Available in GitHub repository
- **CI status**: Tracked in workflow summaries
- **Quality checks**: Automatic validation of code standards

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check package dependencies
   bun install
   bun run build
   ```

2. **Test Failures**:
   ```bash
   # Run tests locally
   bun run test
   bun run test:coverage
   ```

3. **Docker Build Issues**:
   ```bash
   # Test Docker builds locally
   docker build -f docker/Dockerfile.web.prod -t test-web .
   docker build -f docker/Dockerfile.api.prod -t test-api .
   ```

4. **Environment Variables**:
   - Verify all required variables are set for testing
   - Check variable names match exactly
   - Ensure test configurations are correct

### Debug Mode
Add these steps to workflows for debugging:

```yaml
- name: 🐛 Debug Environment
  run: |
    echo "Node version: $(node --version)"
    echo "Bun version: $(bun --version)"
    echo "Current directory: $(pwd)"
    echo "Environment variables:"
    env | grep -E "(NODE_|BUN_|CI)" | sort
```

## 📚 Additional Resources

- **Turborepo Documentation**: https://turbo.build/repo/docs
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Bun Documentation**: https://bun.sh/docs
- **Render Documentation**: https://render.com/docs (for deployment)

## 🤝 Contributing

When contributing to this project:
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** locally: `bun run test`
5. **Submit** a pull request

The CI pipeline will automatically validate your changes!
