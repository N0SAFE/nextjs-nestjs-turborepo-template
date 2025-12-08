export type PluginCategory = 'core' | 'feature' | 'infrastructure' | 'ui' | 'integration';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: PluginCategory;
  dependencies: string[];
  optionalDependencies?: string[];
  conflicts?: string[];
  /** Plugin is only available in development mode */
  devOnly?: boolean;
  /** Tags for filtering and grouping */
  tags?: string[];
  /** Documentation URL */
  docsUrl?: string;
  /** Whether this plugin is included by default */
  default?: boolean;
}

export interface PluginConfig {
  [key: string]: string | number | boolean | string[];
}

export interface ProjectConfig {
  projectName: string;
  description: string;
  author: string;
  license: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  template: string;
  features: string[];
  pluginConfigs: Record<string, PluginConfig>;
  apiPort: number;
  webPort: number;
}

export interface Step {
  id: number;
  title: string;
  description: string;
}
