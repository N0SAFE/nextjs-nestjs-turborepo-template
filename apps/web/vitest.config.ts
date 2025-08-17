/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { createNextJSConfig } from '@repo/vitest-config/nextjs'

export default defineConfig(
    createNextJSConfig({
        plugins: [react()],
        test: {
            name: 'web',
            environment: 'jsdom',
            include: [
                'src/**/*.test.{ts,tsx,js,jsx}',
                'src/**/*.spec.{ts,tsx,js,jsx}',
                'src/**/__tests__/**/*.{ts,tsx,js,jsx}',
            ],
            exclude: ['node_modules', 'dist', '.next'],
            setupFiles: ['./vitest.setup.ts'],
            globals: true,
            // Mock Next.js modules
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
            // Mock Next.js env variables
            'process.env.NODE_ENV': '"test"',
            'process.env.NEXT_PUBLIC_API_URL': '"http://localhost:3001"',
            'process.env.NEXT_PUBLIC_DOC_URL': '"http://localhost:3020"',
        },
    })
)
