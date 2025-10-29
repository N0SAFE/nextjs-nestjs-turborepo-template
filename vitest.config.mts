import { defineConfig } from "vitest/config";
import { createBaseConfig } from '@repo/vitest-config/base'

export default defineConfig(
    createBaseConfig({
        test: {
            projects: [
                "apps/*/vitest.config.mts",
                "packages/*/vitest.config.mts",
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
