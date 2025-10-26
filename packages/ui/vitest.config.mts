/// <reference types="vitest" />
import { defineProject } from 'vitest/config'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { createReactConfig } from '@repo/vitest-config/react'

export default defineProject(
    createReactConfig({
        plugins: [react()],
        test: {
            name: 'ui',
            environment: 'jsdom',
            include: [
                '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
                '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
            ],
            exclude: [
                'node_modules', 
                'dist',
                'components/shadcn/**/*' // Exclude shadcn components from testing
            ],
            setupFiles: ['./vitest.setup.ts'],
            globals: true,
        },
        resolve: {
            alias: {
                '@': path.resolve(process.cwd(), './src'),
                '~': path.resolve(process.cwd(), './'),
                '@repo': path.resolve(process.cwd(), '../../packages'),
            },
        },
    })
)
