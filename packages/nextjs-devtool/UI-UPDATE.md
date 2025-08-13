# DevTool UI Update: Reduced & Expanded Modes

## 🎉 New Features

The DevTool now supports two distinct UI modes to provide a flexible development experience:

### 🔸 Reduced Mode
- **Compact bar interface** that can be positioned on any side of the screen
- **Quick plugin access** with status indicators and tooltips  
- **Flexible positioning**: top, bottom, left, or right
- **Minimal footprint** for continuous development

### 🔸 Expanded Mode  
- **Full sidebar interface** using shadcn UI components
- **Bottom center positioning** for optimal content visibility
- **Complete plugin management** with categorized lists
- **Detailed plugin views** and interactive controls

## 🚀 Quick Start

Replace your existing DevTool usage:

```tsx
// Before
import { DevToolProvider, DevToolPanel } from '@repo/nextjs-devtool'

// After  
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

## ⌨️ Keyboard Shortcuts

- `Ctrl+Shift+D` - Toggle DevTools on/off
- `Ctrl+E` - Expand from reduced to sidebar mode
- `Escape` - Close DevTools completely

## 🎯 Key Improvements

1. **Adaptive Interface**: Choose between minimal bar or full sidebar based on your needs
2. **Smart Positioning**: Reduced bar adapts to screen edges without blocking content
3. **Enhanced UX**: Smooth transitions and consistent state management
4. **Plugin Management**: Easy activation/deactivation with visual feedback
5. **Accessibility**: Full keyboard navigation and screen reader support

## 📱 Responsive Design

- **Desktop**: Full sidebar experience with rich interactions
- **Mobile**: Automatically adapts to mobile sheet overlay
- **Tablet**: Optimized touch targets and spacing

## 🔧 Advanced Configuration

```tsx
<DevToolContainer
  defaultMode="normal" // Start in reduced mode
  defaultPosition={{
    side: 'bottom',
    size: 4, // Height/width in rem
    offset: { x: 0, y: 0 }
  }}
  enableKeyboardShortcuts={true}
/>
```

## 🎨 UI Components

- **DevToolContainer**: Main orchestrator for mode management
- **DevToolReducedBar**: Compact bar with plugin indicators
- **DevToolExpandedPanel**: Full sidebar with plugin navigation
- **DevToolTrigger**: Customizable floating button

## 🔄 Migration Guide

The new UI is backward compatible, but we recommend migrating to the new `DevToolContainer` for the best experience. See [USAGE.md](./USAGE.md) for detailed migration instructions.

## 🎮 Try the Demo

```tsx
import { DevToolDemo } from '@repo/nextjs-devtool'

export default function DemoPage() {
  return <DevToolDemo />
}
```

---

This update maintains all existing functionality while providing a much more flexible and user-friendly interface for development workflows.
