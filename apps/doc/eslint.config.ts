import nextjsConfig from "@repo/eslint-config/nextjs";
// import mdxConfig from "@repo/eslint-config/mdx";
import { defineConfig } from "@repo/eslint-config";

export default defineConfig([
    {
        extends: [nextjsConfig.configs.base],
        files: ["src/**/*.{ts,tsx,js,jsx}"],
        rules: {
            "@typescript-eslint/ban-ts-comment": "off",
        },
    },
    {
        extends: [nextjsConfig.configs.test],
        files: ["**/__tests__/**/*.{ts,tsx,js,jsx}", "**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}"],
        // rules: {
        //     "@typescript-eslint/ban-ts-comment": "off",
        //     "@typescript-eslint/no-explicit-any": "off",
        //     "@typescript-eslint/no-unsafe-assignment": "off",
        //     "@typescript-eslint/no-unsafe-member-access": "off",
        //     "@typescript-eslint/no-unsafe-call": "off",
        //     "@typescript-eslint/no-unsafe-argument": "off",
        //     "@typescript-eslint/no-unsafe-return": "off",
        // },
    },
    // {
    //   ...mdxConfig,
    //   files: ["content/**/*.{md,mdx}"],
    // }
]);
