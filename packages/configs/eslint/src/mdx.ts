import * as mdx from "eslint-plugin-mdx";
import { defineConfig } from "eslint/config";
import { ignoresConfig } from "./base";

const base = defineConfig([
    ...ignoresConfig,
    [
        {
            ...mdx.flat,
            // optional, if you want to lint code blocks at the same
            processor: mdx.createRemarkProcessor({
                lintCodeBlocks: true,
                // optional, if you want to disable language mapper, set it to `false`
                // if you want to override the default language mapper inside, you can provide your own
                languageMapper: {},
                // optional, same as the `parserOptions.ignoreRemarkConfig`, you have to specify it twice unfortunately
                ignoreRemarkConfig: true,
                // optional, same as the `parserOptions.remarkConfigPath`, you have to specify it twice unfortunately
                remarkConfigPath: "path/to/your/remarkrc",
            }),
        },
        {
            ...mdx.flatCodeBlocks,
            rules: {
                ...mdx.flatCodeBlocks.rules,
                // if you want to override some rules for code blocks
                "no-var": "error",
                "prefer-const": "error",
            },
        },
    ],
]);

const all = defineConfig([
    base,
]);

export default {
    meta: {
        name: "@repo-configs/eslint/mdx",
        version: "0.0.0",
    },
    configs: {
        base,
        all,
    },
} as const;
