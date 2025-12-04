/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { createNextJsConfig } from '@repo-configs/vitest'

export default defineConfig(
    createNextJsConfig({
        plugins: [react()],
        test: {
            name: 'stats-dashboard',
            environment: 'jsdom',
            testTimeout: 10000,
            include: [
                'src/**/*.test.{ts,tsx,js,jsx}',
                'src/**/*.spec.{ts,tsx,js,jsx}',
                'src/**/__tests__/**/*.{ts,tsx,js,jsx}',
            ],
            exclude: ['node_modules', 'dist', '.next'],
            setupFiles: ['./vitest.setup.ts'],
            globals: true,
            server: {
                deps: {
                    inline: ['next', '@next/font'],
                },
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '#': path.resolve(__dirname, './'),
                '~': path.resolve(__dirname, './'),
                '@repo': path.resolve(__dirname, '../../packages'),
            },
        },
        define: {
            'process.env.NODE_ENV': '"test"',
            'process.env.NEXT_PUBLIC_STATS_PORT': '"3002"',
        },
    })
)
