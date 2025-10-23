#!/usr/bin/env -S bun

import { existsSync } from 'fs'
import { execSync, spawnSync } from 'child_process'
import { join } from 'path'

interface RenderDeploymentConfig {
  renderYamlPath: string
  webDockerfilePath: string
  apiDockerfilePath: string
  docDockerfilePath: string
}

/**
 * Check if file exists
 */
function checkFile(path: string, description: string): boolean {
  if (!existsSync(path)) {
    console.error(`❌ ${description} not found at ${path}`)
    return false
  }
  return true
}

/**
 * Verify all required files exist
 */
function verifyRequiredFiles(config: RenderDeploymentConfig): boolean {
  let allValid = true

  if (!checkFile(config.renderYamlPath, 'render.yaml')) {
    allValid = false
  }

  if (!checkFile(config.webDockerfilePath, 'Web Dockerfile')) {
    allValid = false
  }

  if (!checkFile(config.apiDockerfilePath, 'API Dockerfile')) {
    allValid = false
  }

  if (!checkFile(config.docDockerfilePath, 'Documentation Dockerfile')) {
    allValid = false
  }

  return allValid
}

/**
 * Test Docker build for a service
 */
function testDockerBuild(dockerfile: string, serviceName: string, imageTag: string): boolean {
  console.log(`\n🔨 Building ${serviceName} Docker image...`)

  try {
    execSync(`docker build -f ${dockerfile} -t ${imageTag} .`, {
      stdio: 'inherit',
    })
    console.log(`✅ ${serviceName} Docker build successful`)

    // Clean up test image
    try {
      execSync(`docker rmi ${imageTag}`, { stdio: 'pipe' })
    } catch {
      // Ignore cleanup errors
    }

    return true
  } catch (error) {
    console.error(`❌ ${serviceName} Docker build failed`)
    return false
  }
}

/**
 * Verify Docker is installed and running
 */
function verifyDocker(): boolean {
  try {
    execSync('docker --version', { stdio: 'pipe' })
    return true
  } catch {
    console.warn('⚠️  Docker not found. Skipping Docker build tests.')
    console.warn('    You can test builds manually later.')
    return false
  }
}

/**
 * Print deployment instructions
 */
function printDeploymentInstructions(): void {
  console.log('\n' + '═'.repeat(60))
  console.log('📋 RENDER DEPLOYMENT INSTRUCTIONS')
  console.log('═'.repeat(60))
  console.log('\n✅ Your app is ready for Render deployment!\n')

  console.log('📚 Next steps:')
  console.log('  1. Push your changes to GitHub')
  console.log('  2. Go to render.com and sign up')
  console.log('  3. Click "New" → "Blueprint"')
  console.log('  4. Connect your GitHub repository')
  console.log('  5. Render will detect render.yaml automatically')
  console.log('  6. Update service names in render.yaml if needed')
  console.log('  7. Click "Apply" to deploy\n')

  console.log('📖 For detailed instructions, see: .docs/guides/RENDER-DEPLOYMENT.md\n')

  console.log('🌐 Your services will be available at:')
  console.log('   • API: https://your-api-service-name.onrender.com')
  console.log('   • Web: https://your-web-service-name.onrender.com')
  console.log('   • Docs: https://your-doc-service-name.onrender.com\n')

  console.log('═'.repeat(60))
}

/**
 * Main execution
 */
function main(): void {
  console.log('🚀 Preparing your app for Render deployment...\n')

  const config: RenderDeploymentConfig = {
    renderYamlPath: 'render.yaml',
    webDockerfilePath: 'docker/Dockerfile.web.build-time.prod',
    apiDockerfilePath: 'docker/Dockerfile.api.prod',
    docDockerfilePath: 'docker/Dockerfile.doc.build-time.prod',
  }

  // Verify we're in the right directory
  if (!checkFile(config.renderYamlPath, 'render.yaml')) {
    console.error('❌ render.yaml not found. Please run this script from the project root.')
    process.exit(1)
  }

  console.log('✅ Found render.yaml configuration\n')

  // Check if all required Dockerfiles exist
  console.log('🔍 Checking required Dockerfiles...')
  if (!verifyRequiredFiles(config)) {
    process.exit(1)
  }

  console.log('✅ Found all required Dockerfiles\n')

  // Test Docker builds if Docker is available
  if (verifyDocker()) {
    console.log('🧪 Testing Docker builds locally...')
    console.log('   This may take a few minutes...\n')

    const webBuildSuccess = testDockerBuild(config.webDockerfilePath, 'Web App', 'test-web:latest')
    const apiBuildSuccess = testDockerBuild(config.apiDockerfilePath, 'API', 'test-api:latest')
    const docBuildSuccess = testDockerBuild(config.docDockerfilePath, 'Documentation', 'test-doc:latest')

    if (!webBuildSuccess || !apiBuildSuccess || !docBuildSuccess) {
      console.error('\n❌ Some Docker builds failed')
      process.exit(1)
    }
  } else {
    console.log('⏭️  Skipping Docker build tests')
  }

  printDeploymentInstructions()
  console.log('🎉 Preparation complete!\n')
}

main()
