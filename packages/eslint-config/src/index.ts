import type { Linter } from "eslint";

const config: Linter.Config = {
    extends: ["next/core-web-vitals", "turbo", "prettier"],
    rules: {
        "@next/next/no-html-link-for-pages": "off"
    }
} as any;

export default config;
