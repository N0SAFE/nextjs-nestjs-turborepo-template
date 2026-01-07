import libraryConfig from '@repo-configs/eslint/library'
import { defineConfig } from "@repo-configs/eslint";

export default defineConfig([
    {extends:[libraryConfig.configs.base],
        files: ["src/**/*.{ts,tsx}"],
    },
])
