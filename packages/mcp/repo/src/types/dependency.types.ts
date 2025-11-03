/**
 * Dependency management type definitions
 */

export interface DependencyUpdate {
  package: string;
  dependency: string;
  currentVersion: string;
  latestVersion: string;
  type: 'major' | 'minor' | 'patch';
}

export interface CircularDependency {
  cycle: string[];
  path: string; // Visual representation like "A -> B -> C -> A"
}

export interface DependencyAnalysis {
  totalDependencies: number;
  totalDevDependencies: number;
  totalPeerDependencies: number;
  internalDependencies: number;
  externalDependencies: number;
  circularDependencies: CircularDependency[];
  unusedDependencies: string[]; // TODO: Implement usage detection
  duplicatedVersions: Record<string, string[]>; // dep name -> versions used
  workspaceProtocolUsage: number; // Count of workspace:* dependencies
}

export interface AddDependencyOptions {
  packageName: string;
  dependencyName: string;
  version?: string;
  type: 'dependencies' | 'devDependencies' | 'peerDependencies';
  workspace?: boolean; // Use workspace:* protocol
}

export interface RemoveDependencyOptions {
  packageName: string;
  dependencyName: string;
  types?: Array<'dependencies' | 'devDependencies' | 'peerDependencies'>;
}

export interface UpdateDependencyOptions {
  packageName: string;
  dependencyName: string;
  version: string;
  type?: 'dependencies' | 'devDependencies' | 'peerDependencies';
}
