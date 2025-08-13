# @repo/nextjs-devtool

A modular Next.js DevTool with dual-mode interface and plugin system for monorepos.

## ✨ Features

### 🎯 New Dual-Mode Interface
- **Reduced Mode**: Compact bar positionable on any screen edge (top/bottom/left/right)
- **Expanded Mode**: Full shadcn sidebar at bottom center with complete plugin management
- **Keyboard Shortcuts**: `Ctrl+Shift+D` (toggle), `Ctrl+E` (expand), `Escape` (close)
- **Smart Positioning**: Adaptive interface that doesn't interfere with content

### 🔧 Core Capabilities
- Core plugins: routes, bundles, CLI, logs, auth
- SSR-safe enhanced API adapter (`useEnhancedDevToolAPI`)
- Server-only plugin metadata/contract exports
- Plugin registry and store (Zustand)
- Extensible panel UI (React, Shadcn)
- Type-safe ORPC integration

## 🚀 Quick Start

```tsx
import { DevToolProvider, DevToolContainer } from '@repo/nextjs-devtool'

function App() {
  return (
    <DevToolProvider autoStart>
      <YourAppContent />
      <DevToolContainer />
    </DevToolProvider>
  )
}
```

### ⌨️ Keyboard Shortcuts
- `Ctrl+Shift+D` - Toggle DevTools on/off
- `Ctrl+E` - Expand from reduced to sidebar mode  
- `Escape` - Close DevTools completely

## 🔄 Migration from Old UI

**⚠️ DevToolPanel and DevToolFloatingButton are deprecated**

### Before
```tsx
import { DevToolProvider, DevToolPanel } from '@repo/nextjs-devtool'

<DevToolProvider autoStart>
  <DevToolPanel />
</DevToolProvider>
```

### After
```tsx
import { DevToolProvider, DevToolContainer } from '@repo/nextjs-devtool'

<DevToolProvider autoStart>
  <DevToolContainer />
</DevToolProvider>
```

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for complete migration instructions.

## 🎨 Customization

```tsx
<DevToolContainer
  defaultMode="normal"        // Start in reduced mode
  defaultPosition={{
    side: 'bottom',           // Position on bottom
    size: 4,                  // Height/width in rem
    offset: { x: 0, y: 0 }    // Position offset
  }}
  enableKeyboardShortcuts={true}
/>
```

## 🔌 Custom Plugins

```tsx
import type { ModulePlugin, PluginContract } from '@repo/nextjs-devtool'

const myContract: PluginContract = {
  namespace: 'my.plugin',
  procedures: {},
}

const myPlugin: ModulePlugin<typeof myContract> = {
  kind: 'module',
  name: 'my.plugin',
  version: '1.0.0',
  contract: myContract,
  exports: { components: {} },
  meta: {
    displayName: 'My Plugin',
    description: 'Custom development tool',
    icon: '🔧',
  },
}

<DevToolProvider customPlugins={[myPlugin]}>
  <DevToolContainer />
</DevToolProvider>
```

## SSR Safety
Use `useEnhancedDevToolAPI` for SSR-safe API access in plugins/components.

## Server Exports
Import server-only plugin metadata/contracts (no React) via the subpath export:

```ts
import { getCoreServerPlugins, devtoolsServerContract } from '@repo/nextjs-devtool/server'
```

## 📚 Documentation

- [Migration Guide](./MIGRATION-GUIDE.md) - Migrate from old UI to new interface
- [Usage Guide](./USAGE.md) - Detailed usage examples and patterns
- [UI Update](./UI-UPDATE.md) - Overview of new features

## Testing
Minimal store/registry tests in `src/core/__tests__`.

---
MIT License.
