/**
 * Plugin Registry Store
 * 
 * Zustand store for managing plugin registration, activation, and lifecycle
 * with complete type safety and zero `any` usage.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  DevToolPlugin,
  RegisteredPlugin,
  PluginResult,
  PluginError,
  PluginContract,
  PluginLoadingState,
} from '@repo/nextjs-devtool/types';

/**
 * Plugin registry state interface
 */
interface PluginRegistryState {
  // Core state
  readonly plugins: ReadonlyMap<string, RegisteredPlugin>;
  readonly activePlugins: ReadonlySet<string>;
  readonly loadingPlugins: ReadonlySet<string>;
  readonly failedPlugins: ReadonlyMap<string, PluginError>;
  readonly dependencyGraph: ReadonlyMap<string, ReadonlySet<string>>;
  
  // UI navigation state  
  readonly selectedPlugin: string | null;
  readonly selectedPage: string | null;
  readonly navigationHistory: readonly string[];
  readonly currentHistoryIndex: number;
}

/**
 * Plugin registry actions interface
 */
interface PluginRegistryActions {
  // Plugin lifecycle management
  register<T extends PluginContract>(plugin: DevToolPlugin<T>): PluginResult<void>;
  unregister(pluginId: string): PluginResult<void>;
  activate(pluginId: string): Promise<PluginResult<void>>;
  deactivate(pluginId: string): PluginResult<void>;
  
  // Plugin loading
  loadPlugin(pluginId: string, component?: 'server' | 'components' | 'hooks'): Promise<PluginResult<void>>;
  unloadPlugin(pluginId: string): PluginResult<void>;
  
  // Navigation
  selectPlugin(pluginId: string, pageId?: string): void;
  selectPage(pluginId: string, pageId: string): void;
  navigateBack(): boolean;
  navigateForward(): boolean;
  clearNavigation(): void;
  
  // Dependency management
  validateDependencies(pluginId: string): PluginResult<void>;
  buildDependencyGraph(): PluginResult<void>;
  getPluginDependents(pluginId: string): readonly string[];
  
  // State queries
  getPlugin(pluginId: string): RegisteredPlugin | null;
  getActivePlugins(): readonly RegisteredPlugin[];
  getLoadingState(pluginId: string): PluginLoadingState<RegisteredPlugin>;
  isPluginActive(pluginId: string): boolean;
  isPluginLoaded(pluginId: string): boolean;
  hasErrors(pluginId?: string): boolean;
  
  // Bulk operations
  activateMultiple(pluginIds: readonly string[]): Promise<PluginResult<void>>;
  deactivateMultiple(pluginIds: readonly string[]): PluginResult<void>;
  reloadAll(): Promise<PluginResult<void>>;
  
  // State management
  resetState(): void;
  getState(): PluginRegistryState;
}

/**
 * Combined store interface
 */
type PluginRegistryStore = PluginRegistryState & PluginRegistryActions;

/**
 * Create plugin registry store with type safety
 */
export const usePluginRegistry = create<PluginRegistryStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    plugins: new Map(),
    activePlugins: new Set(),
    loadingPlugins: new Set(),
    failedPlugins: new Map(),
    dependencyGraph: new Map(),
    selectedPlugin: null,
    selectedPage: null,
    navigationHistory: [],
    currentHistoryIndex: -1,

    // Plugin lifecycle management
    register<T extends PluginContract>(plugin: DevToolPlugin<T>): PluginResult<void> {
      try {
        const state = get();
        
        // Validate plugin
        if (state.plugins.has(plugin.name)) {
          return {
            success: false,
            error: {
              code: 'PLUGIN_ALREADY_EXISTS',
              message: `Plugin '${plugin.name}' is already registered`,
            },
          };
        }

        // Create registered plugin
        const registeredPlugin: RegisteredPlugin<T> = {
          plugin,
          components: new Map(),
          hooks: new Map(),
          status: 'idle',
        };

        // Update state
        set((state) => ({
          plugins: new Map(state.plugins).set(plugin.name, registeredPlugin),
        }));

        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? (error.stack ?? '') : '',
          },
        };
      }
    },

    unregister(pluginId: string): PluginResult<void> {
      try {
        const state = get();
        
        if (!state.plugins.has(pluginId)) {
          return {
            success: false,
            error: {
              code: 'PLUGIN_NOT_FOUND',
              message: `Plugin '${pluginId}' is not registered`,
            },
          };
        }

        // Check if plugin has dependents
        const dependents = get().getPluginDependents(pluginId);
        if (dependents.length > 0) {
          return {
            success: false,
            error: {
              code: 'HAS_DEPENDENTS',
              message: `Cannot unregister plugin '${pluginId}' - it has dependents: ${dependents.join(', ')}`,
              details: { dependents: dependents.join(',') },
            },
          };
        }

        // Deactivate first if active
        if (state.activePlugins.has(pluginId)) {
          const deactivateResult = get().deactivate(pluginId);
          if (!deactivateResult.success) {
            return deactivateResult;
          }
        }

        // Remove from state
        set((state) => {
          const newPlugins = new Map(state.plugins);
          newPlugins.delete(pluginId);
          
          const newFailedPlugins = new Map(state.failedPlugins);
          newFailedPlugins.delete(pluginId);

          return {
            plugins: newPlugins,
            failedPlugins: newFailedPlugins,
            selectedPlugin: state.selectedPlugin === pluginId ? null : state.selectedPlugin,
          };
        });

        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'UNREGISTRATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    },

    async activate(pluginId: string): Promise<PluginResult<void>> {
      try {
        const state = get();
        const plugin = state.plugins.get(pluginId);
        
        if (!plugin) {
          return {
            success: false,
            error: {
              code: 'PLUGIN_NOT_FOUND',
              message: `Plugin '${pluginId}' is not registered`,
            },
          };
        }

        if (state.activePlugins.has(pluginId)) {
          return { success: true, data: undefined }; // Already active
        }

        // Validate dependencies
        const depResult = get().validateDependencies(pluginId);
        if (!depResult.success) {
          return depResult;
        }

        // Mark as loading
        set((state) => ({
          loadingPlugins: new Set(state.loadingPlugins).add(pluginId),
        }));

        try {
          // Load server component if available
          if (plugin.plugin.exports.server) {
            const loadResult = await get().loadPlugin(pluginId, 'server');
            if (!loadResult.success) {
              return loadResult;
            }
          }

          // Update plugin status and add to active set
          set((state) => {
            const newPlugins = new Map(state.plugins);
            const updatedPlugin = newPlugins.get(pluginId);
            if (updatedPlugin) {
              newPlugins.set(pluginId, {
                ...updatedPlugin,
                status: 'active',
                loadedAt: new Date(),
              });
            }

            const newLoadingPlugins = new Set(state.loadingPlugins);
            newLoadingPlugins.delete(pluginId);

            return {
              plugins: newPlugins,
              activePlugins: new Set(state.activePlugins).add(pluginId),
              loadingPlugins: newLoadingPlugins,
            };
          });

          return { success: true, data: undefined };
        } catch (error) {
          // Mark as failed and remove from loading
          set((state) => {
            const newLoadingPlugins = new Set(state.loadingPlugins);
            newLoadingPlugins.delete(pluginId);

            const pluginError: PluginError = {
              code: 'ACTIVATION_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? (error.stack ?? '') : '',
            };

            return {
              loadingPlugins: newLoadingPlugins,
              failedPlugins: new Map(state.failedPlugins).set(pluginId, pluginError),
            };
          });

          return {
            success: false,
            error: {
              code: 'ACTIVATION_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'ACTIVATION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    },

    deactivate(pluginId: string): PluginResult<void> {
      try {
        const state = get();
        
        if (!state.activePlugins.has(pluginId)) {
          return { success: true, data: undefined }; // Already inactive
        }

        // Check for dependents that are still active
        const dependents = get().getPluginDependents(pluginId);
        const activeDependents = dependents.filter(dep => state.activePlugins.has(dep));
        
        if (activeDependents.length > 0) {
          return {
            success: false,
            error: {
              code: 'HAS_ACTIVE_DEPENDENTS',
              message: `Cannot deactivate plugin '${pluginId}' - it has active dependents: ${activeDependents.join(', ')}`,
              details: { activeDependents: activeDependents.join(',') },
            },
          };
        }

        // Update state
        set((state) => {
          const newActivePlugins = new Set(state.activePlugins);
          newActivePlugins.delete(pluginId);

          const newPlugins = new Map(state.plugins);
          const plugin = newPlugins.get(pluginId);
          if (plugin) {
            newPlugins.set(pluginId, {
              ...plugin,
              status: 'idle',
            });
          }

          return {
            activePlugins: newActivePlugins,
            plugins: newPlugins,
            selectedPlugin: state.selectedPlugin === pluginId ? null : state.selectedPlugin,
          };
        });

        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'DEACTIVATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    },

    async loadPlugin(pluginId: string, component?: 'server' | 'components' | 'hooks'): Promise<PluginResult<void>> {
      try {
        const state = get();
        const plugin = state.plugins.get(pluginId);
        
        if (!plugin) {
          return {
            success: false,
            error: {
              code: 'PLUGIN_NOT_FOUND',
              message: `Plugin '${pluginId}' is not registered`,
            },
          };
        }

        // Mark as loading
        set((state) => ({
          loadingPlugins: new Set(state.loadingPlugins).add(pluginId),
        }));

        try {
          // Load specific component or all available
          if ((!component || component === 'server') && plugin.plugin.exports.server && !plugin.router) {
            const router = await plugin.plugin.exports.server();
            set((state) => {
              const newPlugins = new Map(state.plugins);
              const updatedPlugin = newPlugins.get(pluginId);
              if (updatedPlugin) {
                newPlugins.set(pluginId, {
                  ...updatedPlugin,
                  router,
                });
              }
              return { plugins: newPlugins };
            });
          }

          // Components and hooks are loaded on-demand when actually used
          // This is just validation that they exist

          // Remove from loading
          set((state) => {
            const newLoadingPlugins = new Set(state.loadingPlugins);
            newLoadingPlugins.delete(pluginId);
            return { loadingPlugins: newLoadingPlugins };
          });

          return { success: true, data: undefined };
        } catch (error) {
          set((state) => {
            const newLoadingPlugins = new Set(state.loadingPlugins);
            newLoadingPlugins.delete(pluginId);

            const pluginError: PluginError = {
              code: 'LOAD_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
              ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
            };

            return {
              loadingPlugins: newLoadingPlugins,
              failedPlugins: new Map(state.failedPlugins).set(pluginId, pluginError),
            };
          });

          return {
            success: false,
            error: {
              code: 'LOAD_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'LOAD_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    },

    unloadPlugin(pluginId: string): PluginResult<void> {
      try {
        const state = get();
        
        if (!state.plugins.has(pluginId)) {
          return {
            success: false,
            error: {
              code: 'PLUGIN_NOT_FOUND',
              message: `Plugin '${pluginId}' is not registered`,
            },
          };
        }

        // Deactivate first if active
        if (state.activePlugins.has(pluginId)) {
          const deactivateResult = get().deactivate(pluginId);
          if (!deactivateResult.success) {
            return deactivateResult;
          }
        }

        // Clear loaded components and router
        set((state) => {
          const newPlugins = new Map(state.plugins);
          const plugin = newPlugins.get(pluginId);
          if (plugin) {
            const { router, ...pluginWithoutRouter } = plugin;
            newPlugins.set(pluginId, {
              ...pluginWithoutRouter,
              components: new Map(),
              hooks: new Map(),
              status: 'idle' as const,
            });
          }
          return { plugins: newPlugins };
        });

        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'UNLOAD_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    },

    // Navigation methods
    selectPlugin(pluginId: string, pageId?: string): void {
      const state = get();
      
      if (state.plugins.has(pluginId)) {
        set((state) => ({
          selectedPlugin: pluginId,
          selectedPage: pageId ?? null,
          navigationHistory: [...state.navigationHistory, pluginId],
          currentHistoryIndex: state.navigationHistory.length,
        }));
      }
    },

    selectPage(pluginId: string, pageId: string): void {
      set(() => ({
        selectedPlugin: pluginId,
        selectedPage: pageId,
      }));
    },

    navigateBack(): boolean {
      const state = get();
      if (state.currentHistoryIndex > 0) {
        const newIndex = state.currentHistoryIndex - 1;
        const pluginId = state.navigationHistory[newIndex];
        
        set(() => ({
          selectedPlugin: pluginId ?? null,
          currentHistoryIndex: newIndex,
        }));
        
        return true;
      }
      return false;
    },

    navigateForward(): boolean {
      const state = get();
      if (state.currentHistoryIndex < state.navigationHistory.length - 1) {
        const newIndex = state.currentHistoryIndex + 1;
        const pluginId = state.navigationHistory[newIndex];
        
        set(() => ({
          selectedPlugin: pluginId ?? null,
          currentHistoryIndex: newIndex,
        }));
        
        return true;
      }
      return false;
    },

    clearNavigation(): void {
      set(() => ({
        selectedPlugin: null,
        selectedPage: null,
        navigationHistory: [],
        currentHistoryIndex: -1,
      }));
    },

    // Dependency management
    validateDependencies(pluginId: string): PluginResult<void> {
      const state = get();
      const plugin = state.plugins.get(pluginId);
      
      if (!plugin) {
        return {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin '${pluginId}' is not registered`,
          },
        };
      }

      const dependencies = plugin.plugin.meta?.dependencies ?? [];
      const missingDeps = dependencies.filter(dep => !state.plugins.has(dep));
      
      if (missingDeps.length > 0) {
        return {
          success: false,
          error: {
            code: 'MISSING_DEPENDENCIES',
            message: `Plugin '${pluginId}' has missing dependencies: ${missingDeps.join(', ')}`,
            details: { missingDependencies: missingDeps.join(',') },
          },
        };
      }

      return { success: true, data: undefined };
    },

    buildDependencyGraph(): PluginResult<void> {
      try {
        const state = get();
        const graph = new Map<string, Set<string>>();

        // Build dependency graph
        for (const [pluginId, registeredPlugin] of state.plugins) {
          const dependencies = registeredPlugin.plugin.meta?.dependencies ?? [];
          graph.set(pluginId, new Set(dependencies));
        }

        set(() => ({ dependencyGraph: graph }));
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'GRAPH_BUILD_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    },

    getPluginDependents(pluginId: string): readonly string[] {
      const state = get();
      const dependents: string[] = [];

      for (const [id, registeredPlugin] of state.plugins) {
        const dependencies = registeredPlugin.plugin.meta?.dependencies ?? [];
        if (dependencies.includes(pluginId)) {
          dependents.push(id);
        }
      }

      return dependents;
    },

    // State queries
    getPlugin(pluginId: string): RegisteredPlugin | null {
      return get().plugins.get(pluginId) ?? null;
    },

    getActivePlugins(): readonly RegisteredPlugin[] {
      const state = get();
      return Array.from(state.activePlugins)
        .map(id => state.plugins.get(id))
        .filter((plugin): plugin is RegisteredPlugin => plugin !== undefined);
    },

    getLoadingState(pluginId: string): PluginLoadingState<RegisteredPlugin> {
      const state = get();
      
      if (state.loadingPlugins.has(pluginId)) {
        return { status: 'loading' };
      }
      
      const error = state.failedPlugins.get(pluginId);
      if (error) {
        return { status: 'error', error };
      }
      
      const plugin = state.plugins.get(pluginId);
      if (plugin) {
        return { status: 'success', data: plugin };
      }
      
      return { status: 'idle' };
    },

    isPluginActive(pluginId: string): boolean {
      return get().activePlugins.has(pluginId);
    },

    isPluginLoaded(pluginId: string): boolean {
      const plugin = get().plugins.get(pluginId);
      return plugin ? plugin.status !== 'idle' : false;
    },

    hasErrors(pluginId?: string): boolean {
      const state = get();
      if (pluginId) {
        return state.failedPlugins.has(pluginId);
      }
      return state.failedPlugins.size > 0;
    },

    // Bulk operations
    async activateMultiple(pluginIds: readonly string[]): Promise<PluginResult<void>> {
      try {
        for (const pluginId of pluginIds) {
          const result = await get().activate(pluginId);
          if (!result.success) {
            return result;
          }
        }
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'BULK_ACTIVATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    },

    deactivateMultiple(pluginIds: readonly string[]): PluginResult<void> {
      try {
        for (const pluginId of pluginIds) {
          const result = get().deactivate(pluginId);
          if (!result.success) {
            return result;
          }
        }
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'BULK_DEACTIVATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    },

    async reloadAll(): Promise<PluginResult<void>> {
      try {
        const state = get();
        const activePluginIds = Array.from(state.activePlugins);
        
        // Deactivate all
        const deactivateResult = get().deactivateMultiple(activePluginIds);
        if (!deactivateResult.success) {
          return deactivateResult;
        }
        
        // Reactivate all
        return await get().activateMultiple(activePluginIds);
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'RELOAD_ALL_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    },

    // State management
    resetState(): void {
      set(() => ({
        plugins: new Map(),
        activePlugins: new Set(),
        loadingPlugins: new Set(),
        failedPlugins: new Map(),
        dependencyGraph: new Map(),
        selectedPlugin: null,
        selectedPage: null,
        navigationHistory: [],
        currentHistoryIndex: -1,
      }));
    },

    getState(): PluginRegistryState {
      const state = get();
      return {
        plugins: state.plugins,
        activePlugins: state.activePlugins,
        loadingPlugins: state.loadingPlugins,
        failedPlugins: state.failedPlugins,
        dependencyGraph: state.dependencyGraph,
        selectedPlugin: state.selectedPlugin,
        selectedPage: state.selectedPage,
        navigationHistory: state.navigationHistory,
        currentHistoryIndex: state.currentHistoryIndex,
      };
    },
  }))
);

/**
 * Hook to access plugin registry with type safety
 */
export const usePluginRegistryActions = () => {
  return usePluginRegistry((state) => ({
    register: state.register,
    unregister: state.unregister,
    activate: state.activate,
    deactivate: state.deactivate,
    loadPlugin: state.loadPlugin,
    unloadPlugin: state.unloadPlugin,
    selectPlugin: state.selectPlugin,
    selectPage: state.selectPage,
    navigateBack: state.navigateBack,
    navigateForward: state.navigateForward,
    clearNavigation: state.clearNavigation,
    validateDependencies: state.validateDependencies,
    buildDependencyGraph: state.buildDependencyGraph,
    getPluginDependents: state.getPluginDependents,
    activateMultiple: state.activateMultiple,
    deactivateMultiple: state.deactivateMultiple,
    reloadAll: state.reloadAll,
    resetState: state.resetState,
  }));
};

/**
 * Hook to access plugin registry state
 */
export const usePluginRegistryState = () => {
  return usePluginRegistry((state) => ({
    plugins: state.plugins,
    activePlugins: state.activePlugins,
    loadingPlugins: state.loadingPlugins,
    failedPlugins: state.failedPlugins,
    selectedPlugin: state.selectedPlugin,
    selectedPage: state.selectedPage,
    navigationHistory: state.navigationHistory,
    currentHistoryIndex: state.currentHistoryIndex,
  }));
};

/**
 * Hook to access specific plugin state
 */
export const usePlugin = (pluginId: string) => {
  return usePluginRegistry((state) => ({
    plugin: state.getPlugin(pluginId),
    isActive: state.isPluginActive(pluginId),
    isLoaded: state.isPluginLoaded(pluginId),
    loadingState: state.getLoadingState(pluginId),
    hasError: state.hasErrors(pluginId),
  }));
};
