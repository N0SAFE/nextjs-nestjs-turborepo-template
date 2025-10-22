import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintNestJs from "@darraghor/eslint-plugin-nestjs-typed";

const tsconfigRootDir = process.cwd();

/** @type {import("eslint").Linter.Config} */
export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
  },
    eslintNestJs.configs.flatRecommended, // This is the recommended ruleset for this plugin, [
    {
        rules: {
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "no-unused-vars": "off",
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    prefer: "type-imports",
                },
            ],
            // Disable the buggy rule that crashes on decorator specs
            "@darraghor/nestjs-typed/param-decorator-name-matches-route-param": "off",
            "@darraghor/nestjs-typed/controllers-should-supply-api-tags": "off"
        },
    },
    // Relaxed rules for test files - mocking and test setup often require `any` types
    {
        files: ["**/*.spec.ts", "**/*.test.ts", "**/*.mock.ts"],
        rules: {
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-unnecessary-condition": "off",
            "@typescript-eslint/no-extraneous-class": "off",
            "@darraghor/nestjs-typed/injectable-should-be-provided": "off",
        },
    },
);
