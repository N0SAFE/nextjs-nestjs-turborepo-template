/**
 * DevTool UI and State Type Definitions
 * 
 * Defines types for UI components, state management, and user preferences
 * with strict type safety and no `any` usage.
 */

/**
 * DevTool display modes
 */
export type DevToolMode = 'none' | 'normal' | 'expanded';

/**
 * DevTool position configuration
 */
export interface DevToolPosition {
  readonly side: 'left' | 'right' | 'top' | 'bottom';
  readonly size: number; // pixels
  readonly offset: {
    readonly x: number;
    readonly y: number;
  };
}

/**
 * DevTool state transition metadata
 */
export interface DevToolStateTransition {
  readonly from: DevToolMode;
  readonly to: DevToolMode;
  readonly trigger: 'user_action' | 'api_call' | 'error' | 'initialization';
  readonly metadata?: Record<string, string | number | boolean>;
  readonly timestamp: number;
}

/**
 * Complete DevTool UI state
 */
export interface DevToolState {
  readonly mode: DevToolMode;
  readonly position: DevToolPosition;
  readonly selectedPlugin: string | null;
  readonly selectedPage: string | null;
  readonly pinnedPlugins: ReadonlySet<string>;
  readonly collapsedSections: ReadonlySet<string>;
  readonly lastTransition?: DevToolStateTransition;
}

/**
 * User preferences and settings
 */
export interface DevToolSettings {
  readonly theme: 'light' | 'dark' | 'system';
  readonly keyboardShortcuts: boolean;
  readonly notifications: boolean;
  readonly autoCollapse: boolean;
  readonly persistState: boolean;
  readonly compactMode: boolean;
  readonly customShortcuts: Record<string, string>;
  readonly pluginSettings: Record<string, Record<string, unknown>>;
}

/**
 * Plugin selection state
 */
export interface PluginSelection {
  readonly pluginId: string;
  readonly pageId: string | null;
  readonly timestamp: number;
}

/**
 * DevTool context for providers
 */
export interface DevToolContext {
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly nextJsVersion: string;
  readonly projectRoot: string;
  readonly apiBaseUrl: string;
}

/**
 * Plugin registry state
 */
export interface PluginRegistryState {
  readonly plugins: ReadonlyMap<string, RegisteredPlugin>;
  readonly activePlugins: ReadonlySet<string>;
  readonly loadingPlugins: ReadonlySet<string>;
  readonly failedPlugins: ReadonlyMap<string, PluginError>;
  readonly dependencyGraph: ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * Navigation state for multi-page plugins
 */
export interface NavigationState {
  readonly history: readonly PluginSelection[];
  readonly currentIndex: number;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
}

/**
 * Component render context passed to plugin components
 */
export interface PluginComponentContext {
  readonly pluginId: string;
  readonly pageId?: string;
  readonly isActive: boolean;
  readonly isCollapsed: boolean;
  readonly onClose: () => void;
  readonly onNavigate: (pageId: string) => void;
  readonly settings: Record<string, unknown>;
}

/**
 * Hook context for custom plugin hooks
 */
export interface PluginHookContext {
  readonly pluginId: string;
  readonly isActive: boolean;
  readonly settings: Record<string, unknown>;
  readonly refetch: () => Promise<void>;
}

/**
 * Error boundary state for plugin error handling
 */
export interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error?: Error;
  readonly errorInfo?: {
    readonly componentStack: string;
    readonly errorBoundary?: string;
  };
  readonly pluginId?: string;
  readonly recoverable: boolean;
}

/**
 * Performance metrics for plugin monitoring
 */
export interface PluginMetrics {
  readonly loadTime: number;
  readonly renderTime: number;
  readonly memoryUsage: number;
  readonly apiCalls: number;
  readonly errorCount: number;
  readonly lastActive: number;
}

/**
 * Notification system types
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface DevToolNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly duration?: number; // ms, undefined = no auto-dismiss
  readonly actions?: readonly NotificationAction[];
  readonly timestamp: number;
  readonly pluginId?: string;
}

export interface NotificationAction {
  readonly label: string;
  readonly action: () => void;
  readonly destructive?: boolean;
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  readonly key: string;
  readonly modifiers: readonly ('ctrl' | 'alt' | 'shift' | 'meta')[];
  readonly action: string;
  readonly description: string;
  readonly pluginId?: string;
}

/**
 * Type guards for runtime type checking
 */
export namespace DevToolTypeGuards {
  export function isDevToolMode(value: unknown): value is DevToolMode {
    return typeof value === 'string' && ['none', 'normal', 'expanded'].includes(value);
  }
  
  export function isPluginError(value: unknown): value is PluginError {
    return (
      typeof value === 'object' &&
      value !== null &&
      'code' in value &&
      'message' in value &&
      typeof (value as any).code === 'string' &&
      typeof (value as any).message === 'string'
    );
  }
  
  export function isNotificationType(value: unknown): value is NotificationType {
    return typeof value === 'string' && ['info', 'success', 'warning', 'error'].includes(value);
  }
}

/**
 * Import the plugin types to ensure they're available
 */
import type { PluginError, RegisteredPlugin } from './plugin';

/**
 * Plugin page configuration for routing
 */
export interface PluginPage {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string | React.ReactNode;
  readonly badge?: string | number;
  readonly component: () => Promise<React.ComponentType<{ context: PluginComponentContext }>>;
  readonly children?: readonly PluginPage[];
}

/**
 * Plugin group configuration for organizing pages
 */
export interface PluginGroup {
  readonly id: string;
  readonly label: string;
  readonly pages: readonly PluginPage[];
}

/**
 * Reduced mode configuration for compact display
 */
export interface ReducedModeMenuItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string | React.ReactNode;
  readonly action: () => void;
  readonly disabled?: boolean;
  readonly badge?: string | number;
}

export interface ReducedModeMenuGroup {
  readonly label: string;
  readonly items: readonly ReducedModeMenuItem[];
}

export interface ReducedModeConfig {
  readonly component?: React.ComponentType<{ context: PluginComponentContext }>;
  readonly menu?: {
    readonly groups: readonly ReducedModeMenuGroup[];
  } | {
    readonly items: readonly ReducedModeMenuItem[];
  };
  readonly getData?: () => {
    readonly badge?: string | number;
    readonly status?: 'success' | 'warning' | 'error' | 'info';
    readonly tooltip?: string;
  };
}
