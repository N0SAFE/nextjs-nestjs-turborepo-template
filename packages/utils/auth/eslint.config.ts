import baseConfig, { defineConfig } from '@repo/config-eslint'

export default defineConfig([
    {extends:[baseConfig.configs.base()],
        files: ["src/**/*.{ts,tsx}"],
    },
    {extends: [baseConfig.configs.test()],
        files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    },
])
