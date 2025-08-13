'use client'

import { DevToolProvider, DevToolContainer } from '@repo/nextjs-devtool'
import type { ModulePlugin, PluginContract } from '@repo/nextjs-devtool'

// Simple contract for analytics plugin
const analyticsContract: PluginContract = {
  namespace: 'web.analytics',
  procedures: {},
}

// Simple contract for user management plugin
const usersContract: PluginContract = {
  namespace: 'web.users',
  procedures: {},
}

// Example custom plugin for the web app
const webAppPlugin: ModulePlugin<typeof analyticsContract> = {
  kind: 'module',
  name: 'web.analytics',
  version: '1.0.0',
  contract: analyticsContract,
  exports: {
    components: {},
  },
  meta: {
    displayName: 'Analytics Dashboard',
    description: 'View web app analytics and performance metrics',
    icon: '📊',
  },
};

// Example user management plugin
const userManagementPlugin: ModulePlugin<typeof usersContract> = {
  kind: 'module',
  name: 'web.users',
  version: '1.0.0',
  contract: usersContract,
  exports: {
    components: {},
  },
  meta: {
    displayName: 'User Management',
    description: 'Manage users and permissions',
    icon: '👥',
  },
};

// List of custom plugins for this web app
const customPlugins: ModulePlugin[] = [
  webAppPlugin,
  userManagementPlugin,
];

export const DevTool = () => {
    return (
        <DevToolProvider autoStart={true} customPlugins={customPlugins}>
            <DevToolContainer />
        </DevToolProvider>
    )
}
