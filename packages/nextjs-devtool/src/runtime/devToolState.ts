/**
 * DevTool State Store
 * 
 * Zustand store for managing DevTool UI state, preferences, and settings
 * with complete type safety and zero `any` usage.
 */

import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import type {
  DevToolMode,
  DevToolState,
  DevToolPosition,
  DevToolStateTransition,
  DevToolSettings,
  DevToolNotification,
  KeyboardShortcut,
  NotificationType,
} from '@repo/nextjs-devtool/types';

/**
 * DevTool UI state interface
 */
interface DevToolUIState {
  // Core UI state
  readonly mode: DevToolMode;
  readonly position: DevToolPosition;
  readonly isVisible: boolean;
  readonly isUICollapsed: boolean;
  
  // Plugin UI state
  readonly pinnedPlugins: ReadonlySet<string>;
  readonly collapsedSections: ReadonlySet<string>;
  readonly visibleSections: ReadonlySet<string>;
  
  // Notifications
  readonly notifications: readonly DevToolNotification[];
  readonly maxNotifications: number;
  
  // Settings and preferences
  readonly settings: DevToolSettings;
  
  // Transition history
  readonly lastTransition?: DevToolStateTransition;
  readonly transitionHistory: readonly DevToolStateTransition[];
  readonly maxHistorySize: number;
}

/**
 * DevTool UI actions interface
 */
interface DevToolUIActions {
  // Mode management
  setMode(mode: DevToolMode, trigger?: DevToolStateTransition['trigger']): void;
  toggleMode(): void;
  enterExpandedMode(): void;
  enterNormalMode(): void;
  hideDevTool(): void;
  
  // Position and layout
  setPosition(position: Partial<DevToolPosition>): void;
  resetPosition(): void;
  toggleCollapse(): void;
  
  // Plugin management
  pinPlugin(pluginId: string): void;
  unpinPlugin(pluginId: string): void;
  isPinned(pluginId: string): boolean;
  
  // Section management
  toggleSection(sectionId: string): void;
  collapseSection(sectionId: string): void;
  expandSection(sectionId: string): void;
  isCollapsed(sectionId: string): boolean;
  
  // Notifications
  addNotification(notification: Omit<DevToolNotification, 'id' | 'timestamp'>): string;
  removeNotification(notificationId: string): void;
  clearNotifications(): void;
  clearNotificationsByPlugin(pluginId: string): void;
  
  // Settings management
  updateSettings(settings: Partial<DevToolSettings>): void;
  resetSettings(): void;
  getPluginSettings<T extends Record<string, unknown>>(pluginId: string): T;
  setPluginSettings<T extends Record<string, unknown>>(pluginId: string, settings: T): void;
  
  // Keyboard shortcuts
  registerShortcut(shortcut: KeyboardShortcut): void;
  unregisterShortcut(shortcutId: string): void;
  getShortcuts(): readonly KeyboardShortcut[];
  
  // State persistence
  saveState(): void;
  loadState(): void;
  resetState(): void;
  
  // Transition tracking
  getTransitionHistory(): readonly DevToolStateTransition[];
  canTransitionTo(mode: DevToolMode): boolean;
}

/**
 * Combined store interface
 */
type DevToolUIStore = DevToolUIState & DevToolUIActions;

/**
 * Default settings
 */
const defaultSettings: DevToolSettings = {
  theme: 'system',
  keyboardShortcuts: true,
  notifications: true,
  autoCollapse: false,
  persistState: true,
  compactMode: false,
  customShortcuts: {},
  pluginSettings: {},
};

/**
 * Default position
 */
const defaultPosition: DevToolPosition = {
  side: 'right',
  size: 400,
  offset: { x: 0, y: 0 },
};

/**
 * Create DevTool UI store with persistence
 */
export const useDevToolUI = create<DevToolUIStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      mode: 'none',
      position: defaultPosition,
      isVisible: false,
      isUICollapsed: false,
      pinnedPlugins: new Set(),
      collapsedSections: new Set(),
      visibleSections: new Set(['core', 'modules']),
      notifications: [],
      maxNotifications: 10,
      settings: defaultSettings,
      transitionHistory: [],
      maxHistorySize: 20,

      // Mode management
      setMode(mode: DevToolMode, trigger: DevToolStateTransition['trigger'] = 'user_action'): void {
        const currentMode = get().mode;
        
        if (currentMode === mode) {
          return;
        }

        const transition: DevToolStateTransition = {
          from: currentMode,
          to: mode,
          trigger,
          timestamp: Date.now(),
        };

        set((state) => {
          const newHistory = [
            ...state.transitionHistory.slice(-state.maxHistorySize + 1),
            transition,
          ];

          return {
            mode,
            isVisible: mode !== 'none',
            isUICollapsed: mode === 'normal',
            lastTransition: transition,
            transitionHistory: newHistory,
          };
        });
      },

      toggleMode(): void {
        const { mode } = get();
        
        switch (mode) {
          case 'none':
            get().setMode('normal');
            break;
          case 'normal':
            get().setMode('expanded');
            break;
          case 'expanded':
            get().setMode('none');
            break;
          default:
            // TypeScript ensures exhaustive checking
            const _exhaustive: never = mode;
            throw new Error(`Invalid mode: ${_exhaustive}`);
        }
      },

      enterExpandedMode(): void {
        get().setMode('expanded');
      },

      enterNormalMode(): void {
        get().setMode('normal');
      },

      hideDevTool(): void {
        get().setMode('none');
      },

      // Position and layout
      setPosition(position: Partial<DevToolPosition>): void {
        set((state) => ({
          position: { ...state.position, ...position },
        }));
      },

      resetPosition(): void {
        set(() => ({
          position: defaultPosition,
        }));
      },

      toggleCollapse(): void {
        set((state) => ({
          isUICollapsed: !state.isUICollapsed,
        }));
      },

      // Plugin management
      pinPlugin(pluginId: string): void {
        set((state) => ({
          pinnedPlugins: new Set(state.pinnedPlugins).add(pluginId),
        }));
      },

      unpinPlugin(pluginId: string): void {
        set((state) => {
          const newPinned = new Set(state.pinnedPlugins);
          newPinned.delete(pluginId);
          return { pinnedPlugins: newPinned };
        });
      },

      isPinned(pluginId: string): boolean {
        return get().pinnedPlugins.has(pluginId);
      },

      // Section management
      toggleSection(sectionId: string): void {
        const { collapsedSections } = get();
        
        if (collapsedSections.has(sectionId)) {
          get().expandSection(sectionId);
        } else {
          get().collapseSection(sectionId);
        }
      },

      collapseSection(sectionId: string): void {
        set((state) => ({
          collapsedSections: new Set(state.collapsedSections).add(sectionId),
        }));
      },

      expandSection(sectionId: string): void {
        set((state) => {
          const newCollapsed = new Set(state.collapsedSections);
          newCollapsed.delete(sectionId);
          return { collapsedSections: newCollapsed };
        });
      },

      isCollapsed(sectionId: string): boolean {
        return get().collapsedSections.has(sectionId);
      },

      // Notifications
      addNotification(notification: Omit<DevToolNotification, 'id' | 'timestamp'>): string {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullNotification: DevToolNotification = {
          ...notification,
          id,
          timestamp: Date.now(),
        };

        set((state) => {
          // Limit number of notifications
          const newNotifications = [
            fullNotification,
            ...state.notifications.slice(0, state.maxNotifications - 1),
          ];
          
          return { notifications: newNotifications };
        });

        // Auto-dismiss if duration is set
        if (notification.duration) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }

        return id;
      },

      removeNotification(notificationId: string): void {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== notificationId),
        }));
      },

      clearNotifications(): void {
        set(() => ({
          notifications: [],
        }));
      },

      clearNotificationsByPlugin(pluginId: string): void {
        set((state) => ({
          notifications: state.notifications.filter(n => n.pluginId !== pluginId),
        }));
      },

      // Settings management
      updateSettings(settings: Partial<DevToolSettings>): void {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      resetSettings(): void {
        set(() => ({
          settings: defaultSettings,
        }));
      },

      getPluginSettings<T extends Record<string, unknown>>(pluginId: string): T {
        const { settings } = get();
        return (settings.pluginSettings[pluginId] ?? {}) as T;
      },

      setPluginSettings<T extends Record<string, unknown>>(pluginId: string, pluginSettings: T): void {
        set((state) => ({
          settings: {
            ...state.settings,
            pluginSettings: {
              ...state.settings.pluginSettings,
              [pluginId]: pluginSettings,
            },
          },
        }));
      },

      // Keyboard shortcuts
      registerShortcut(shortcut: KeyboardShortcut): void {
        set((state) => ({
          settings: {
            ...state.settings,
            customShortcuts: {
              ...state.settings.customShortcuts,
              [shortcut.key]: shortcut.action,
            },
          },
        }));
      },

      unregisterShortcut(shortcutKey: string): void {
        set((state) => {
          const { [shortcutKey]: removed, ...remaining } = state.settings.customShortcuts;
          return {
            settings: {
              ...state.settings,
              customShortcuts: remaining,
            },
          };
        });
      },

      getShortcuts(): readonly KeyboardShortcut[] {
        const { settings } = get();
        return Object.entries(settings.customShortcuts).map(([key, action]) => ({
          key,
          action,
          modifiers: [], // Default modifiers
          description: `Custom shortcut for ${action}`,
        }));
      },

      // State persistence
      saveState(): void {
        // Persistence is handled by the persist middleware
        // This method is here for manual save triggers
      },

      loadState(): void {
        // Persistence is handled by the persist middleware
        // This method is here for manual load triggers
      },

      resetState(): void {
        set(() => ({
          mode: 'none',
          position: defaultPosition,
          isVisible: false,
          isUICollapsed: false,
          pinnedPlugins: new Set(),
          collapsedSections: new Set(),
          visibleSections: new Set(['core', 'modules']),
          notifications: [],
          settings: defaultSettings,
          transitionHistory: [],
        }));
      },

      // Transition tracking
      getTransitionHistory(): readonly DevToolStateTransition[] {
        return get().transitionHistory;
      },

      canTransitionTo(mode: DevToolMode): boolean {
        const currentMode = get().mode;
        
        // Define valid transitions
        const validTransitions: Record<DevToolMode, DevToolMode[]> = {
          none: ['normal'],
          normal: ['none', 'expanded'],
          expanded: ['normal', 'none'],
        };

        return validTransitions[currentMode]?.includes(mode) ?? false;
      },
    })),
    {
      name: 'devtool-ui-state',
      partialize: (state) => ({
        // Only persist certain parts of the state
        mode: state.mode,
        position: state.position,
        pinnedPlugins: Array.from(state.pinnedPlugins), // Convert Set to Array for JSON
        collapsedSections: Array.from(state.collapsedSections),
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Use Object.assign to modify readonly properties during rehydration
          Object.assign(state, {
            pinnedPlugins: new Set(state.pinnedPlugins as unknown as string[]),
            collapsedSections: new Set(state.collapsedSections as unknown as string[]),
            visibleSections: new Set(['core', 'modules']),
            notifications: [],
            transitionHistory: [],
            isVisible: state.mode !== 'none',
            isUICollapsed: state.mode === 'normal',
          });
        }
      },
    }
  )
);

/**
 * Hook for notification management
 */
export const useNotifications = () => {
  return useDevToolUI((state) => ({
    notifications: state.notifications,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearNotifications: state.clearNotifications,
    clearNotificationsByPlugin: state.clearNotificationsByPlugin,
  }));
};

/**
 * Hook for settings management
 */
export const useDevToolSettings = () => {
  return useDevToolUI((state) => ({
    settings: state.settings,
    updateSettings: state.updateSettings,
    resetSettings: state.resetSettings,
    getPluginSettings: state.getPluginSettings,
    setPluginSettings: state.setPluginSettings,
  }));
};

/**
 * Hook for UI state management
 */
export const useDevToolUIState = () => {
  return useDevToolUI((state) => ({
    mode: state.mode,
    position: state.position,
    isVisible: state.isVisible,
    isCollapsed: state.isUICollapsed,
    setMode: state.setMode,
    toggleMode: state.toggleMode,
    setPosition: state.setPosition,
    toggleCollapse: state.toggleCollapse,
  }));
};

/**
 * Helper function to create typed notifications
 */
export const createNotification = (
  type: NotificationType,
  title: string,
  message: string,
  options?: Partial<Omit<DevToolNotification, 'id' | 'timestamp' | 'type' | 'title' | 'message'>>
): Omit<DevToolNotification, 'id' | 'timestamp'> => ({
  type,
  title,
  message,
  ...options,
});

/**
 * Helper function to create error notifications
 */
export const createErrorNotification = (
  title: string,
  error: Error | string,
  pluginId?: string
): Omit<DevToolNotification, 'id' | 'timestamp'> => {
  const baseNotification = {
    type: 'error' as const,
    title,
    message: typeof error === 'string' ? error : error.message,
    duration: 10000, // 10 seconds for errors
  };

  if (pluginId) {
    return { ...baseNotification, pluginId };
  }

  return baseNotification;
};
