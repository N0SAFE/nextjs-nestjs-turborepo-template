#!/usr/bin/env node

import { parseArgs } from 'node:util'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import zod from 'zod/v4'
import { apiEnvSchema, webEnvSchema, docEnvSchema } from './index'
import { getMockEnv, getAllMockEnv } from './mock'

type AppName = 'api' | 'web' | 'doc'

const APP_SCHEMAS = {
    api: apiEnvSchema,
    web: webEnvSchema,
    doc: docEnvSchema,
} as const

/**
 * Load multiple .env files and merge them using dotenv
 * Provides better parsing with variable expansion and proper type safety
 */
function loadEnvFiles(filePaths: string[]): Record<string, string> {
    const mergedEnv: Record<string, string> = {}

    for (const filePath of filePaths) {
        const absolutePath = resolve(filePath)
        
        if (!existsSync(absolutePath)) {
            console.error(`❌ .env file not found: ${absolutePath}`)
            process.exit(1)
        }

        console.log(`📂 Loading ${filePath}...`)
        
        const result = dotenvConfig({ path: absolutePath })
        
        if (result.error) {
            console.error(`❌ Failed to parse ${filePath}:`, result.error)
            process.exit(1)
        }
        
        if (result.parsed) {
            Object.assign(mergedEnv, result.parsed)
        }
    }

    return mergedEnv
}

/**
 * Check environment variables for a specific app or all apps
 */
function checkEnv(appName?: AppName, envVars: Record<string, string> = process.env as any): boolean {
    let success = true

    if (appName) {
        // Check specific app
        console.log(`\n🔍 Checking ${appName} environment variables...`)
        const schema = APP_SCHEMAS[appName]
        const result = schema.safeParse(envVars)

        if (result.success) {
            console.log(`✅ ${appName} environment variables are valid`)
        } else {
            console.error(`❌ ${appName} environment validation failed:`)
            console.error(zod.prettifyError(result.error))
            success = false
        }
    } else {
        // Check all apps
        console.log('\n🔍 Checking all apps environment variables...')
        
        for (const [name, schema] of Object.entries(APP_SCHEMAS)) {
            const result = schema.safeParse(envVars)
            
            if (result.success) {
                console.log(`✅ ${name} environment variables are valid`)
            } else {
                console.error(`❌ ${name} environment validation failed:`)
                console.error(zod.prettifyError(result.error))
                success = false
            }
        }
    }

    return success
}

/**
 * Load and validate environment variables, optionally running a command
 */
function loadEnv(appName?: AppName, envFiles?: string[], command?: string[]): void {
    let envVars: Record<string, string> = { ...process.env } as any

    // Load .env files if provided
    if (envFiles && envFiles.length > 0) {
        const loadedEnv = loadEnvFiles(envFiles)
        envVars = { ...envVars, ...loadedEnv }
    }

    // First check if env is valid
    const isValid = checkEnv(appName, envVars)

    if (!isValid) {
        console.error('\n❌ Environment validation failed. Fix the errors above before running commands.')
        process.exit(1)
    }

    if (!command || command.length === 0) {
        console.log('\n✅ Environment validated successfully.')
        console.log('💡 Environment variables loaded into process.env')
        
        // Load into process.env
        Object.assign(process.env, envVars)
        return
    }

    // Run the command with validated environment
    console.log(`\n🚀 Running command: ${command.join(' ')}`)
    
    const child = spawn(command[0], command.slice(1), {
        stdio: 'inherit',
        env: envVars,
        shell: true,
    })

    child.on('exit', (code) => {
        process.exit(code ?? 0)
    })

    child.on('error', (err) => {
        console.error('❌ Failed to run command:', err)
        process.exit(1)
    })
}

/**
 * Main CLI entry point
 */
function main() {
    const args = process.argv.slice(2)

    // Parse command: checkbun packages/env/src/cli.ts check-env or load
    const command = args[0]

    if (!command || !['check', 'load', 'mock'].includes(command)) {
        console.error(`
Usage:
  check [app]           Check environment variables
  load [app] [--env <file>...] [--command <cmd>]  Load and validate environment, optionally run command
  mock [app] [--command <cmd>]  Load mock environment variables, optionally run command

Examples:
  check                 Check all apps (uses process.env)
  check web             Check web app only
  load                  Validate all apps (uses process.env)
  load web              Validate web app only
  load --env .env       Load .env file and validate
  load --env .env --env .env.local  Load multiple .env files and validate
  load web --env .env --command "bun run dev"  Load .env, validate web, and run command
  mock api                  Load mock API environment
  mock web --command "bun run dev"  Load mock web env and run command
  mock --command "bun run test"  Load all mock envs and run tests
        `.trim())
        process.exit(1)
    }

    // Get app name if provided (must be second arg and be a valid app name)
    const appArg = args[1]
    const appName = appArg && ['api', 'web', 'doc'].includes(appArg) 
        ? appArg as AppName 
        : undefined

    if (command === 'check') {
        const success = checkEnv(appName)
        process.exit(success ? 0 : 1)
    }

    if (command === 'load') {
        // Parse --env flags
        const envFiles: string[] = []
        let i = appName ? 2 : 1 // Start after app name if provided
        
        while (i < args.length) {
            if (args[i] === '--env' && args[i + 1]) {
                envFiles.push(args[i + 1])
                i += 2
            } else if (args[i] === '--command') {
                break
            } else {
                i++
            }
        }

        // Find --command flag
        const commandIndex = args.findIndex(arg => arg === '--command')
        const commandToRun = commandIndex !== -1 ? args.slice(commandIndex + 1) : undefined

        loadEnv(appName, envFiles.length > 0 ? envFiles : undefined, commandToRun)
    }

    if (command === 'mock') {
        // Find --command flag
        const commandIndex = args.findIndex(arg => arg === '--command')
        const commandToRun = commandIndex !== -1 ? args.slice(commandIndex + 1) : undefined

        mockEnv(appName, commandToRun)
    }
}

/**
 * Load mock environment variables and optionally run a command
 */
function mockEnv(appName?: AppName, command?: string[]): void {
    console.log('🎭 Loading mock environment variables...')

    // Get mock environment
    const mockVars = appName ? getMockEnv(appName) : getAllMockEnv()
    console.log(`✅ Loaded mock environment for ${appName || 'all apps'}`)

    // Merge with existing process.env (mock as defaults, process.env overrides)
    const envVars = { ...mockVars, ...process.env } as any

    // Validate the environment
    const isValid = checkEnv(appName, envVars)

    if (!isValid) {
        console.error('\n❌ Mock environment validation failed. Check errors above.')
        process.exit(1)
    }

    if (!command || command.length === 0) {
        console.log('\n✅ Mock environment validated successfully.')
        console.log('💡 Mock environment variables loaded into process.env')
        
        // Load into process.env
        Object.assign(process.env, mockVars)
        return
    }

    // Run the command with mock environment
    console.log(`\n🚀 Running command: ${command.join(' ')}`)
    
    const child = spawn(command[0], command.slice(1), {
        stdio: 'inherit',
        env: envVars,
        shell: true,
    })

    child.on('exit', (code) => {
        process.exit(code ?? 0)
    })

    child.on('error', (err) => {
        console.error('❌ Failed to run command:', err)
        process.exit(1)
    })
}

main()
