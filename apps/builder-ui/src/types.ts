export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'feature' | 'infrastructure' | 'ui' | 'integration';
  dependencies: string[];
  optionalDependencies?: string[];
  conflicts?: string[];
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
