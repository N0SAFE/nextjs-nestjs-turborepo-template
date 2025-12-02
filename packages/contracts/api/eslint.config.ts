import libraryConfig from "@repo-configs/eslint/library";
import { defineConfig } from "@repo-configs/eslint";

export default defineConfig([
    {
        extends: [libraryConfig.configs.base],
        files: ["**/*.{ts,tsx}"],
    },
    {
        extends: [libraryConfig.configs.test],
        files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    },
]);
