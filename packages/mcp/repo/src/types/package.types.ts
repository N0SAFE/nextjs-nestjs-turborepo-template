/**
 * Package-related type definitions
 */

import type { PackageJson } from './common.types.js';

export interface PackageInfo {
  name: string;
  version: string;
  type: 'app' | 'package';
  category?: string; // e.g., 'configs', 'bin', 'mcp', 'ui', etc.
  path: string;
  description?: string;
  private: boolean;
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
  scripts: string[];
  hasTests: boolean;
  hasTypeScript: boolean;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'dependencies' | 'devDependencies' | 'peerDependencies';
  isWorkspace: boolean;
  resolvedVersion?: string;
}

export interface PackageMetadata {
  packageJson: PackageJson;
  info: PackageInfo;
  dependents: string[]; // Packages that depend on this
  internalDependencies: string[]; // Workspace packages this depends on
  externalDependencies: DependencyInfo[];
}
