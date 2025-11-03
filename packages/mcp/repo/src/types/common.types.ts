/**
 * Common types shared across the MCP Repo Manager
 */

export interface BaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorDetails;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PackageJson {
  name: string;
  version: string;
  description?: string;
  private?: boolean;
  type?: 'module' | 'commonjs';
  main?: string;
  types?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[];
  [key: string]: unknown;
}

export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileSystemNode[];
}

export interface RepoStats {
  totalPackages: number;
  totalApps: number;
  totalFiles: number;
  totalLines: number;
  languages: Record<string, number>;
}

export type DependencyType =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies';

export interface OperationResult {
  success: boolean;
  message: string;
  path?: string;
  details?: Record<string, unknown>;
}
