/**
 * File Merger Service
 *
 * Handles merging of file contributions from multiple plugins.
 * Supports various merge strategies for different file types.
 */

import { Injectable, Logger } from "@nestjs/common";
import * as path from "node:path";
import type {
  FileContribution,
  MergeStrategy,
  ASTTransform,
  ASTTransformType,
} from "../../types/generator.types";

@Injectable()
export class FileMergerService {
  private readonly logger = new Logger(FileMergerService.name);

  /**
   * Merge all contributions for a single file path
   */
  async mergeContributions(
    contributions: FileContribution[],
    existingContent?: string
  ): Promise<MergeResult> {
    if (contributions.length === 0) {
      return {
        success: true,
        content: existingContent || "",
        contributors: [],
      };
    }

    // Sort by priority (lower = earlier)
    const sorted = [...contributions].sort((a, b) => a.priority - b.priority);

    let content = existingContent || "";
    const contributors: string[] = [];
    const errors: string[] = [];

    for (const contribution of sorted) {
      try {
        content = await this.applyContribution(contribution, content);
        contributors.push(contribution.pluginId);
        this.logger.debug(
          `Applied contribution from ${contribution.pluginId} using ${contribution.mergeStrategy}`
        );
      } catch (error) {
        const errorMsg = `Failed to apply contribution from ${contribution.pluginId}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        this.logger.error(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      content,
      contributors,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Apply a single contribution using its merge strategy
   */
  private async applyContribution(
    contribution: FileContribution,
    existingContent: string
  ): Promise<string> {
    switch (contribution.mergeStrategy) {
      case "replace":
        return this.mergeReplace(contribution.content);

      case "json-merge":
        return this.mergeJson(existingContent, contribution.content, false);

      case "json-merge-deep":
        return this.mergeJson(existingContent, contribution.content, true);

      case "append":
        return this.mergeAppend(existingContent, contribution.content);

      case "prepend":
        return this.mergePrepend(existingContent, contribution.content);

      case "insert-after":
        return this.mergeInsertAfter(
          existingContent,
          contribution.content,
          contribution.marker
        );

      case "insert-before":
        return this.mergeInsertBefore(
          existingContent,
          contribution.content,
          contribution.marker
        );

      case "line-merge":
        return this.mergeLines(existingContent, contribution.content);

      case "section-merge":
        return this.mergeSections(
          existingContent,
          contribution.content,
          contribution.section
        );

      case "ast-transform":
        return this.mergeAST(
          existingContent,
          contribution.content,
          contribution.astTransform
        );

      default:
        throw new Error(`Unknown merge strategy: ${contribution.mergeStrategy}`);
    }
  }

  /**
   * Replace strategy - full file replacement
   */
  private mergeReplace(content: string): string {
    return content;
  }

  /**
   * JSON merge strategy
   */
  private mergeJson(
    existing: string,
    incoming: string,
    deep: boolean
  ): string {
    const existingObj = existing ? JSON.parse(existing) : {};
    const incomingObj = JSON.parse(incoming);

    const merged = deep
      ? this.deepMerge(existingObj, incomingObj)
      : { ...existingObj, ...incomingObj };

    return JSON.stringify(merged, null, 2);
  }

  /**
   * Deep merge objects with array handling
   */
  private deepMerge(target: unknown, source: unknown): unknown {
    if (source === null || source === undefined) {
      return target;
    }

    if (Array.isArray(source)) {
      if (Array.isArray(target)) {
        // Concatenate and deduplicate arrays
        const combined = [...target, ...source];
        // Try to deduplicate primitive values
        if (combined.every((item) => typeof item !== "object" || item === null)) {
          return [...new Set(combined)];
        }
        return combined;
      }
      return source;
    }

    if (typeof source === "object" && typeof target === "object" && target !== null) {
      const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };

      for (const key of Object.keys(source as Record<string, unknown>)) {
        const sourceValue = (source as Record<string, unknown>)[key];
        const targetValue = (target as Record<string, unknown>)[key];

        result[key] = this.deepMerge(targetValue, sourceValue);
      }

      return result;
    }

    return source;
  }

  /**
   * Append strategy - add content to end
   */
  private mergeAppend(existing: string, content: string): string {
    if (!existing) return content;
    return existing.trimEnd() + "\n" + content;
  }

  /**
   * Prepend strategy - add content to start
   */
  private mergePrepend(existing: string, content: string): string {
    if (!existing) return content;
    return content + "\n" + existing.trimStart();
  }

  /**
   * Insert after marker/pattern
   */
  private mergeInsertAfter(
    existing: string,
    content: string,
    marker?: string | RegExp
  ): string {
    if (!marker) {
      throw new Error("Insert-after requires a marker");
    }

    const pattern = typeof marker === "string" ? new RegExp(marker, "m") : marker;
    const match = existing.match(pattern);

    if (!match || match.index === undefined) {
      // Marker not found, append to end
      this.logger.warn(`Marker not found, appending to end`);
      return this.mergeAppend(existing, content);
    }

    const insertPos = match.index + match[0].length;
    return (
      existing.slice(0, insertPos) +
      "\n" +
      content +
      existing.slice(insertPos)
    );
  }

  /**
   * Insert before marker/pattern
   */
  private mergeInsertBefore(
    existing: string,
    content: string,
    marker?: string | RegExp
  ): string {
    if (!marker) {
      throw new Error("Insert-before requires a marker");
    }

    const pattern = typeof marker === "string" ? new RegExp(marker, "m") : marker;
    const match = existing.match(pattern);

    if (!match || match.index === undefined) {
      // Marker not found, prepend to start
      this.logger.warn(`Marker not found, prepending to start`);
      return this.mergePrepend(existing, content);
    }

    return (
      existing.slice(0, match.index) +
      content +
      "\n" +
      existing.slice(match.index)
    );
  }

  /**
   * Line merge - merge unique lines (for .gitignore, etc.)
   */
  private mergeLines(existing: string, content: string): string {
    const existingLines = new Set(
      existing
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)
    );

    const newLines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !existingLines.has(line));

    if (newLines.length === 0) {
      return existing;
    }

    return existing.trimEnd() + "\n" + newLines.join("\n");
  }

  /**
   * Section merge - merge by section markers
   * Sections are marked with: # --- SECTION: name ---
   */
  private mergeSections(
    existing: string,
    content: string,
    sectionName?: string
  ): string {
    if (!sectionName) {
      throw new Error("Section-merge requires a section name");
    }

    const sectionStart = `# --- SECTION: ${sectionName} ---`;
    const sectionEnd = `# --- END SECTION: ${sectionName} ---`;

    // Check if section exists
    const startIdx = existing.indexOf(sectionStart);

    if (startIdx === -1) {
      // Section doesn't exist, append new section
      return (
        existing.trimEnd() +
        "\n\n" +
        sectionStart +
        "\n" +
        content +
        "\n" +
        sectionEnd
      );
    }

    const endIdx = existing.indexOf(sectionEnd, startIdx);

    if (endIdx === -1) {
      // Malformed section, append content after start marker
      const afterStart = startIdx + sectionStart.length;
      return (
        existing.slice(0, afterStart) +
        "\n" +
        content +
        existing.slice(afterStart)
      );
    }

    // Replace section content
    return (
      existing.slice(0, startIdx + sectionStart.length) +
      "\n" +
      content +
      "\n" +
      existing.slice(endIdx)
    );
  }

  /**
   * AST transform - code modifications
   * This is a simplified version; full AST transforms would use ts-morph or similar
   */
  private mergeAST(
    existing: string,
    content: string,
    transformType?: ASTTransformType
  ): string {
    if (!transformType) {
      throw new Error("AST transform requires a transform type");
    }

    switch (transformType) {
      case "add-import":
        return this.addImport(existing, content);

      case "add-export":
        return this.addExport(existing, content);

      case "add-array-item":
        return this.addArrayItem(existing, content);

      default:
        // For complex transforms, fall back to append
        this.logger.warn(`Complex AST transform ${transformType} not fully implemented, using append`);
        return this.mergeAppend(existing, content);
    }
  }

  /**
   * Add import statement (simple implementation)
   */
  private addImport(existing: string, importStatement: string): string {
    // Check if import already exists
    const importMatch = importStatement.match(/from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const moduleName = importMatch[1];
      if (existing.includes(`from '${moduleName}'`) || existing.includes(`from "${moduleName}"`)) {
        // Import already exists, skip
        return existing;
      }
    }

    // Find the last import statement
    const lines = existing.split("\n");
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.trimStart().startsWith("import ")) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex === -1) {
      // No imports, add at the beginning
      return importStatement + "\n" + existing;
    }

    // Insert after last import
    lines.splice(lastImportIndex + 1, 0, importStatement);
    return lines.join("\n");
  }

  /**
   * Add export statement (simple implementation)
   */
  private addExport(existing: string, exportStatement: string): string {
    // Check if export already exists
    const exportMatch = exportStatement.match(/export\s+\*?\s*(?:from\s+)?['"]?([^'";\s]+)/);
    if (exportMatch && exportMatch[1] && existing.includes(exportMatch[1])) {
      return existing;
    }

    // Find the last export statement or end of file
    const lines = existing.split("\n");
    let lastExportIndex = lines.length - 1;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line && line.trimStart().startsWith("export ")) {
        lastExportIndex = i;
        break;
      }
    }

    lines.splice(lastExportIndex + 1, 0, exportStatement);
    return lines.join("\n");
  }

  /**
   * Add item to array (simple implementation)
   * Assumes content format: "arrayName:value"
   */
  private addArrayItem(existing: string, content: string): string {
    const [arrayName, value] = content.split(":");
    if (!arrayName || !value) {
      throw new Error("Invalid array item format. Expected: arrayName:value");
    }

    // Simple regex to find array and add item
    const arrayPattern = new RegExp(
      `(${arrayName}\\s*[=:]\\s*\\[)([^\\]]*)\\]`,
      "s"
    );
    const match = existing.match(arrayPattern);

    if (!match) {
      this.logger.warn(`Array "${arrayName}" not found`);
      return existing;
    }

    const arrayContent = match[2] ?? "";
    const hasItems = arrayContent.trim().length > 0;

    const newContent = hasItems
      ? arrayContent.trimEnd() + ",\n  " + value.trim()
      : "\n  " + value.trim() + "\n";

    return existing.replace(arrayPattern, `$1${newContent}]`);
  }

  /**
   * Group contributions by file path
   */
  groupByPath(contributions: FileContribution[]): Map<string, FileContribution[]> {
    const grouped = new Map<string, FileContribution[]>();

    for (const contribution of contributions) {
      const existing = grouped.get(contribution.path) || [];
      existing.push(contribution);
      grouped.set(contribution.path, existing);
    }

    return grouped;
  }

  /**
   * Get appropriate merge strategy for a file based on extension
   */
  getDefaultMergeStrategy(filePath: string): MergeStrategy {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();

    // JSON files
    if (ext === ".json" || basename === "package.json" || basename === "tsconfig.json") {
      return "json-merge";
    }

    // Config files that benefit from deep merge
    if (
      basename.includes("config") &&
      (ext === ".json" || ext === ".js" || ext === ".ts")
    ) {
      return "json-merge-deep";
    }

    // Ignore files
    if (basename === ".gitignore" || basename === ".npmignore" || basename === ".dockerignore") {
      return "line-merge";
    }

    // TypeScript/JavaScript files - use AST for imports
    if (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx") {
      return "replace"; // Default to replace, specific operations use AST
    }

    // CSS/SCSS files
    if (ext === ".css" || ext === ".scss" || ext === ".sass") {
      return "append";
    }

    // Markdown files
    if (ext === ".md") {
      return "append";
    }

    // Default
    return "replace";
  }

  /**
   * Validate contributions for conflicts
   */
  validateContributions(contributions: FileContribution[]): ValidationResult {
    const issues: string[] = [];
    const grouped = this.groupByPath(contributions);

    for (const [filePath, fileContributions] of grouped) {
      // Check for multiple "replace" strategies
      const replaceCount = fileContributions.filter(
        (c) => c.mergeStrategy === "replace"
      ).length;

      if (replaceCount > 1) {
        issues.push(
          `File "${filePath}" has ${replaceCount} contributions with 'replace' strategy. ` +
            `Only the last one (highest priority) will take effect.`
        );
      }

      // Check for conflicting strategies
      const strategies = new Set(fileContributions.map((c) => c.mergeStrategy));
      if (strategies.has("replace") && strategies.size > 1) {
        issues.push(
          `File "${filePath}" has 'replace' strategy mixed with other strategies. ` +
            `The 'replace' contribution will override others based on priority.`
        );
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

/**
 * Result of merging contributions
 */
export interface MergeResult {
  /** Whether merge was successful */
  success: boolean;
  /** Final merged content */
  content: string;
  /** Plugin IDs that contributed */
  contributors: string[];
  /** Error messages if any */
  errors?: string[];
}

/**
 * Result of validating contributions
 */
export interface ValidationResult {
  /** Whether contributions are valid */
  valid: boolean;
  /** Validation issues */
  issues: string[];
}
