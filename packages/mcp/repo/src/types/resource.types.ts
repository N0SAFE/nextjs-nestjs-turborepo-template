/**
 * Resource-related type definitions for MCP resources
 */

import type { RepoStats, FileSystemNode } from './common.types.js';

// Re-export common types that are used in resource responses
export type { FileSystemNode };

/**
 * Repository summary resource
 */
export interface RepoSummary {
  name: string;
  root: string;
  description: string;
  stats: RepoStats;
  structure: {
    apps: string[];
    packages: string[];
  };
  lastUpdated: string;
}

/**
 * AGENTS.md file information
 */
export interface AgentFile {
  path: string;
  scope: 'root' | 'app' | 'package';
  target?: string; // app or package name
  content: string;
  lastModified: string;
}

/**
 * Dependency graph node
 */
export interface GraphNode {
  id: string; // package name
  type: 'app' | 'package';
  path: string; // file path to package
  dependencies: Record<string, string>; // name -> version
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  dependents: string[]; // package names that depend on this
  level: number; // depth in dependency tree
}

/**
 * Complete dependency graph
 */
export interface DependencyGraph {
  nodes: Record<string, GraphNode>;
  edges: Array<{
    from: string;
    to: string;
    type: 'dependencies' | 'devDependencies' | 'peerDependencies';
  }>;
  metadata: {
    totalPackages: number;
    totalDependencies: number;
    internalDependencies: number;
    externalDependencies: number;
  };
}

/**
 * Resource metadata for caching
 */
export interface ResourceMetadata {
  uri: string;
  timestamp: string;
  ttl?: number; // Time to live in seconds
  source: string;
}

/**
 * Generic resource response
 */
export interface ResourceResponse<T> {
  data: T;
  metadata: ResourceMetadata;
}

/**
 * Repository structure tree
 */
export interface RepoStructure {
  root: FileSystemNode;
  summary: {
    totalDirectories: number;
    totalFiles: number;
    depth: number;
  };
}

/**
 * Package scripts information
 */
export interface PackageScripts {
  packageName: string;
  scripts: Array<{
    name: string;
    command: string;
    description?: string;
  }>;
}

/**
 * Package files information
 */
export interface PackageFiles {
  packageName: string;
  structure: FileSystemNode;
  sourceFiles: string[];
  testFiles: string[];
  configFiles: string[];
}
