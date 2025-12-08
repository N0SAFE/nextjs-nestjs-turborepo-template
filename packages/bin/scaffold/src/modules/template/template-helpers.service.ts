/**
 * Template Helpers Service
 *
 * Provides Handlebars helpers for template rendering.
 */
import { Injectable } from "@nestjs/common";
import Handlebars from "handlebars";

export interface HelperContext {
  name: string;
  fn: Handlebars.HelperDelegate;
  description?: string;
}

@Injectable()
export class TemplateHelpersService {
  private helpers: Map<string, HelperContext> = new Map();

  constructor() {
    this.registerBuiltinHelpers();
  }

  /**
   * Register a custom helper
   */
  register(name: string, fn: Handlebars.HelperDelegate, description?: string): void {
    this.helpers.set(name, { name, fn, description });
    Handlebars.registerHelper(name, fn);
  }

  /**
   * Get all registered helpers
   */
  getAll(): HelperContext[] {
    return Array.from(this.helpers.values());
  }

  /**
   * Register built-in helpers for project scaffolding
   */
  private registerBuiltinHelpers(): void {
    // String manipulation helpers
    this.register("lowercase", (str: string) => str?.toLowerCase() ?? "", "Convert to lowercase");
    this.register("uppercase", (str: string) => str?.toUpperCase() ?? "", "Convert to uppercase");
    this.register("capitalize", (str: string) => {
      if (!str) return "";
      return str.charAt(0).toUpperCase() + str.slice(1);
    }, "Capitalize first letter");
    
    this.register("camelCase", (str: string) => {
      if (!str) return "";
      return str
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
        .replace(/^(.)/, (c) => c.toLowerCase());
    }, "Convert to camelCase");
    
    this.register("pascalCase", (str: string) => {
      if (!str) return "";
      return str
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
        .replace(/^(.)/, (c) => c.toUpperCase());
    }, "Convert to PascalCase");
    
    this.register("kebabCase", (str: string) => {
      if (!str) return "";
      return str
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase();
    }, "Convert to kebab-case");
    
    this.register("snakeCase", (str: string) => {
      if (!str) return "";
      return str
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
        .toLowerCase();
    }, "Convert to snake_case");
    
    this.register("constantCase", (str: string) => {
      if (!str) return "";
      return str
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
        .toUpperCase();
    }, "Convert to CONSTANT_CASE");

    // Array helpers
    this.register("join", (arr: unknown[], separator = ", ") => {
      if (!Array.isArray(arr)) return "";
      return arr.join(separator);
    }, "Join array with separator");
    
    this.register("includes", function(this: unknown, arr: unknown[], value: unknown, options: Handlebars.HelperOptions) {
      if (!Array.isArray(arr)) return options.inverse(this);
      return arr.includes(value) ? options.fn(this) : options.inverse(this);
    }, "Check if array includes value");
    
    this.register("length", (arr: unknown[]) => {
      if (!Array.isArray(arr)) return 0;
      return arr.length;
    }, "Get array length");

    // Conditional helpers
    this.register("eq", function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
      return a === b ? options.fn(this) : options.inverse(this);
    }, "Check equality");
    
    this.register("neq", function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
      return a !== b ? options.fn(this) : options.inverse(this);
    }, "Check inequality");
    
    this.register("gt", function(this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
      return a > b ? options.fn(this) : options.inverse(this);
    }, "Greater than");
    
    this.register("lt", function(this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
      return a < b ? options.fn(this) : options.inverse(this);
    }, "Less than");
    
    this.register("and", function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
      return a && b ? options.fn(this) : options.inverse(this);
    }, "Logical AND");
    
    this.register("or", function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
      return a || b ? options.fn(this) : options.inverse(this);
    }, "Logical OR");
    
    this.register("not", function(this: unknown, value: unknown, options: Handlebars.HelperOptions) {
      return !value ? options.fn(this) : options.inverse(this);
    }, "Logical NOT");

    // JSON helpers
    this.register("json", (obj: unknown, indent = 2) => {
      return JSON.stringify(obj, null, indent);
    }, "Stringify to JSON");
    
    this.register("jsonCompact", (obj: unknown) => {
      return JSON.stringify(obj);
    }, "Stringify to compact JSON");

    // Path helpers
    this.register("pathJoin", (...args: unknown[]) => {
      const parts = args.slice(0, -1) as string[];
      return parts.filter(Boolean).join("/");
    }, "Join path segments");

    // Date helpers
    this.register("now", () => new Date().toISOString(), "Current ISO timestamp");
    this.register("year", () => new Date().getFullYear(), "Current year");

    // Package.json helpers
    this.register("dependencyVersion", (name: string, fallback = "*") => {
      const versions: Record<string, string> = {
        // Core
        "typescript": "^5.8.3",
        "react": "^19.0.0",
        "react-dom": "^19.0.0",
        "next": "15.4.0-canary.62",
        "@nestjs/core": "^11.1.3",
        "@nestjs/common": "^11.1.3",
        "@nestjs/platform-express": "^11.1.3",
        
        // Database
        "drizzle-orm": "^0.44.2",
        "drizzle-kit": "^0.30.5",
        "postgres": "^3.4.7",
        "@neondatabase/serverless": "^0.10.4",
        
        // Auth
        "better-auth": "^1.2.8",
        
        // API
        "@orpc/server": "^1.6.2",
        "@orpc/client": "^1.6.2",
        "@tanstack/react-query": "^5.65.1",
        
        // Dev tools
        "eslint": "^9.28.0",
        "prettier": "^3.5.3",
        "vitest": "^3.2.1",
        "turbo": "^2.5.3",
        
        // Build
        "tsup": "^8.5.0",
        "esbuild": "^0.25.4",
        
        // Utilities
        "zod": "^3.25.23",
        "lodash": "^4.17.21",
        "date-fns": "^4.1.0",
      };
      return versions[name] ?? fallback;
    }, "Get recommended package version");

    // Docker helpers
    this.register("dockerPort", (service: string, fallback: number) => {
      const ports: Record<string, number> = {
        api: 3001,
        web: 3000,
        doc: 3002,
        db: 5432,
        redis: 6379,
      };
      return ports[service] ?? fallback;
    }, "Get default Docker port for service");

    // Comment helpers
    this.register("comment", (text: string, style: "js" | "sh" | "html" = "js") => {
      switch (style) {
        case "sh": return `# ${text}`;
        case "html": return `<!-- ${text} -->`;
        default: return `// ${text}`;
      }
    }, "Create comment in specified style");
    
    this.register("blockComment", (text: string, style: "js" | "html" = "js") => {
      switch (style) {
        case "html": return `<!-- ${text} -->`;
        default: return `/* ${text} */`;
      }
    }, "Create block comment");

    // Indentation helpers
    this.register("indent", (text: string, spaces: number) => {
      const indent = " ".repeat(spaces);
      return text.split("\n").map(line => indent + line).join("\n");
    }, "Indent text by spaces");

    // Default value helper
    this.register("default", (value: unknown, defaultValue: unknown) => {
      return value ?? defaultValue;
    }, "Provide default value if null/undefined");
  }

  /**
   * Create a Handlebars instance with all helpers registered
   */
  createInstance(): typeof Handlebars {
    const instance = Handlebars.create();
    
    for (const { name, fn } of this.helpers.values()) {
      instance.registerHelper(name, fn);
    }
    
    return instance;
  }
}
