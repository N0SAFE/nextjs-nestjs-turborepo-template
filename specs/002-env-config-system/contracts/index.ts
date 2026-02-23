/**
 * Environment Configuration System - Type Contracts
 * 
 * This module exports all TypeScript interfaces and types for the environment
 * configuration system. These contracts ensure type safety throughout the codebase.
 * 
 * @module contracts
 */

// Plugin contracts
export type {
  PluginMetadata,
  IValidator,
  ITransformer,
  VariableContext,
  PluginError
} from './plugin.contract';

// Result type (error handling)
export type { Result } from './result.contract';
export { ResultOps } from './result.contract';

// Validation contracts
export type {
  ValidationResult,
  ValidationError,
  SourceLocation,
  ValidationOptions
} from './validation.contract';
export { ErrorCode, ValidationHelpers } from './validation.contract';

// Template contracts
export type {
  TemplateMeta,
  ITemplate,
  VariableDefinition,
  ValidatorType,
  PromptConfig,
  PromptType,
  TemplateConstraints
} from './template.contract';
export { DEFAULT_TEMPLATE_CONSTRAINTS } from './template.contract';

// Configuration contracts
export type {
  Configuration,
  PerformanceOptions
} from './config.contract';
export {
  ExecutionMode,
  DEFAULT_CONFIG,
  CI_CONFIG_OVERRIDES,
  ConfigurationBuilder
} from './config.contract';

// Parser contracts
export type {
  Token,
  PipeConfig,
  ParseResult,
  IParser,
  ITokenizer,
  ASTNode,
  PropertyAccessNode,
  LiteralNode,
  ParameterNode,
  SectionNode,
  ParserOptions
} from './parser.contract';
export { TokenType, DEFAULT_PARSER_OPTIONS } from './parser.contract';

// Registry contracts
export type {
  IPluginRegistry,
  PluginList,
  DiscoveryConfig,
  PluginFileMetadata,
  DiscoveryResult
} from './registry.contract';
export { DEFAULT_DISCOVERY_CONFIG } from './registry.contract';
