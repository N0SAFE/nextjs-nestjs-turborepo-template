# DevTool Plugin System Implementation

This document describes the new plugin system implementation for the NextJS DevTool package.

## Overview

The plugin system allows developers to extend the DevTool with custom functionality using a declarative plugin architecture. The system includes:

- **Core Plugins**: Built-in plugins provided by default (bundle analyzer, routes inspector, CLI tools, logs viewer)
- **Custom Plugins**: User-defined plugins for specific application needs
- **Plugin Registry**: Manages plugin registration, enablement, and lifecycle
- **usePlugin Hook**: React hook for registering plugins in components

## Architecture

### Core Components

1. **`usePlugin` Hook**: Registers plugins with auto-enable and cleanup
2. **`DevToolPanel`**: Accepts plugins prop and integrates with core plugins
3. **`PluginRegistry`**: Singleton registry for managing all plugins
4. **Core Plugins**: Default plugins (bundle, routes, cli, logs)

### Plugin Structure

```typescript
interface ModulePlugin {
  kind: 'module';
  name: string;
  version: string;
  namespace?: string;
  meta?: {
    displayName?: string;
    description?: string;
    icon?: string;
    version?: string;
  };
  exports?: {
    components?: Record<string, () => Promise<any>>;
    hooks?: Record<string, () => Promise<any>>;
  };
  dependencies?: string[];
}
```

## Usage

### Basic Usage

```tsx
import { DevToolProvider, DevToolPanel } from '@repo/nextjs-devtool';
import type { ModulePlugin } from '@repo/nextjs-devtool';

// Define custom plugins
const customPlugins: ModulePlugin[] = [
  {
    kind: 'module',
    name: 'app.analytics',
    version: '1.0.0',
    namespace: 'app',
    meta: {
      displayName: 'Analytics Dashboard',
      description: 'View app analytics',
      icon: '📊',
    },
  },
];

// Use in component
export const DevTool = () => {
  return (
    <DevToolProvider autoStart={true}>
      <DevToolPanel plugins={customPlugins} />
    </DevToolProvider>
  );
};
```

### Plugin with Custom Component

```typescript
const analyticsPlugin: ModulePlugin = {
  kind: 'module',
  name: 'app.analytics',
  version: '1.0.0',
  namespace: 'app',
  meta: {
    displayName: 'Analytics Dashboard',
    icon: '📊',
  },
  exports: {
    components: {
      'DevToolPanel': () => import('./AnalyticsDevToolPanel'),
    },
  },
};
```

### Custom DevTool Component

```tsx
// AnalyticsDevToolPanel.tsx
interface AnalyticsDevToolPanelProps {
  isExpanded?: boolean;
}

export default function AnalyticsDevToolPanel({ isExpanded }: AnalyticsDevToolPanelProps) {
  return (
    <div className="p-4">
      <h2>Analytics Dashboard</h2>
      {isExpanded && (
        <div>Expanded analytics view...</div>
      )}
    </div>
  );
}
```

## Core Plugins

The system includes these built-in plugins:

### 1. Bundle Analyzer (`core.bundle`)
- Displays webpack bundle information
- Shows build performance metrics
- Visualizes dependency sizes

### 2. Routes Inspector (`core.routes`) 
- Lists all application routes
- Shows route parameters and types
- Provides route testing capabilities

### 3. CLI Tools (`core.cli`)
- Command execution interface
- Common development commands
- Terminal output display

### 4. Logs Viewer (`core.logs`)
- Real-time log streaming
- Log level filtering
- Search and export functionality

## API Reference

### `usePlugin(plugins, options)`

Registers plugins with the DevTool plugin registry.

**Parameters:**
- `plugins: ModulePlugin[]` - Array of plugins to register
- `options.autoEnable?: boolean` - Auto-enable plugins (default: true)
- `options.override?: boolean` - Override existing plugins (default: false)

**Returns:**
- Plugin registry access functions
- Plugin management utilities

### `<DevToolPanel plugins={pluginsList} />`

Main DevTool UI component.

**Props:**
- `plugins?: ModulePlugin[]` - Custom plugins to register
- `className?: string` - Additional CSS classes

### Plugin Registry

The registry manages plugin lifecycle:

```typescript
// Access registry
const registry = usePluginRegistry();

// Register plugin
registry.register(myPlugin);

// Enable/disable
registry.enable('plugin.name');
registry.disable('plugin.name');

// Get plugins
const enabled = registry.getEnabledPlugins();
```

## Features

### Automatic Plugin Registration
- Core plugins are registered by default
- Custom plugins are registered via usePlugin hook
- Automatic cleanup on component unmount

### Dynamic Component Loading
- Plugin components are lazy-loaded
- Fallback UI for missing components
- Error handling for failed imports

### Plugin Management
- Enable/disable plugins at runtime
- Plugin dependency tracking
- Namespace organization

### UI Integration
- Sidebar plugin listing
- Icon and display name support
- Expanded/normal view modes
- Draggable and resizable panel

## Development

### Adding Core Plugins

1. Create plugin component in `src/core/components/`
2. Define plugin in `src/core/corePlugins.ts`
3. Export component from plugin definition

### Testing Plugins

```typescript
// Test plugin registration
const testPlugin: ModulePlugin = {
  kind: 'module',
  name: 'test.example',
  version: '1.0.0',
  meta: { displayName: 'Test Plugin' },
};

// Use in DevTool
<DevToolPanel plugins={[testPlugin]} />
```

## Migration from Legacy

The new plugin system replaces the previous registry-based approach:

**Before:**
```tsx
// Old approach required manual registry access
const { registry } = useDevTool();
registry.register(plugin);
```

**After:**
```tsx
// New approach uses declarative plugins prop
<DevToolPanel plugins={[plugin1, plugin2]} />
```

## Future Enhancements

- Plugin hot-reloading
- Plugin marketplace/discovery
- Cross-plugin communication
- Plugin configuration persistence
- Advanced dependency resolution
