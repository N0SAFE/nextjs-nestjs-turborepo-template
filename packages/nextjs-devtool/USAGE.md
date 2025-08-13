# DevTool New UI - Usage Guide

The DevTool now supports two distinct modes: **Reduced Mode** (compact bar) and **Expanded Mode** (full sidebar). This provides a flexible interface that adapts to different development needs.

## Quick Start

```tsx
import { DevToolProvider, DevToolContainer } from '@repo/nextjs-devtool'

function App() {
  return (
    <DevToolProvider autoStart>
      <YourAppContent />
      
      {/* New DevTool Container with both modes */}
      <DevToolContainer
        defaultMode="none"
        defaultPosition={{
          side: 'bottom',
          size: 4,
          offset: { x: 0, y: 0 }
        }}
        enableKeyboardShortcuts={true}
      />
    </DevToolProvider>
  )
}
```

## UI Modes

### Reduced Mode
- **Compact bar interface** that can be positioned on any side
- **Quick plugin access** with status indicators
- **Positioning options**: top, bottom, left, or right
- **Minimal footprint** for continuous development

### Expanded Mode  
- **Full sidebar interface** with shadcn UI components
- **Bottom center positioning** for maximum content visibility
- **Complete plugin management** with categories
- **Detailed plugin views** and settings

## Features

### Positioning System
The reduced bar can be positioned on any side of the screen:
- **Top**: Full-width bar at the top
- **Bottom**: Full-width bar at the bottom  
- **Left**: Vertical bar on the left side
- **Right**: Vertical bar on the right side

### State Management
- **Persistent state** across sessions
- **Smooth transitions** between modes
- **Context preservation** when switching modes

### Keyboard Shortcuts
- `Ctrl+Shift+D` - Toggle DevTools
- `Ctrl+E` - Expand to sidebar mode (from reduced mode)
- `Escape` - Close DevTools

### Plugin Integration
- **Core plugins** (Routes, Performance, etc.)
- **Module plugins** (Custom extensions)
- **Dynamic loading** for optimal performance
- **Plugin status indicators** in reduced mode

## Components

### DevToolContainer
Main container that manages mode switching and positioning:

```tsx
interface DevToolContainerProps {
  readonly className?: string
  readonly style?: React.CSSProperties
  readonly defaultMode?: DevToolMode // 'none' | 'normal' | 'expanded'
  readonly defaultPosition?: DevToolPosition
  readonly enableKeyboardShortcuts?: boolean
}
```

### DevToolReducedBar
Compact bar interface for quick access:

```tsx
interface DevToolReducedBarProps {
  readonly position: DevToolPosition
  readonly onExpand: () => void
  readonly onClose: () => void
  readonly onPositionChange: (position: Partial<DevToolPosition>) => void
}
```

### DevToolExpandedPanel
Full sidebar interface with plugin management:

```tsx
interface DevToolExpandedPanelProps {
  readonly onCollapse: () => void
  readonly onClose: () => void
}
```

## Position Configuration

```tsx
interface DevToolPosition {
  readonly side: 'left' | 'right' | 'top' | 'bottom'
  readonly size: number // Size in rem
  readonly offset: {
    readonly x: number
    readonly y: number
  }
}
```

## Migration from Old UI

If you're using the old DevToolPanel, you can easily migrate:

### Before
```tsx
import { DevToolProvider, DevToolPanel } from '@repo/nextjs-devtool'

function App() {
  return (
    <DevToolProvider>
      <YourAppContent />
      <DevToolPanel />
    </DevToolProvider>
  )
}
```

### After
```tsx
import { DevToolProvider, DevToolContainer } from '@repo/nextjs-devtool'

function App() {
  return (
    <DevToolProvider>
      <YourAppContent />
      <DevToolContainer />
    </DevToolProvider>
  )
}
```

## Customization

### Custom Trigger Button
```tsx
import { DevToolTrigger } from '@repo/nextjs-devtool'

function CustomButton() {
  const [mode, setMode] = useState('none')
  
  return (
    <DevToolTrigger 
      onToggle={() => setMode('normal')}
      className="custom-devtool-button"
    >
      🔧 Dev Tools
    </DevToolTrigger>
  )
}
```

### Custom Position
```tsx
<DevToolContainer
  defaultPosition={{
    side: 'left',
    size: 6, // Larger bar
    offset: { x: 20, y: 20 } // Custom offset
  }}
/>
```

## Examples

### Basic Integration
```tsx
import { DevToolProvider, DevToolContainer } from '@repo/nextjs-devtool'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DevToolProvider enableInProduction={false}>
          {children}
          <DevToolContainer />
        </DevToolProvider>
      </body>
    </html>
  )
}
```

### Advanced Configuration
```tsx
import { DevToolProvider, DevToolContainer } from '@repo/nextjs-devtool'

export default function DevLayout({ children }) {
  return (
    <DevToolProvider autoStart customPlugins={[myCustomPlugin]}>
      {children}
      <DevToolContainer
        defaultMode="normal"
        defaultPosition={{
          side: 'right',
          size: 5,
          offset: { x: 10, y: 100 }
        }}
        enableKeyboardShortcuts={true}
      />
    </DevToolProvider>
  )
}
```

## Tips

1. **Start with reduced mode** for minimal interference during development
2. **Use expanded mode** when you need detailed plugin interactions
3. **Position the bar** where it won't interfere with your app's UI
4. **Enable keyboard shortcuts** for quick access without mouse interaction
5. **Customize the trigger** to match your app's design language

## Troubleshooting

- Ensure you're using the latest version of `@repo/nextjs-devtool`
- Verify that shadcn UI components are properly installed
- Check that Tailwind CSS is configured correctly
- Make sure the DevToolProvider wraps your entire app
