import libraryConfig from '@repo/config-eslint/library'
import { defineConfig } from "@repo/config-eslint";

export default defineConfig([
    {extends:[libraryConfig.configs.base()],
        files: ["src/**/*.{ts,tsx}"],
    },
])
