import type { Config } from "prettier";
import BaseConfig from "./base";

/**
 * @see https://prettier.io/docs/en/configuration.html
 */
const config: Config = {
    ...(BaseConfig as any),
    plugins: [...((BaseConfig as any).plugins || []), "prettier-plugin-tailwindcss"]
};

export default config;
