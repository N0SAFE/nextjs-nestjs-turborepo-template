import libraryConfig from "@repo/config-eslint/library";
import { defineConfig } from "@repo/config-eslint";

export default defineConfig([
  {
    extends: [libraryConfig.configs.base()],
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='oc'][callee.property.name='route']",
          message:
            "Direct `oc.route(...)` usage is forbidden. Use `route(...)` from `@repo/orpc-utils/builder` (RouteBuilder fluent API) instead.",
        },
      ],
    },
  },
]);