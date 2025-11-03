/// <reference types="vitest" />
import { defineProject } from 'vitest/config'
import * as path from 'path'
import { createNodeConfig } from '@repo-configs/vitest'

export default defineProject(
    createNodeConfig({
        test: {
            name: 'types',
            environment: 'node',
            include: ['__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
            exclude: ['node_modules', 'dist'],
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
