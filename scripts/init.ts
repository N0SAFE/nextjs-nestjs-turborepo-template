#!/usr/bin/env -S bun

import fs from 'fs';
import path from 'path';
// @ts-ignore - prompts doesn't have TypeScript type declarations
import prompts, { PromptObject } from 'prompts';
import crypto from 'crypto';

// Type stubs for dotenv and dotenv-expand since they lack type declarations
interface DotenvConfig {
  parsed?: Record<string, string>;
  error?: Error;
}

interface DotenvExpandOptions {
  parsed?: Record<string, string>;
}

// Simple dotenv loader
const dotenv = {
  config: (options?: { path?: string }): DotenvConfig => {
    try {
      const envPath = options?.path || path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const parsed: Record<string, string> = {};
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const [key, ...rest] = trimmed.split('=');
          if (key) {
            parsed[key.trim()] = rest.join('=').trim();
          }
        }
        return { parsed };
      }
      return {};
    } catch (error) {
      return { error: error as Error };
    }
  },
};

const dotenvExpand = {
  expand: (config: DotenvExpandOptions): DotenvExpandOptions => config,
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * URL validation constraints
 */
interface UrlConstraints {
  protocol?: string;
  hostname?: string;
  port?: string;
}

/**
 * Number validation constraints
 */
interface NumberConstraints {
  min?: number;
  max?: number;
  allow?: number[];
}

/**
 * String validation constraints
 */
interface StringConstraints {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  optional?: boolean;
}

/**
 * Date validation constraints
 */
interface DateConstraints {
  minDate?: string;
  maxDate?: string;
  optional?: boolean;
  format?: string;
}

/**
 * Template configuration parsed from .env.template
 */
interface TemplateConfig {
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'url' | 'date' | 'json';
  label?: string;
  description?: string;
  default?: string | number | boolean;
  optional?: boolean;
  required?: boolean;
  generate?: 'random' | string;
  length?: number;
  secure?: boolean;
  separator?: string;
  options?: string[];
  labels?: string[];
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  allow?: number[];
  minDate?: string;
  maxDate?: string;
  format?: string;
  protocol?: string;
  hostname?: string;
  port?: string;
  skip_export?: boolean | string;
  skip?: boolean;
  skip_if_extracted?: boolean;
  skip_if_derived?: boolean;
  skip_if_referenced?: boolean;
  group?: string;
  transformer?: 'extract_port' | 'extract_hostname' | 'extract_protocol' | 'derive_url' | 'reference' | 'cors_origins';
  from?: string;
  base_url?: string;
  port_from?: string;
  from_urls?: string | string[];
}

/**
 * Group information metadata
 */
interface GroupInfo {
  id: string;
  name: string;
  description?: string;
}

/**
 * Grouped template structure
 */
interface GroupedTemplates {
  [key: string]: TemplateConfig | GroupedTemplates | { _groupInfo?: GroupInfo };
}

/**
 * Context passed to transformers and validators
 */
interface TransformContext {
  index?: number;
  total?: number;
  key?: string;
  answers?: Record<string, unknown>;
}

/**
 * Choice option for select/multiselect prompts
 */
interface PromptChoice {
  title: string;
  value: unknown;
  selected?: boolean;
}

/**
 * ANSI color codes for terminal output
 */
interface Colors {
  readonly reset: string;
  readonly bright: string;
  readonly dim: string;
  readonly red: string;
  readonly green: string;
  readonly yellow: string;
  readonly blue: string;
  readonly magenta: string;
  readonly cyan: string;
  readonly white: string;
  readonly bgBlue: string;
  readonly bgGreen: string;
}

/**
 * Validation result type
 */
type ValidationResult = true | string;

/**
 * Log level type
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEBUG_MODE: boolean = process.env.INIT_DEBUG === 'true' || process.argv.includes('--debug');

const colors: Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Debug logging function
 */
function debugLog(message: string, data: unknown = null): void {
  if (DEBUG_MODE) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(
      `${colors.dim}[${timestamp}] ${colors.cyan}🔍 DEBUG:${colors.reset} ${message}`
    );
    if (data !== null) {
      console.log(
        `${colors.dim}   Data:${colors.reset}`,
        typeof data === 'object' ? JSON.stringify(data, null, 2) : data
      );
    }
  }
}

/**
 * Generate a random string of specified length
 */
function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Validate URL based on template constraints
 */
function validateUrl(url: string, constraints: UrlConstraints = {}): ValidationResult {
  if (!url) {
    return 'URL is required';
  }

  try {
    const urlObj = new URL(url);

    // Check protocol constraints
    if (constraints.protocol) {
      const allowedProtocols = constraints.protocol.split(',').map((p) => p.trim() + ':');
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return `Protocol must be one of: ${constraints.protocol}`;
      }
    }

    // Check hostname constraints
    if (constraints.hostname) {
      const allowedHosts = constraints.hostname.split(',').map((h) => h.trim());
      if (!allowedHosts.includes(urlObj.hostname)) {
        return `Hostname must be one of: ${constraints.hostname}`;
      }
    }

    // Check port constraints
    if (constraints.port && urlObj.port && constraints.port !== urlObj.port) {
      return `Port must be: ${constraints.port}`;
    }

    return true;
  } catch (error) {
    return 'Invalid URL format';
  }
}

/**
 * Validate number based on template constraints
 */
function validateNumber(value: unknown, constraints: NumberConstraints = {}): ValidationResult {
  const num = Number(value);

  if (isNaN(num)) {
    return 'Must be a valid number';
  }

  // Check if the value is in the allowed list (takes precedence over min/max)
  if (constraints.allow) {
    if (constraints.allow.includes(num)) {
      return true;
    }
  }

  // Check min/max constraints
  if (constraints.min !== undefined && num < constraints.min) {
    const allowedText = constraints.allow ? ` or one of: ${constraints.allow.join(', ')}` : '';
    return `Must be at least ${constraints.min}${allowedText}`;
  }

  if (constraints.max !== undefined && num > constraints.max) {
    const allowedText = constraints.allow ? ` or one of: ${constraints.allow.join(', ')}` : '';
    return `Must be at most ${constraints.max}${allowedText}`;
  }

  return true;
}

/**
 * Validate string based on template constraints
 */
function validateString(value: unknown, constraints: StringConstraints = {}): ValidationResult {
  const stringValue = String(value || '');

  if (!stringValue && !constraints.optional) {
    return 'This field is required';
  }

  if (constraints.minLength && stringValue.length < constraints.minLength) {
    return `Must be at least ${constraints.minLength} characters`;
  }

  if (constraints.maxLength && stringValue.length > constraints.maxLength) {
    return `Must be at most ${constraints.maxLength} characters`;
  }

  if (constraints.pattern) {
    const regex = new RegExp(constraints.pattern);
    if (!regex.test(stringValue)) {
      return `Must match pattern: ${constraints.pattern}`;
    }
  }

  return true;
}

/**
 * Validate date based on template constraints
 */
function validateDate(value: unknown, constraints: DateConstraints = {}): ValidationResult {
  const stringValue = String(value || '');

  if (!stringValue && constraints.optional) {
    return true;
  }

  const date = new Date(stringValue);
  if (isNaN(date.getTime())) {
    return 'Invalid date format';
  }

  if (constraints.minDate && date < new Date(constraints.minDate)) {
    return `Date must be after ${constraints.minDate}`;
  }

  if (constraints.maxDate && date > new Date(constraints.maxDate)) {
    return `Date must be before ${constraints.maxDate}`;
  }

  return true;
}

/**
 * Extract port from URL
 */
function extractPortFromUrl(url: string): number | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.port) {
      return parseInt(urlObj.port, 10);
    }
    // Return default ports for protocols
    return urlObj.protocol === 'https:' ? 443 : 80;
  } catch (error) {
    return null;
  }
}

/**
 * Parse template configuration from a template string
 */
function parseTemplate(templateStr: string): TemplateConfig | null {
  debugLog('Parsing template string', templateStr);

  // Extract template configuration: {{type|param1=value1|param2=value2}}
  const match = templateStr.match(/^{{(.+)}}$/);
  if (!match || !match[1]) {
    debugLog('Template string does not match expected format');
    return null;
  }

  const parts = match[1].split('|');
  if (parts.length === 0) {
    return null;
  }

  const type = parts[0]!.trim() as TemplateConfig['type'];
  const config: TemplateConfig & Record<string, unknown> = { type };

  debugLog('Template parts extracted', { type, parts: parts.slice(1) });

  // Parse parameters
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    
    const [key, ...valueParts] = part.split('=');
    const value = valueParts.join('=').trim();
    const trimmedKey = key?.trim();
    
    if (trimmedKey && value !== undefined && value !== '') {
      // Handle special value types
      if (value === 'true') {
        config[trimmedKey] = true;
      } else if (value === 'false') {
        config[trimmedKey] = false;
      } else if (['options', 'labels', 'allow'].includes(trimmedKey)) {
        config[trimmedKey] = value.split(',').map((s) => s.trim());
      } else if (['min', 'max', 'length', 'minLength', 'maxLength'].includes(trimmedKey)) {
        config[trimmedKey] = parseInt(value, 10);
      } else {
        config[trimmedKey] = value;
      }
    }
  }

  debugLog('Template parsed successfully', config);
  return config as TemplateConfig;
}

/**
 * Resolve variables in default values (like $index) and variable references
 */
function resolveVariables(value: unknown, context: TransformContext = {}): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  // First resolve references to other variables using @{varname} syntax
  let resolved = value.replace(/@\{([^}]+)\}/g, (match: string, varName: string): string => {
    if (context.answers && context.answers[varName] !== undefined) {
      return String(context.answers[varName]);
    }
    console.warn(`Warning: Referenced variable "${varName}" not found in context`);
    return match;
  });

  // Then resolve expressions using ${expression} syntax
  resolved = resolved.replace(/\$\{([^}]+)\}/g, (match: string, expression: string): string => {
    try {
      // Create a safe evaluation context
      const evalContext: Record<string, unknown> = {
        ...context,
        Date,
        Math,
        parseInt,
        parseFloat,
      };

      // Replace variables in the expression
      let processedExpression = expression;
      for (const [key, val] of Object.entries(evalContext)) {
        const regex = new RegExp(`\\$${key}\\b`, 'g');
        processedExpression = processedExpression.replace(regex, String(val));
      }

      // Safely evaluate the expression
      return String(Function('"use strict"; return (' + processedExpression + ')')());
    } catch (error) {
      console.warn(
        `Warning: Could not resolve variable expression "${expression}":`,
        error instanceof Error ? error.message : String(error)
      );
      return match; // Keep original if evaluation fails
    }
  });

  return resolved;
}

/**
 * Apply transformers to template configuration
 */
function applyTransformers(template: TemplateConfig, context: TransformContext = {}): TemplateConfig {
  if (!template.transformer) {
    return template;
  }

  const transformedTemplate: TemplateConfig = { ...template };

  switch (template.transformer) {
    case 'extract_port': {
      debugLog(`Applying extract_port transformer`, { from: template.from, hasAnswers: !!context.answers });

      if (template.from && context.answers) {
        let sourceValue: unknown = context.answers[template.from];

        // If not found, try with group prefixes
        if (!sourceValue) {
          for (const [key, value] of Object.entries(context.answers)) {
            if (key.endsWith('_' + template.from) || key === template.from) {
              sourceValue = value;
              debugLog(`Found source value with grouped key: ${key}`);
              break;
            }
          }
        }

        debugLog(`extract_port source resolution`, {
          sourceKey: template.from,
          sourceValue,
          availableKeys: Object.keys(context.answers),
        });

        if (sourceValue) {
          try {
            const url = new URL(String(sourceValue));
            debugLog(`URL parsed successfully`, {
              port: url.port,
              protocol: url.protocol,
              hostname: url.hostname,
            });

            if (url.port) {
              transformedTemplate.default = url.port;
              transformedTemplate.skip = true;
              debugLog(`Port extracted and will skip prompt`, { port: url.port });
            } else {
              const defaultPort = url.protocol === 'https:' ? 443 : 80;
              transformedTemplate.default = defaultPort.toString();
              transformedTemplate.skip = false;
              debugLog(`No explicit port, using protocol default`, {
                protocol: url.protocol,
                defaultPort,
              });
            }
          } catch (error) {
            debugLog(`URL parsing failed`, error instanceof Error ? error.message : String(error));
          }
        } else {
          debugLog(`No source value found for extract_port transformer`);
        }
      }
      break;
    }

    case 'extract_hostname': {
      debugLog(`Applying extract_hostname transformer`, { from: template.from });

      if (template.from && context.answers) {
        let sourceValue: unknown = context.answers[template.from];

        if (!sourceValue) {
          for (const [key, value] of Object.entries(context.answers)) {
            if (key.endsWith('_' + template.from) || key === template.from) {
              sourceValue = value;
              debugLog(`Found source value with grouped key: ${key}`);
              break;
            }
          }
        }

        if (sourceValue) {
          try {
            const url = new URL(String(sourceValue));
            transformedTemplate.default = url.hostname;
            transformedTemplate.skip = template.skip_if_extracted !== false;
            debugLog(`Hostname extracted`, {
              hostname: url.hostname,
              willSkip: transformedTemplate.skip,
            });
          } catch (error) {
            debugLog(
              `URL parsing failed for hostname extraction`,
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      }
      break;
    }

    case 'extract_protocol': {
      debugLog(`Applying extract_protocol transformer`, { from: template.from });

      if (template.from && context.answers) {
        let sourceValue: unknown = context.answers[template.from];

        if (!sourceValue) {
          for (const [key, value] of Object.entries(context.answers)) {
            if (key.endsWith('_' + template.from) || key === template.from) {
              sourceValue = value;
              debugLog(`Found source value with grouped key: ${key}`);
              break;
            }
          }
        }

        if (sourceValue) {
          try {
            const url = new URL(String(sourceValue));
            transformedTemplate.default = url.protocol.replace(':', '');
            transformedTemplate.skip = template.skip_if_extracted !== false;
            debugLog(`Protocol extracted`, {
              protocol: url.protocol,
              cleaned: transformedTemplate.default,
              willSkip: transformedTemplate.skip,
            });
          } catch (error) {
            debugLog(
              `URL parsing failed for protocol extraction`,
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      }
      break;
    }

    case 'derive_url': {
      if (
        template.base_url &&
        template.port_from &&
        context.answers &&
        context.answers[template.base_url] &&
        context.answers[template.port_from]
      ) {
        try {
          const url = new URL(String(context.answers[template.base_url]));
          url.port = String(context.answers[template.port_from]);
          transformedTemplate.default = url.toString();
          transformedTemplate.skip = template.skip_if_derived !== false;
        } catch (error) {
          // Keep original template if URL construction fails
        }
      }
      break;
    }

    case 'reference': {
      if (template.from && context.answers && context.answers[template.from]) {
        const refValue = context.answers[template.from];
        if (refValue !== undefined && refValue !== null) {
          transformedTemplate.default = refValue as string | number | boolean | undefined;
          transformedTemplate.skip = template.skip_if_referenced !== false;
        }
      }
      break;
    }

    case 'cors_origins': {
      if (context.answers) {
        let urlKeys = template.from_urls || ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_APP_URL'];
        if (typeof urlKeys === 'string') {
          urlKeys = urlKeys.split(',').map((key) => key.trim());
        }

        const dynamicOptions: PromptChoice[] = [];

        urlKeys.forEach((urlKey: string) => {
          let sourceValue: unknown = context.answers![urlKey];

          if (!sourceValue) {
            for (const [key, value] of Object.entries(context.answers!)) {
              if (key.endsWith('_' + urlKey) || key === urlKey) {
                sourceValue = value;
                break;
              }
            }
          }

          if (sourceValue) {
            try {
              const url = new URL(String(sourceValue));
              const origin = `${url.protocol}//${url.hostname}${
                url.port && !['80', '443'].includes(url.port) ? ':' + url.port : ''
              }`;

              let label: string;
              if (urlKey.includes('API')) {
                label = 'API URL';
              } else if (urlKey.includes('APP') || urlKey.includes('WEB')) {
                label = 'Web App URL';
              } else {
                label = urlKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
              }

              dynamicOptions.push({
                title: `(${label}) => ${origin}`,
                value: origin,
              });
            } catch (error) {
              // Skip invalid URLs
            }
          }
        });

        const staticOptions: PromptChoice[] = (template.options || []).map((option) => ({
          title: option,
          value: option,
        }));

        transformedTemplate.options = [
          ...dynamicOptions.map((opt) => opt.title),
          ...staticOptions.map((opt) => opt.title as string),
        ];
      }
      break;
    }
  }

  return transformedTemplate;
}

/**
 * Process multiselect values
 */
function processValue(value: unknown, template: TemplateConfig): unknown {
  if (template.type === 'multiselect' && Array.isArray(value)) {
    return value.join(template.separator || ',');
  }

  if (template.type === 'boolean') {
    return value ? 'true' : 'false';
  }

  return value;
}

/**
 * Parse .env.template file using proper dotenv parser
 */
function parseEnvTemplate(templatePath: string): Record<string, TemplateConfig> {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  const result = dotenv.config({ path: templatePath });
  if (result.error) {
    throw new Error(`Error parsing template file: ${result.error.message}`);
  }

  const templates: Record<string, TemplateConfig> = {};
  const parsedEnv = result.parsed || {};

  for (const [key, value] of Object.entries(parsedEnv)) {
    const template = parseTemplate(value);
    if (template) {
      templates[key] = template;
    }
  }

  return templates;
}

/**
 * Group environment variables by splitting on underscores
 */
function groupEnvironmentVariables(templates: Record<string, TemplateConfig>): GroupedTemplates {
  debugLog('Starting environment variable grouping', { variableCount: Object.keys(templates).length });

  // Check if we have explicit group configuration
  const systemConfig = templates['SYSTEM_ENV_TEMPLATE_CONFIG'];
  let explicitGroups: Array<{ id: string; name: string; description?: string }> | null = null;

  if (systemConfig && systemConfig.default) {
    debugLog('Found SYSTEM_ENV_TEMPLATE_CONFIG', systemConfig.default);
    try {
      const config = JSON.parse(String(systemConfig.default));
      explicitGroups = config.groups;
      debugLog('Parsed explicit groups configuration', explicitGroups);
    } catch (error) {
      debugLog(
        'Failed to parse SYSTEM_ENV_TEMPLATE_CONFIG JSON',
        error instanceof Error ? error.message : String(error)
      );
      console.log(
        `${colors.yellow}⚠️  Warning: Invalid SYSTEM_ENV_TEMPLATE_CONFIG JSON, falling back to auto-grouping${colors.reset}`
      );
    }
  }

  if (explicitGroups && Array.isArray(explicitGroups)) {
    debugLog('Using explicit groups configuration');
    return groupByExplicitConfig(templates, explicitGroups);
  } else {
    debugLog('Using auto-detection grouping');
    return groupByAutoDetection(templates);
  }
}

/**
 * Group variables using explicit group configuration
 */
function groupByExplicitConfig(
  templates: Record<string, TemplateConfig>,
  groupsConfig: Array<{ id: string; name: string; description?: string }>
): GroupedTemplates {
  debugLog('Grouping by explicit configuration', { groupCount: groupsConfig.length });

  const result: GroupedTemplates = {};
  const usedVariables = new Set<string>();

  groupsConfig.forEach((groupDef) => {
    const groupKey = groupDef.id;
    const groupVariables: Record<string, TemplateConfig> = {};

    debugLog(`Processing group: ${groupKey}`, groupDef);

    Object.keys(templates).forEach((varName) => {
      const template = templates[varName];
      if (template && template.group === groupKey) {
        debugLog(`Variable ${varName} assigned to group ${groupKey}`);
        groupVariables[varName] = template;
        usedVariables.add(varName);
      }
    });

    if (Object.keys(groupVariables).length > 0) {
      debugLog(`Created group ${groupKey} with ${Object.keys(groupVariables).length} variables`);
      result[groupKey] = {
        ...groupVariables,
        _groupInfo: {
          id: groupDef.id,
          name: groupDef.name,
          description: groupDef.description,
        },
      };
    } else {
      debugLog(`Group ${groupKey} has no variables, skipping`);
    }
  });

  const ungroupedCount = Object.keys(templates).length - usedVariables.size;
  debugLog(`Adding ${ungroupedCount} ungrouped variables to root level`);

  Object.keys(templates).forEach((varName) => {
    if (!usedVariables.has(varName)) {
      const template = templates[varName];
      if (template) {
        debugLog(`Variable ${varName} added to root level (ungrouped)`);
        result[varName] = template;
      }
    }
  });

  debugLog('Explicit grouping completed', {
    totalGroups: Object.keys(result).filter((k) => {
      const item = result[k];
      return item && typeof item === 'object' && '_groupInfo' in item && item._groupInfo;
    }).length,
    ungroupedVariables: ungroupedCount,
  });

  return result;
}

/**
 * Group variables using auto-detection (fallback behavior)
 */
function groupByAutoDetection(templates: Record<string, TemplateConfig>): GroupedTemplates {
  const grouped: GroupedTemplates = {};
  const variables = Object.keys(templates);

  // First, create a mapping of all possible groupings
  const groupings = new Map<string, Set<string>>();

  variables.forEach((varName) => {
    const parts = varName.split('_');

    for (let depth = 1; depth <= Math.min(3, parts.length - 1); depth++) {
      const prefix = parts.slice(0, depth).join('_');
      const suffix = parts.slice(depth).join('_');

      if (!groupings.has(prefix)) {
        groupings.set(prefix, new Set());
      }
      groupings.get(prefix)!.add(varName);
    }
  });

  // Find the best groupings (groups with multiple variables)
  const usedVariables = new Set<string>();
  const groups: Array<{ prefix: string; variables: string[] }> = [];

  const sortedPrefixes = Array.from(groupings.keys()).sort((a, b) => {
    const aCount = groupings.get(a)!.size;
    const bCount = groupings.get(b)!.size;
    if (aCount !== bCount) {
      return bCount - aCount;
    }
    return b.length - a.length;
  });

  for (const prefix of sortedPrefixes) {
    const vars = Array.from(groupings.get(prefix)!);

    if (vars.length > 1 && vars.some((v) => !usedVariables.has(v))) {
      const availableVars = vars.filter((v) => !usedVariables.has(v));
      if (availableVars.length > 1) {
        groups.push({ prefix, variables: availableVars });
        availableVars.forEach((v) => usedVariables.add(v));
      }
    }
  }

  // Build the grouped structure
  const result: GroupedTemplates = {};

  groups.forEach(({ prefix, variables: vars }) => {
    const prefixParts = prefix.split('_');
    let current: any = result;

    prefixParts.forEach((part, index) => {
      if (index === prefixParts.length - 1) {
        if (!current[part]) {
          current[part] = {};
        }
        vars.forEach((varName) => {
          const suffix = varName.substring(prefix.length + 1);
          current[part][suffix] = templates[varName];
        });
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    });
  });

  // Add ungrouped variables at root level
  variables.forEach((varName) => {
    if (!usedVariables.has(varName)) {
      const template = templates[varName];
      if (template) {
        result[varName] = template;
      }
    }
  });

  return result;
}

/**
 * Flatten grouped variables back to flat structure for prompts
 */
function flattenGroupedVariables(
  grouped: GroupedTemplates,
  prefix: string = ''
): Record<string, TemplateConfig> {
  const flattened: Record<string, TemplateConfig> = {};

  for (const [key, value] of Object.entries(grouped)) {
    if (key === '_groupInfo') {
      continue;
    }

    if (value && typeof value === 'object' && !('type' in value)) {
      const nestedFlattened = flattenGroupedVariables(
        value as GroupedTemplates,
        prefix ? `${prefix}_${key}` : key
      );
      Object.assign(flattened, nestedFlattened);
    } else {
      const fullKey = prefix ? `${prefix}_${key}` : key;
      flattened[fullKey] = value as TemplateConfig;
    }
  }

  return flattened;
}

/**
 * Convert template config to prompts config
 */
function createPromptConfig(
  key: string,
  template: TemplateConfig,
  context: TransformContext = {}
): PromptObject | null {
  const transformedTemplate = applyTransformers(template, context);

  if (transformedTemplate.skip) {
    return null;
  }

  const baseConfig: Partial<PromptObject> = {
    name: key,
    message: transformedTemplate.label || key.replace(/_/g, ' ').toLowerCase(),
  };

  if (transformedTemplate.description) {
    baseConfig.message =
      `${baseConfig.message}\n${colors.dim}${transformedTemplate.description}${colors.reset}`;
  }

  const resolvedDefault = transformedTemplate.default
    ? resolveVariables(transformedTemplate.default, context)
    : undefined;

  switch (transformedTemplate.type) {
    case 'string':
      return {
        ...baseConfig,
        type: transformedTemplate.secure ? 'password' : 'text',
        initial:
          transformedTemplate.generate === 'random'
            ? generateRandomString(transformedTemplate.length || 32)
            : String(resolvedDefault || ''),
        validate: (value: unknown) => validateString(value, transformedTemplate),
      } as PromptObject;

    case 'number':
      return {
        ...baseConfig,
        type: 'number',
        initial: resolvedDefault !== undefined ? Number(resolvedDefault) : 0,
        validate: (value: unknown) => validateNumber(value, transformedTemplate),
      } as PromptObject;

    case 'boolean': {
      const labels = transformedTemplate.labels || ['true', 'false'];
      return {
        ...baseConfig,
        type: 'select',
        choices: [
          { title: labels[0], value: true },
          { title: labels[1], value: false },
        ],
        initial: resolvedDefault === labels[0] ? 0 : 1,
      } as PromptObject;
    }

    case 'select':
      return {
        ...baseConfig,
        type: 'select',
        choices: (transformedTemplate.options || []).map((option: string) => ({
          title: option,
          value: option,
        })),
        initial: transformedTemplate.options
          ? transformedTemplate.options.indexOf(String(resolvedDefault))
          : 0,
      } as PromptObject;

    case 'multiselect': {
      const choices: PromptChoice[] = (transformedTemplate.options || []).map((option: string) => ({
        title: option,
        value: option,
        selected: false,
      }));

      return {
        ...baseConfig,
        type: 'multiselect',
        choices,
        hint: `Use space to select, return to submit. Will be joined with '${
          transformedTemplate.separator || ','
        }'`,
      } as PromptObject;
    }

    case 'url':
      return {
        ...baseConfig,
        type: 'text',
        initial: String(resolvedDefault || 'http://localhost:3000'),
        validate: (value: unknown) => validateUrl(String(value), transformedTemplate),
      } as PromptObject;

    case 'date':
      return {
        ...baseConfig,
        type: 'text',
        initial: String(resolvedDefault || new Date().toISOString().split('T')[0]),
        validate: (value: unknown) => validateDate(value, transformedTemplate),
      } as PromptObject;

    case 'json':
      return {
        ...baseConfig,
        type: 'text',
        initial: String(resolvedDefault || '{}'),
        validate: (value: unknown) => {
          try {
            JSON.parse(String(value));
            return true;
          } catch (error) {
            return 'Please enter valid JSON';
          }
        },
      } as PromptObject;

    default:
      return {
        ...baseConfig,
        type: 'text',
        initial: String(resolvedDefault || ''),
      } as PromptObject;
  }
}

/**
 * Build environment file sections from grouped templates
 */
function buildEnvSections(
  grouped: GroupedTemplates,
  answers: Record<string, unknown>,
  templateMap: Record<string, TemplateConfig>,
  prefix: string = '',
  depth: number = 0
): string[] {
  const sections: string[] = [];

  for (const [key, value] of Object.entries(grouped)) {
    if (key === '_groupInfo') {
      continue;
    }

    if (value && typeof value === 'object' && !('type' in value)) {
      const sectionName = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const indent = '  '.repeat(depth);
      sections.push(`${indent}# ${sectionName} Configuration`);

      const nestedSections = buildEnvSections(
        value as GroupedTemplates,
        answers,
        templateMap,
        prefix ? `${prefix}_${key}` : key,
        depth + 1
      );
      sections.push(...nestedSections);
      sections.push('');
    } else {
      const fullKey = prefix ? `${prefix}_${key}` : key;
      if (answers.hasOwnProperty(fullKey)) {
        const template = templateMap[fullKey];

        if (!template) {
          continue;
        }

        if (template.skip_export === true || template.skip_export === 'true') {
          continue;
        }

        const processedValue = processValue(answers[fullKey], template);
        sections.push(`${fullKey}=${processedValue}`);
      }
    }
  }

  return sections;
}

/**
 * Main initialization function
 */
async function init(): Promise<void> {
  debugLog('Starting initialization process');

  if (DEBUG_MODE) {
    console.log(`${colors.bright}${colors.yellow}🔧 DEBUG MODE ENABLED${colors.reset}`);
    console.log(`${colors.dim}Use INIT_DEBUG=true or --debug to enable debug output${colors.reset}\n`);
  }

  console.log(`${colors.bgBlue}${colors.white} 🚀 NextJS Turborepo Initialization ${colors.reset}\n`);

  const templatePath = '.env.template';
  const envPath = '.env';

  // Check if already initialized
  if (fs.existsSync(envPath)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `${colors.yellow}⚠️  .env file already exists. Overwrite?${colors.reset}`,
      initial: false,
    });

    if (!overwrite) {
      console.log(`${colors.green}✅ Initialization cancelled${colors.reset}`);
      return;
    }
  }

  try {
    console.log(`${colors.cyan}📋 Parsing configuration template...${colors.reset}`);
    const templates = parseEnvTemplate(templatePath);
    debugLog('Template parsing completed', { templateCount: Object.keys(templates).length });

    if (Object.keys(templates).length === 0) {
      throw new Error('No valid templates found in .env.template');
    }

    console.log(`${colors.cyan}🔄 Grouping environment variables...${colors.reset}`);
    const groupedTemplates = groupEnvironmentVariables(templates);
    debugLog('Variable grouping completed');

    console.log(`${colors.green}✅ Found ${Object.keys(templates).length} configuration options${colors.reset}`);

    if (DEBUG_MODE) {
      console.log(`${colors.blue}📊 Grouped structure:${colors.reset}`);
      console.log(JSON.stringify(groupedTemplates, null, 2));
    }
    console.log('');

    const flatTemplates = flattenGroupedVariables(groupedTemplates);
    debugLog('Templates flattened for prompting', { flatCount: Object.keys(flatTemplates).length });

    const answers: Record<string, unknown> = {};
    const templateMap: Record<string, TemplateConfig> = {};
    let index = 0;
    let currentGroup: string | null = null;

    debugLog('Building group lookup for explicit groups');
    const groupLookup = new Map<string, GroupInfo>();
    Object.keys(groupedTemplates).forEach((groupKey) => {
      const group = groupedTemplates[groupKey] as any;
      if (group && group._groupInfo) {
        debugLog(`Group ${groupKey} has explicit info`, group._groupInfo);
        Object.keys(group).forEach((varKey) => {
          if (varKey !== '_groupInfo') {
            groupLookup.set(varKey, group._groupInfo);
            debugLog(`Mapped variable ${varKey} to group ${groupKey}`);
          }
        });
      }
    });

    debugLog('Starting prompt processing loop', { totalVariables: Object.keys(flatTemplates).length });

    for (const [key, template] of Object.entries(flatTemplates)) {
      debugLog(`Processing variable: ${key}`, {
        type: template.type,
        group: template.group,
        optional: template.optional,
      });

      if (!template.optional || template.required !== false) {
        templateMap[key] = template;

        let groupName: string | null = null;
        let groupDisplayName: string | null = null;
        let groupDescription: string | undefined = undefined;

        if (groupLookup.has(key)) {
          const groupInfo = groupLookup.get(key)!;
          groupName = groupInfo.id;
          groupDisplayName = groupInfo.name;
          groupDescription = groupInfo.description;
        } else {
          const keyParts = key.split('_');
          if (keyParts.length > 1 && keyParts[0]) {
            if (keyParts[0] === 'NEXT' && keyParts[1] === 'PUBLIC') {
              groupName = 'NEXT_PUBLIC';
              groupDisplayName = 'NEXT PUBLIC';
            } else {
              groupName = keyParts[0] ?? null;
              if (groupName) {
                groupDisplayName = groupName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
              }
            }
          }
        }

        if (groupName && currentGroup !== groupName) {
          currentGroup = groupName;
          console.log(`\n${colors.bright}${colors.blue}📦 ${groupDisplayName} Configuration${colors.reset}`);
          if (groupDescription) {
            console.log(`${colors.dim}${groupDescription}${colors.reset}`);
          }
          console.log(`${colors.dim}${'─'.repeat(40)}${colors.reset}\n`);
        }

        const context: TransformContext = {
          index: index++,
          total: Object.keys(flatTemplates).length,
          key,
          answers,
        };

        if (template.skip_export === true || template.skip_export === 'true') {
          if (template.default !== undefined) {
            const resolvedDefault = resolveVariables(template.default, context);
            answers[key] = processValue(resolvedDefault, template);
            console.log(
              `${colors.green}✓ ${colors.dim}${key}: (system configuration - not exported)${colors.reset}`
            );
          }
          continue;
        }

        const promptConfig = createPromptConfig(key, template, context);

        if (promptConfig === null) {
          const transformedTemplate = applyTransformers(template, context);
          if (transformedTemplate.default !== undefined) {
            const resolvedDefault = resolveVariables(transformedTemplate.default, context);
            answers[key] = processValue(resolvedDefault, transformedTemplate);

            if (template.from) {
              console.log(
                `${colors.green}✓ ${colors.dim}${key}: ${answers[key]} (auto-derived from ${template.from} using ${colors.reset}${colors.magenta}${transformedTemplate.transformer}${colors.reset}${colors.green})${colors.reset}`
              );
            } else {
              console.log(
                `${colors.green}✓ ${colors.dim}${key}: ${answers[key]} (auto-derived using ${colors.reset}${colors.magenta}${transformedTemplate.transformer}${colors.reset}${colors.green})${colors.reset}`
              );
            }
          }
          continue;
        }

        const transformedTemplate = applyTransformers(template, context);
        if (transformedTemplate.transformer && transformedTemplate.default && !transformedTemplate.skip) {
          if (transformedTemplate.transformer === 'extract_port') {
            console.log(
              `${colors.cyan}💡 ${colors.dim}Default port suggested for ${key} (no explicit port in ${template.from})${colors.reset}`
            );
          } else {
            console.log(
              `${colors.cyan}💡 ${colors.dim}Auto-suggested value for ${key} based on ${
                template.from || 'previous input'
              }${colors.reset}`
            );
          }
        }

        const result = await prompts(promptConfig, {
          onCancel: () => {
            console.log(`\n${colors.red}❌ Initialization cancelled${colors.reset}`);
            process.exit(1);
          },
        });

        if (result[key] !== undefined) {
          answers[key] = result[key];
        }
      }
    }

    let envContent = `# Generated by NextJS Turborepo Init\n# Generated on: ${new Date().toISOString()}\n\n`;

    const envSections = buildEnvSections(groupedTemplates, answers, templateMap);
    envContent += envSections.join('\n');

    fs.writeFileSync(envPath, envContent);

    console.log(`\n${colors.bgGreen}${colors.white} ✅ Configuration completed successfully! ${colors.reset}\n`);
    console.log(`${colors.green}📄 Created .env file with your configuration${colors.reset}`);
    console.log(`${colors.cyan}🔧 You can now run: bun run dev${colors.reset}\n`);

    console.log(`${colors.bright}${colors.blue}📋 Next Steps:${colors.reset}`);
    console.log(`${colors.dim}1. Review the generated .env file${colors.reset}`);
    console.log(`${colors.dim}2. Start development: bun run dev${colors.reset}`);
    console.log(
      `${colors.dim}3. Access your apps:${colors.reset}`
    );
    console.log(
      `${colors.dim}   • API: ${answers.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${colors.reset}`
    );
    console.log(
      `${colors.dim}   • Web: ${answers.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${colors.reset}\n`
    );
  } catch (error) {
    console.error(
      `${colors.red}❌ Error during initialization:${colors.reset}`,
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}⚠️  Initialization interrupted${colors.reset}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}⚠️  Initialization terminated${colors.reset}`);
  process.exit(1);
});

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`${colors.bright}NextJS Turborepo Initialization${colors.reset}`);
  console.log('');
  console.log('Usage: bun scripts/init.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --debug      Enable debug output');
  console.log('  --help, -h   Show this help message');
  console.log('');
  console.log('Environment Variables:');
  console.log('  INIT_DEBUG=true  Enable debug output');
  process.exit(0);
}

// Run initialization
init().catch((error) => {
  console.error(
    `${colors.red}❌ Fatal error:${colors.reset}`,
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});

export {
  init,
  parseTemplate,
  validateUrl,
  validateNumber,
  generateRandomString,
  applyTransformers,
  extractPortFromUrl,
};
