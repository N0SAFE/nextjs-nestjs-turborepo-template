/**
 * Parser Contracts
 * 
 * Defines parser types, tokens, and parsing results.
 */

import type { ValidationError } from './validation.contract';
import type { Result } from './result.contract';

/**
 * Token types for pipe syntax lexer
 */
export enum TokenType {
  /** Pipe separator | */
  PIPE = 'PIPE',
  
  /** Colon separator : */
  COLON = 'COLON',
  
  /** Comma separator , */
  COMMA = 'COMMA',
  
  /** Dot separator . */
  DOT = 'DOT',
  
  /** Identifier (variable name, parameter name, etc.) */
  IDENTIFIER = 'IDENTIFIER',
  
  /** String literal "..." */
  STRING = 'STRING',
  
  /** Number literal 123 */
  NUMBER = 'NUMBER',
  
  /** Boolean literal true/false */
  BOOLEAN = 'BOOLEAN',
  
  /** JSON value {...} or [...] */
  JSON = 'JSON',
  
  /** End of input */
  EOF = 'EOF'
}

/**
 * Lexical token
 */
export interface Token {
  /** Token type */
  readonly type: TokenType;
  
  /** Token value (raw text) */
  readonly value: string;
  
  /** Start position in source */
  readonly start: number;
  
  /** End position in source */
  readonly end: number;
  
  /** Line number (for error reporting) */
  readonly line: number;
  
  /** Column number (for error reporting) */
  readonly column: number;
}

/**
 * Pipe configuration (parsed result)
 */
export interface PipeConfig {
  /** Validator type (e.g., 'string', 'number') */
  readonly type: string;
  
  /** Parameters (nested properties supported) */
  readonly params: Readonly<Record<string, unknown>>;
  
  /** Whether value is required */
  readonly required?: boolean;
  
  /** Default value */
  readonly default?: string;
}

/**
 * Parse result
 */
export type ParseResult = Result<PipeConfig, ValidationError>;

/**
 * Parser interface
 */
export interface IParser {
  /**
   * Parse pipe syntax string
   * 
   * @param input - Pipe syntax string (e.g., "string|prompt.type:select|required:true")
   * @param sourceLine - Source line number (for error reporting)
   * @returns Parse result (PipeConfig or errors)
   */
  parse(input: string, sourceLine?: number): ParseResult;
}

/**
 * Tokenizer interface
 */
export interface ITokenizer {
  /**
   * Tokenize pipe syntax string
   * 
   * @param input - Pipe syntax string
   * @returns Array of tokens or errors
   */
  tokenize(input: string): Result<Token[], ValidationError[]>;
}

/**
 * AST node types for parser
 */
export type ASTNode =
  | PropertyAccessNode
  | LiteralNode
  | ParameterNode
  | SectionNode;

/**
 * Property access node (e.g., prompt.type)
 */
export interface PropertyAccessNode {
  readonly kind: 'PropertyAccess';
  readonly path: readonly string[];
}

/**
 * Literal value node
 */
export interface LiteralNode {
  readonly kind: 'Literal';
  readonly value: string | number | boolean | object;
}

/**
 * Parameter node (e.g., prompt.type:select)
 */
export interface ParameterNode {
  readonly kind: 'Parameter';
  readonly key: PropertyAccessNode;
  readonly value: LiteralNode;
}

/**
 * Section node (e.g., string|prompt.type:select,prompt.label:"Choose")
 */
export interface SectionNode {
  readonly kind: 'Section';
  readonly type: string;
  readonly parameters: readonly ParameterNode[];
}

/**
 * Parser options
 */
export interface ParserOptions {
  /** Max nesting depth for nested properties */
  readonly maxNestingDepth: number;
  
  /** Max path segment length */
  readonly maxSegmentLength: number;
  
  /** Max JSON value size (in bytes) */
  readonly maxJsonSize: number;
  
  /** Reserved property names (for security) */
  readonly reservedNames: readonly string[];
}

/**
 * Default parser options
 */
export const DEFAULT_PARSER_OPTIONS: ParserOptions = {
  maxNestingDepth: 5,
  maxSegmentLength: 50,
  maxJsonSize: 10 * 1024, // 10KB
  reservedNames: ['__proto__', 'constructor', 'prototype']
};
