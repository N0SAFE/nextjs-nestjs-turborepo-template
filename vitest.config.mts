import { defineConfig } from "vitest/config";

const { createBaseConfig } = require('@repo/vitest-config/base')

export default defineConfig(
    createBaseConfig({
        test: {
            projects: [
                "apps/*/vitest.config.ts",
                "packages/*/vitest.config.ts",
            ],
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html'],
                reportsDirectory: './coverage',
                exclude: [
                    'node_modules',
                    'dist',
                    '**/*.config.*',
                    '**/*.setup.*',
                    'coverage/**',
                    '**/components/shadcn/**/*',
                    '**/indirectus/**/*',
                    '**/*.d.ts'
                ],
                thresholds: {
                    global: {
                        branches: 75,
                        functions: 75,
                        lines: 75,
                        statements: 75
                    }
                }
            }
        }
    })
);
