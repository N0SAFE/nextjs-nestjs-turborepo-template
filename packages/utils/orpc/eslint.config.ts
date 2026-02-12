import libraryConfig from '@repo/config-eslint/library'
import { defineConfig } from "@repo/config-eslint"

export default defineConfig([
    {extends:[libraryConfig.configs.base()],
        files: ["src/**/*.{ts,tsx}"],
    },
    {extends: [libraryConfig.configs.test()],
        files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-return": "off",
        },
    },
])
