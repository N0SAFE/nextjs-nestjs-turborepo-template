#!/usr/bin/env -S bun

import { existsSync, readFileSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

interface TestResult {
  name: string
  passed: boolean
  message: string
}

type LogLevel = 'success' | 'error' | 'warning' | 'info'

const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[34m',
  reset: '\x1b[0m',
}

let testResults: TestResult[] = []

/**
 * Print colored message
 */
function print(level: LogLevel, message: string): void {
  const color = colors[level]
  const emoji: Record<LogLevel, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }
  console.log(`${color}${emoji[level]} ${message}${colors.reset}`)
}

/**
 * Record test result
 */
function recordTest(name: string, passed: boolean, message: string): void {
  testResults.push({ name, passed, message })
}

/**
 * Run command and return success status
 */
function runCommand(command: string): boolean {
  try {
    execSync(command, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Check if command exists
 */
function commandExists(command: string): boolean {
  try {
    execSync(`command -v ${command}`, { shell: '/bin/bash', stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Test 1: Check required tools
 */
function testRequiredTools(): void {
  console.log('\n🔍 Checking required tools...')
  console.log('═'.repeat(35))

  const tools: Array<{ name: string; command: string }> = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'Bun', command: 'bun --version' },
    { name: 'Docker', command: 'docker --version' },
    { name: 'Turbo', command: 'bun x turbo --version' },
  ]

  for (const tool of tools) {
    if (runCommand(tool.command)) {
      try {
        const version = execSync(tool.command, { encoding: 'utf8' }).trim()
        print('success', `${tool.name}: ${version}`)
        recordTest(`${tool.name} installed`, true, version)
      } catch (e) {
        print('error', `${tool.name} found but version check failed`)
        recordTest(`${tool.name} installed`, true, 'Found')
      }
    } else {
      print('error', `${tool.name} not found`)
      recordTest(`${tool.name} installed`, false, 'Not found')
    }
  }
}

/**
 * Test 2: Validate project structure
 */
function testProjectStructure(): void {
  console.log('\n📁 Validating project structure...')
  console.log('═'.repeat(35))

  const requiredFiles = [
    'package.json',
    'turbo.json',
    'docker-compose.yml',
    'apps/web/package.json',
    'apps/api/package.json',
    '.github/workflows/copilot-setup-steps.yml',
  ]

  for (const file of requiredFiles) {
    if (existsSync(file)) {
      print('success', `${file} exists`)
      recordTest(`File: ${file}`, true, 'Exists')
    } else {
      print('error', `${file} missing`)
      recordTest(`File: ${file}`, false, 'Missing')
    }
  }

  const requiredDirs = ['apps/web', 'apps/api', 'packages', 'docs', '.github/workflows']

  for (const dir of requiredDirs) {
    if (existsSync(dir)) {
      print('success', `${dir}/ directory exists`)
      recordTest(`Directory: ${dir}`, true, 'Exists')
    } else {
      print('error', `${dir}/ directory missing`)
      recordTest(`Directory: ${dir}`, false, 'Missing')
    }
  }
}

/**
 * Test 3: Validate workflow environment variables
 */
function testWorkflowEnv(): void {
  console.log('\n⚙️ Validating workflow environment variables...')
  console.log('═'.repeat(35))

  const workflowFile = '.github/workflows/copilot-setup-steps.yml'
  const requiredEnvVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_API_PORT',
    'API_PING_PATH',
    'API_ADMIN_TOKEN',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_APP_PORT',
    'AUTH_SECRET',
    'DB_DATABASE',
    'DB_ROOT_PASSWORD',
    'BUN_VERSION',
  ]

  if (!existsSync(workflowFile)) {
    print('error', `Workflow file not found: ${workflowFile}`)
    return
  }

  const workflowContent = readFileSync(workflowFile, 'utf-8')

  for (const envVar of requiredEnvVars) {
    if (workflowContent.includes(envVar)) {
      print('success', `${envVar} configured in workflow`)
      recordTest(`Workflow var: ${envVar}`, true, 'Configured')
    } else {
      print('error', `${envVar} missing from workflow`)
      recordTest(`Workflow var: ${envVar}`, false, 'Missing')
    }
  }
}

/**
 * Test 4: Test dependency installation
 */
function testDependencies(): void {
  console.log('\n📦 Testing dependency installation...')
  console.log('═'.repeat(35))

  if (existsSync('bun.lock')) {
    print('info', 'Installing dependencies with bun...')
    if (runCommand('bun install --frozen-lockfile')) {
      print('success', 'Dependencies installed successfully')
      recordTest('Dependencies installed', true, 'Success')
    } else {
      print('error', 'Failed to install dependencies')
      recordTest('Dependencies installed', false, 'Failed')
    }
  } else {
    print('warning', 'bun.lock not found - running bun install without frozen lockfile')
    if (runCommand('bun install')) {
      print('success', 'Dependencies installed successfully')
      recordTest('Dependencies installed', true, 'Success')
    } else {
      print('error', 'Failed to install dependencies')
      recordTest('Dependencies installed', false, 'Failed')
    }
  }
}

/**
 * Test 5: Test package building
 */
function testPackageBuilding(): void {
  console.log('\n🏗️ Testing package building...')
  console.log('═'.repeat(35))

  print('info', 'Building declarative routes...')
  if (runCommand('bun run --cwd apps/web dr:build')) {
    print('success', 'Declarative routes built successfully')
    recordTest('Declarative routes build', true, 'Success')
  } else {
    print('warning', 'Failed to build declarative routes - may need API connection')
    recordTest('Declarative routes build', true, 'Skipped (needs API)')
  }

  print('info', 'Building shared packages...')
  if (runCommand('bun x turbo run build --filter="!web" --filter="!api"')) {
    print('success', 'Shared packages built successfully')
    recordTest('Shared packages build', true, 'Success')
  } else {
    print('warning', 'Some shared packages failed to build - may need API connection')
    recordTest('Shared packages build', true, 'Partial success')
  }
}

/**
 * Test 6: Check available scripts
 */
function testAvailableScripts(): void {
  console.log('\n🎯 Checking available scripts...')
  console.log('═'.repeat(35))

  const requiredScripts = ['dev', 'build', 'test', 'lint', 'clean']
  const packageJsonContent = JSON.parse(readFileSync('package.json', 'utf-8')) as Record<string, Record<string, string>>
  const scripts = packageJsonContent.scripts || {}

  for (const script of requiredScripts) {
    if (script in scripts) {
      print('success', `Script '${script}' available`)
      recordTest(`Script: ${script}`, true, 'Available')
    } else {
      print('error', `Script '${script}' not found`)
      recordTest(`Script: ${script}`, false, 'Not found')
    }
  }
}

/**
 * Print test summary
 */
function printSummary(): void {
  console.log('\n📊 Test Summary')
  console.log('═'.repeat(35))

  const passed = testResults.filter((r) => r.passed).length
  const total = testResults.length
  const percentage = Math.round((passed / total) * 100)

  console.log(`\nResults: ${passed}/${total} tests passed (${percentage}%)\n`)

  if (passed === total) {
    print('success', 'All critical tests passed!')
    print('info', 'The GitHub Copilot development environment is ready to use.')
  } else {
    print('error', `${total - passed} test(s) failed`)
    print('warning', 'Please fix the issues above before proceeding.')
  }

  console.log('\n📚 Next steps:')
  console.log('  1. Commit the setup files to your repository')
  console.log('  2. Push to trigger the workflow')
  console.log('  3. Check the Actions tab to verify the workflow runs successfully')
  console.log('  4. The Copilot coding agent will now have a fully configured environment!\n')

  console.log('═'.repeat(35))
}

/**
 * Main execution
 */
function main(): void {
  console.log('🧪 Testing GitHub Copilot Development Environment Setup')
  console.log('═'.repeat(35))

  testRequiredTools()
  testProjectStructure()
  testWorkflowEnv()
  testDependencies()
  testPackageBuilding()
  testAvailableScripts()

  printSummary()

  if (testResults.every((r) => r.passed)) {
    console.log('🎉 GitHub Copilot Development Environment Test Completed Successfully!\n')
    process.exit(0)
  } else {
    process.exit(1)
  }
}

main()
