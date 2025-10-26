/// <reference types="vitest" />
import { defineProject } from 'vitest/config'
import * as path from 'path'
import { createNodeConfig } from '@repo/vitest-config/node'

export default defineProject(
    createNodeConfig({
        test: {
            name: 'bin',
            environment: 'node',
            include: [
                '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
                '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts}'
            ],
            exclude: [
                'node_modules', 
                'dist',
            ],
            globals: true,
        },
        resolve: {
            alias: {
                '@': path.resolve(process.cwd(), './'),
                '@repo': path.resolve(process.cwd(), '../../packages'),
            },
        },
    })
)
