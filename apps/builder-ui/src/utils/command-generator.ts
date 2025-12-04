import type { ProjectConfig } from '../types';

export function generateCommand(config: ProjectConfig): string {
  const parts: string[] = [];

  // Base command
  parts.push(`stratum init ${config.projectName}`);

  // Add features
  if (config.features.length > 0) {
    const features = config.features
      .filter((f) => !['base', 'typescript', 'turborepo'].includes(f))
      .join(' ');
    if (features) {
      parts.push(`--features ${features}`);
    }
  }

  // Package manager
  if (config.packageManager !== 'bun') {
    parts.push(`--package-manager ${config.packageManager}`);
  }

  // Better Auth config
  if (config.features.includes('better-auth') && config.pluginConfigs['better-auth']) {
    const authConfig = config.pluginConfigs['better-auth'];
    if (authConfig.providers) {
      parts.push(`--auth-providers ${(authConfig.providers as string[]).join(',')}`);
    }
    if (authConfig.sessionExpiry) {
      parts.push(`--auth-session-expiry ${authConfig.sessionExpiry}`);
    }
    if (authConfig.enableMFA) {
      parts.push('--auth-mfa');
    }
  }

  // Database config
  if (config.features.includes('database') && config.pluginConfigs['database']) {
    const dbConfig = config.pluginConfigs['database'];
    if (dbConfig.type) {
      parts.push(`--db-type ${dbConfig.type}`);
    }
  }

  // File upload config
  if (config.features.includes('file-upload') && config.pluginConfigs['file-upload']) {
    const uploadConfig = config.pluginConfigs['file-upload'];
    if (uploadConfig.storage) {
      parts.push(`--upload-storage ${uploadConfig.storage}`);
    }
  }

  // Email config
  if (config.features.includes('email') && config.pluginConfigs['email']) {
    const emailConfig = config.pluginConfigs['email'];
    if (emailConfig.provider) {
      parts.push(`--email-provider ${emailConfig.provider}`);
    }
  }

  // API port
  if (config.apiPort !== 3001) {
    parts.push(`--api-port ${config.apiPort}`);
  }

  // Web port
  if (config.webPort !== 3000) {
    parts.push(`--web-port ${config.webPort}`);
  }

  return parts.join(' \\\n  ');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
