/**
 * Template Service
 *
 * Handlebars-based template processing with custom helpers.
 */
import { Injectable, type OnModuleInit } from "@nestjs/common";
import Handlebars from "handlebars";
import type { TemplateData, TemplateHelper } from "../../types/generator.types";
import { TemplateError } from "../../types/errors.types";

@Injectable()
export class TemplateService implements OnModuleInit {
  private handlebars: typeof Handlebars;
  private compiledTemplates: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.handlebars = Handlebars.create();
  }

  onModuleInit() {
    this.registerBuiltinHelpers();
  }

  /**
   * Render a template string with data
   */
  render(template: string, data: TemplateData): string {
    try {
      const compiled = this.handlebars.compile(template, {
        strict: false,
        noEscape: true,
      });
      return compiled(data);
    } catch (error) {
      throw new TemplateError(
        "inline",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Render a named template (from cache or compile)
   */
  renderNamed(name: string, template: string, data: TemplateData): string {
    try {
      let compiled = this.compiledTemplates.get(name);

      if (!compiled) {
        compiled = this.handlebars.compile(template, {
          strict: false,
          noEscape: true,
        });
        this.compiledTemplates.set(name, compiled);
      }

      return compiled(data);
    } catch (error) {
      throw new TemplateError(
        name,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, template: string): void {
    this.handlebars.registerPartial(name, template);
  }

  /**
   * Register a custom helper
   */
  registerHelper(name: string, helper: TemplateHelper): void {
    this.handlebars.registerHelper(name, helper);
  }

  /**
   * Clear compiled template cache
   */
  clearCache(): void {
    this.compiledTemplates.clear();
  }

  /**
   * Register built-in helpers
   */
  private registerBuiltinHelpers(): void {
    // String manipulation
    this.handlebars.registerHelper("lowercase", (str: string) =>
      str?.toLowerCase() ?? "",
    );
    this.handlebars.registerHelper("uppercase", (str: string) =>
      str?.toUpperCase() ?? "",
    );
    this.handlebars.registerHelper("capitalize", (str: string) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1) : "",
    );
    this.handlebars.registerHelper("camelCase", (str: string) =>
      this.toCamelCase(str ?? ""),
    );
    this.handlebars.registerHelper("pascalCase", (str: string) =>
      this.toPascalCase(str ?? ""),
    );
    this.handlebars.registerHelper("kebabCase", (str: string) =>
      this.toKebabCase(str ?? ""),
    );
    this.handlebars.registerHelper("snakeCase", (str: string) =>
      this.toSnakeCase(str ?? ""),
    );

    // Conditional helpers
    this.handlebars.registerHelper(
      "eq",
      (a: unknown, b: unknown) => a === b,
    );
    this.handlebars.registerHelper(
      "ne",
      (a: unknown, b: unknown) => a !== b,
    );
    this.handlebars.registerHelper(
      "gt",
      (a: number, b: number) => a > b,
    );
    this.handlebars.registerHelper(
      "lt",
      (a: number, b: number) => a < b,
    );
    this.handlebars.registerHelper(
      "gte",
      (a: number, b: number) => a >= b,
    );
    this.handlebars.registerHelper(
      "lte",
      (a: number, b: number) => a <= b,
    );
    this.handlebars.registerHelper(
      "and",
      (a: unknown, b: unknown) => a && b,
    );
    this.handlebars.registerHelper(
      "or",
      (a: unknown, b: unknown) => a || b,
    );
    this.handlebars.registerHelper("not", (a: unknown) => !a);

    // Array helpers
    this.handlebars.registerHelper(
      "includes",
      (arr: unknown[], item: unknown) =>
        Array.isArray(arr) && arr.includes(item),
    );
    this.handlebars.registerHelper(
      "length",
      (arr: unknown[]) => arr?.length ?? 0,
    );
    this.handlebars.registerHelper(
      "first",
      (arr: unknown[]) => arr?.[0],
    );
    this.handlebars.registerHelper(
      "last",
      (arr: unknown[]) => arr?.[arr.length - 1],
    );
    this.handlebars.registerHelper(
      "join",
      (arr: unknown[], separator: string) =>
        Array.isArray(arr) ? arr.join(separator) : "",
    );

    // Object helpers
    this.handlebars.registerHelper(
      "json",
      (obj: unknown, indent?: number) =>
        JSON.stringify(obj, null, indent ?? 2),
    );
    this.handlebars.registerHelper(
      "keys",
      (obj: Record<string, unknown>) =>
        obj ? Object.keys(obj) : [],
    );
    this.handlebars.registerHelper(
      "values",
      (obj: Record<string, unknown>) =>
        obj ? Object.values(obj) : [],
    );

    // Package/project helpers
    this.handlebars.registerHelper(
      "packageScope",
      (name: string) => {
        if (!name) return "";
        return name.startsWith("@") ? name.split("/")[0] : "";
      },
    );
    this.handlebars.registerHelper(
      "packageName",
      (name: string) => {
        if (!name) return "";
        return name.startsWith("@") ? name.split("/")[1] ?? name : name;
      },
    );

    // Date helpers
    this.handlebars.registerHelper("now", () => new Date().toISOString());
    this.handlebars.registerHelper(
      "year",
      () => new Date().getFullYear(),
    );

    // Conditional block helpers
    this.handlebars.registerHelper(
      "ifPlugin",
      function (
        this: TemplateData,
        pluginId: string,
        options: Handlebars.HelperOptions,
      ) {
        const plugins = this.enabledPlugins;
        if (Array.isArray(plugins) && plugins.includes(pluginId)) {
          return options.fn(this);
        }
        return options.inverse(this);
      },
    );

    this.handlebars.registerHelper(
      "ifAnyPlugin",
      function (
        this: TemplateData,
        pluginIds: string[],
        options: Handlebars.HelperOptions,
      ) {
        const plugins = this.enabledPlugins;
        if (
          Array.isArray(plugins) &&
          pluginIds.some((id) => plugins.includes(id))
        ) {
          return options.fn(this);
        }
        return options.inverse(this);
      },
    );

    this.handlebars.registerHelper(
      "ifAllPlugins",
      function (
        this: TemplateData,
        pluginIds: string[],
        options: Handlebars.HelperOptions,
      ) {
        const plugins = this.enabledPlugins;
        if (
          Array.isArray(plugins) &&
          pluginIds.every((id) => plugins.includes(id))
        ) {
          return options.fn(this);
        }
        return options.inverse(this);
      },
    );

    // Indentation helper
    this.handlebars.registerHelper(
      "indent",
      (text: string, spaces: number) => {
        if (!text) return "";
        const indent = " ".repeat(spaces);
        return text
          .split("\n")
          .map((line) => indent + line)
          .join("\n");
      },
    );
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
      .replace(/^./, (c) => c.toLowerCase());
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
      .replace(/^./, (c) => c.toUpperCase());
  }

  /**
   * Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .toLowerCase();
  }

  /**
   * Convert string to snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[\s-]+/g, "_")
      .toLowerCase();
  }
}
