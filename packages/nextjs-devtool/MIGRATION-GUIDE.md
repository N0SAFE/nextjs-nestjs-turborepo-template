# DevTool UI Migration Guide

## Overview

The DevTool has been updated with a new dual-mode interface that provides both a reduced bar mode and expanded sidebar mode. This guide helps you migrate from the old floating panel interface to the new container-based system.

## 🔄 Quick Migration

### Before (Old UI)
```tsx
import { DevToolProvider, DevToolPanel } from '@repo/nextjs-devtool'

function App() {
  return (
    <DevToolProvider autoStart>
      <YourAppContent />
      <DevToolPanel />
    </DevToolProvider>
  )
}
```

### After (New UI)
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

## 🎯 Key Changes

### Component Replacements

| Old Component | New Component | Notes |
|---------------|---------------|-------|
| `DevToolPanel` | `DevToolContainer` | Main UI with reduced/expanded modes |
| `DevToolFloatingButton` | `DevToolContainer` | Integrated into container system |

### New Features in DevToolContainer

1. **Dual Mode Interface**
   - **Reduced Mode**: Compact bar positionable on any screen edge
   - **Expanded Mode**: Full sidebar interface at bottom center

2. **Keyboard Shortcuts**
   - `Ctrl+Shift+D` - Toggle DevTools on/off
   - `Ctrl+E` - Expand from reduced to sidebar mode
   - `Escape` - Close DevTools completely

3. **Flexible Positioning**
   - Reduced bar can be positioned on top, bottom, left, or right
   - Smart positioning that doesn't interfere with content

4. **Enhanced Plugin Management**
   - Visual plugin status indicators
   - Easy activation/deactivation
   - Categorized plugin lists

## 📝 Custom Plugin Migration

### Before
```tsx
// Old plugin structure (minimal)
const myPlugin: ModulePlugin = {
  kind: 'module',
  name: 'my.plugin',
  version: '1.0.0',
  // ... minimal structure
}

<DevToolPanel plugins={[myPlugin]} />
```

### After
```tsx
// New plugin structure (with contract and exports)
const myContract: PluginContract = {
  namespace: 'my.plugin',
  procedures: {},
}

const myPlugin: ModulePlugin<typeof myContract> = {
  kind: 'module',
  name: 'my.plugin',
  version: '1.0.0',
  contract: myContract,
  exports: {
    components: {},
  },
  meta: {
    displayName: 'My Plugin',
    description: 'My custom plugin',
    icon: '🔧',
  },
}

<DevToolProvider customPlugins={[myPlugin]}>
  <DevToolContainer />
</DevToolProvider>
```

## 🎨 UI Customization

### Default Configuration
```tsx
<DevToolContainer
  defaultMode="none"        // Start hidden
  defaultPosition={{
    side: 'bottom',
    size: 4,                // 4rem height/width
    offset: { x: 0, y: 0 }
  }}
  enableKeyboardShortcuts={true}
/>
```

### Custom Configuration
```tsx
<DevToolContainer
  defaultMode="normal"      // Start in reduced mode
  defaultPosition={{
    side: 'right',          // Position on right side
    size: 5,                // Larger size
    offset: { x: -10, y: 0 } // Custom offset
  }}
  enableKeyboardShortcuts={false} // Disable shortcuts
/>
```

## 🚀 Advanced Features

### Responsive Design
The new UI automatically adapts to different screen sizes:
- **Desktop**: Full sidebar experience
- **Mobile**: Mobile sheet overlay for expanded mode
- **Tablet**: Touch-optimized interactions

### Accessibility Improvements
- Full keyboard navigation support
- Screen reader compatibility
- ARIA labels and descriptions
- High contrast mode support

### Performance Optimizations
- Lazy loading of plugin components
- Efficient state management
- Minimal re-renders
- Optimized animations

## 🐛 Troubleshooting

### Common Issues

**1. DevTool not appearing after migration**
- Ensure you're using `DevToolContainer` instead of `DevToolPanel`
- Check that `DevToolProvider` has `autoStart={true}` or manually activate plugins

**2. Custom plugins not working**
- Update plugin structure to include `contract` and `exports` fields
- Pass plugins to `DevToolProvider` via `customPlugins` prop, not to the container

**3. Keyboard shortcuts not working**
- Ensure `enableKeyboardShortcuts={true}` is set on DevToolContainer
- Check for conflicts with other keyboard shortcut handlers

**4. TypeScript errors with plugins**
- Update plugin interfaces to match new `ModulePlugin<T>` generic structure
- Ensure `PluginContract` is properly defined for each plugin

### Need Help?

If you encounter issues during migration:
1. Check the console for deprecation warnings and guidance
2. Review the [USAGE.md](./USAGE.md) for detailed examples
3. See [UI-UPDATE.md](./UI-UPDATE.md) for feature overview

## 📅 Deprecation Timeline

- **Current**: Old components are deprecated but still functional
- **Next Version**: Deprecation warnings in console
- **Future Version**: Old components may be removed

We recommend migrating as soon as possible to take advantage of the new features and improvements.

## 🎉 Benefits of Migration

1. **Better UX**: Flexible interface that adapts to your workflow
2. **More Control**: Precise positioning and mode management
3. **Enhanced Accessibility**: Full keyboard navigation and screen reader support
4. **Future-Proof**: Active development and new features
5. **Performance**: Optimized rendering and state management

The new DevTool interface provides a much more flexible and powerful development experience while maintaining backward compatibility during the transition period.
