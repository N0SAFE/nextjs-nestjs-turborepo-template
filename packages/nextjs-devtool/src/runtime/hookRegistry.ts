    /**
 * Hook Registry System
 * 
 * Manages React hooks provided by plugins with complete type safety
 * and dependency resolution for the DevTool system.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  DevToolPlugin,
  PluginError,
  PluginDependency,
  HookRegistration,
  HookProvider,
  TypedError,
} from '../types';

/**
 * Hook registry state interface
 */
interface HookRegistryState {
  // Registered hooks by plugin
  readonly registeredHooks: ReadonlyMap<string, ReadonlyMap<string, HookRegistration>>;
  
  // Hook provider instances
  readonly hookProviders: ReadonlyMap<string, HookProvider>;
  
  // Hook dependencies
  readonly hookDependencies: ReadonlyMap<string, ReadonlySet<string>>;
  
  // Hook loading state
  readonly loadingHooks: ReadonlySet<string>;
  readonly loadedHooks: ReadonlySet<string>;
  readonly failedHooks: ReadonlyMap<string, PluginError>;
  
  // Hook usage tracking
  readonly hookUsage: ReadonlyMap<string, number>;
  readonly lastUsed: ReadonlyMap<string, number>;
}

/**
 * Hook registry actions interface
 */
interface HookRegistryActions {
  // Hook registration
  registerHooks(pluginId: string, hooks: Record<string, HookRegistration>): Promise<void>;
  unregisterHooks(pluginId: string): void;
  unregisterHook(pluginId: string, hookName: string): void;
  
  // Hook lifecycle
  loadHook(pluginId: string, hookName: string): Promise<HookProvider | null>;
  unloadHook(pluginId: string, hookName: string): void;
  isHookLoaded(pluginId: string, hookName: string): boolean;
  isHookLoading(pluginId: string, hookName: string): boolean;
  
  // Hook resolution
  resolveHook<T extends HookProvider = HookProvider>(
    pluginId: string, 
    hookName: string
  ): Promise<T | null>;
  resolveHookSync<T extends HookProvider = HookProvider>(
    pluginId: string, 
    hookName: string
  ): T | null;
  
  // Hook dependency management
  resolveDependencies(pluginId: string, hookName: string): Promise<string[]>;
  getDependentHooks(pluginId: string, hookName: string): string[];
  validateDependencies(pluginId: string, hookName: string): Promise<boolean>;
  
  // Hook querying
  getRegisteredHooks(pluginId?: string): readonly HookRegistration[];
  getHooksByTag(tag: string): readonly HookRegistration[];
  searchHooks(query: string): readonly HookRegistration[];
  
  // Hook state management
  getHookErrors(): ReadonlyMap<string, PluginError>;
  clearHookError(hookId: string): void;
  clearHookErrors(pluginId?: string): void;
  
  // Hook usage tracking
  trackHookUsage(pluginId: string, hookName: string): void;
  getHookUsage(pluginId: string, hookName: string): number;
  getMostUsedHooks(limit?: number): readonly [string, number][];
  
  // Hook cleanup
  clearHookRegistry(): void;
  cleanup(): void;
}

/**
 * Combined hook registry store interface
 */
type HookRegistryStore = HookRegistryState & HookRegistryActions;

/**
 * Create hook registry store
 */
export const useHookRegistry = create<HookRegistryStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    registeredHooks: new Map(),
    hookProviders: new Map(),
    hookDependencies: new Map(),
    loadingHooks: new Set(),
    loadedHooks: new Set(),
    failedHooks: new Map(),
    hookUsage: new Map(),
    lastUsed: new Map(),

    // Hook registration
    async registerHooks(pluginId: string, hooks: Record<string, HookRegistration>): Promise<void> {
      const hookMap = new Map(Object.entries(hooks));
      
      set((state) => ({
        registeredHooks: new Map(state.registeredHooks).set(pluginId, hookMap),
      }));

      // Process dependencies for each hook
      for (const [hookName, registration] of hookMap) {
        const hookId = `${pluginId}:${hookName}`;
        
        if (registration.dependencies && registration.dependencies.length > 0) {
          const deps: Set<string> = new Set(registration.dependencies.map((dep: string | PluginDependency) => 
            typeof dep === 'string' ? dep : `${dep.pluginId}:${dep.hookName ?? ''}`
          ));
          
          set((state) => ({
            hookDependencies: new Map(state.hookDependencies).set(hookId, deps),
          }));
        }
      }
    },

    unregisterHooks(pluginId: string): void {
      set((state) => {
        const newRegisteredHooks = new Map(state.registeredHooks);
        const newHookProviders = new Map(state.hookProviders);
        const newHookDependencies = new Map(state.hookDependencies);
        const newLoadingHooks = new Set(state.loadingHooks);
        const newLoadedHooks = new Set(state.loadedHooks);
        const newFailedHooks = new Map(state.failedHooks);
        const newHookUsage = new Map(state.hookUsage);
        const newLastUsed = new Map(state.lastUsed);

        // Remove plugin's hooks
        newRegisteredHooks.delete(pluginId);

        // Clean up hook providers and dependencies
        for (const [hookId] of newHookProviders) {
          if (hookId.startsWith(`${pluginId}:`)) {
            newHookProviders.delete(hookId);
            newHookDependencies.delete(hookId);
            newLoadingHooks.delete(hookId);
            newLoadedHooks.delete(hookId);
            newFailedHooks.delete(hookId);
            newHookUsage.delete(hookId);
            newLastUsed.delete(hookId);
          }
        }

        return {
          registeredHooks: newRegisteredHooks,
          hookProviders: newHookProviders,
          hookDependencies: newHookDependencies,
          loadingHooks: newLoadingHooks,
          loadedHooks: newLoadedHooks,
          failedHooks: newFailedHooks,
          hookUsage: newHookUsage,
          lastUsed: newLastUsed,
        };
      });
    },

    unregisterHook(pluginId: string, hookName: string): void {
      const hookId = `${pluginId}:${hookName}`;
      
      set((state) => {
        const pluginHooks = state.registeredHooks.get(pluginId);
        if (!pluginHooks) {
          return state;
        }

        const newPluginHooks = new Map(pluginHooks);
        newPluginHooks.delete(hookName);

        const newRegisteredHooks = new Map(state.registeredHooks);
        if (newPluginHooks.size === 0) {
          newRegisteredHooks.delete(pluginId);
        } else {
          newRegisteredHooks.set(pluginId, newPluginHooks);
        }

        const newHookProviders = new Map(state.hookProviders);
        const newHookDependencies = new Map(state.hookDependencies);
        const newLoadingHooks = new Set(state.loadingHooks);
        const newLoadedHooks = new Set(state.loadedHooks);
        const newFailedHooks = new Map(state.failedHooks);
        const newHookUsage = new Map(state.hookUsage);
        const newLastUsed = new Map(state.lastUsed);

        newHookProviders.delete(hookId);
        newHookDependencies.delete(hookId);
        newLoadingHooks.delete(hookId);
        newLoadedHooks.delete(hookId);
        newFailedHooks.delete(hookId);
        newHookUsage.delete(hookId);
        newLastUsed.delete(hookId);

        return {
          registeredHooks: newRegisteredHooks,
          hookProviders: newHookProviders,
          hookDependencies: newHookDependencies,
          loadingHooks: newLoadingHooks,
          loadedHooks: newLoadedHooks,
          failedHooks: newFailedHooks,
          hookUsage: newHookUsage,
          lastUsed: newLastUsed,
        };
      });
    },

    // Hook lifecycle
    async loadHook(pluginId: string, hookName: string): Promise<HookProvider | null> {
      const hookId = `${pluginId}:${hookName}`;
      const { registeredHooks, loadedHooks, loadingHooks } = get();

      // Check if already loaded
      if (loadedHooks.has(hookId)) {
        return get().hookProviders.get(hookId) ?? null;
      }

      // Check if already loading
      if (loadingHooks.has(hookId)) {
        return null;
      }

      // Get hook registration
      const pluginHooks = registeredHooks.get(pluginId);
      const hookRegistration = pluginHooks?.get(hookName);
      
      if (!hookRegistration) {
        const error: PluginError = {
          code: 'HOOK_NOT_FOUND',
          message: `Hook ${hookName} not found in plugin ${pluginId}`,
          details: { pluginId, hookName },
          stack: new Error().stack ?? '',
        };

        set((state) => ({
          failedHooks: new Map(state.failedHooks).set(hookId, error),
        }));
        
        return null;
      }

      // Mark as loading
      set((state) => ({
        loadingHooks: new Set(state.loadingHooks).add(hookId),
      }));

      try {
        // Resolve dependencies first
        const depsResolved = await get().validateDependencies(pluginId, hookName);
        if (!depsResolved) {
          throw new Error(`Failed to resolve dependencies for hook ${hookId}`);
        }

        // Load hook provider
        let hookProvider: HookProvider;
        
        if (typeof hookRegistration.factory === 'function') {
          hookProvider = await hookRegistration.factory();
        } else {
          hookProvider = hookRegistration.factory;
        }

        // Store loaded hook
        set((state) => {
          const newHookProviders = new Map(state.hookProviders);
          const newLoadingHooks = new Set(state.loadingHooks);
          const newLoadedHooks = new Set(state.loadedHooks);
          const newFailedHooks = new Map(state.failedHooks);

          newHookProviders.set(hookId, hookProvider);
          newLoadingHooks.delete(hookId);
          newLoadedHooks.add(hookId);
          newFailedHooks.delete(hookId); // Clear any previous errors

          return {
            hookProviders: newHookProviders,
            loadingHooks: newLoadingHooks,
            loadedHooks: newLoadedHooks,
            failedHooks: newFailedHooks,
          };
        });

        return hookProvider;

      } catch (error) {
        const hookError: PluginError = {
          code: 'HOOK_LOAD_FAILED',
          message: `Failed to load hook ${hookId}`,
          details: { 
            pluginId, 
            hookName,
            originalError: error instanceof Error ? error.message : String(error),
          },
          stack: error instanceof Error ? (error.stack ?? '') : new Error().stack ?? '',
        };

        set((state) => {
          const newFailedHooks = new Map(state.failedHooks);
          const newLoadingHooks = new Set(state.loadingHooks);

          newFailedHooks.set(hookId, hookError);
          newLoadingHooks.delete(hookId);

          return {
            failedHooks: newFailedHooks,
            loadingHooks: newLoadingHooks,
          };
        });

        return null;
      }
    },

    unloadHook(pluginId: string, hookName: string): void {
      const hookId = `${pluginId}:${hookName}`;
      
      set((state) => {
        const newHookProviders = new Map(state.hookProviders);
        const newLoadedHooks = new Set(state.loadedHooks);
        const newFailedHooks = new Map(state.failedHooks);

        newHookProviders.delete(hookId);
        newLoadedHooks.delete(hookId);
        newFailedHooks.delete(hookId);

        return {
          hookProviders: newHookProviders,
          loadedHooks: newLoadedHooks,
          failedHooks: newFailedHooks,
        };
      });
    },

    isHookLoaded(pluginId: string, hookName: string): boolean {
      const hookId = `${pluginId}:${hookName}`;
      return get().loadedHooks.has(hookId);
    },

    isHookLoading(pluginId: string, hookName: string): boolean {
      const hookId = `${pluginId}:${hookName}`;
      return get().loadingHooks.has(hookId);
    },

    // Hook resolution
    async resolveHook<T extends HookProvider = HookProvider>(
      pluginId: string, 
      hookName: string
    ): Promise<T | null> {
      const hookId = `${pluginId}:${hookName}`;
      
      // Try to get existing provider
      let provider = get().hookProviders.get(hookId);
      
      if (!provider) {
        // Try to load the hook
        provider = await get().loadHook(pluginId, hookName);
      }

      if (provider) {
        // Track usage
        get().trackHookUsage(pluginId, hookName);
        return provider as T;
      }

      return null;
    },

    resolveHookSync<T extends HookProvider = HookProvider>(
      pluginId: string, 
      hookName: string
    ): T | null {
      const hookId = `${pluginId}:${hookName}`;
      const provider = get().hookProviders.get(hookId);
      
      if (provider) {
        get().trackHookUsage(pluginId, hookName);
        return provider as T;
      }

      return null;
    },

    // Hook dependency management
    async resolveDependencies(pluginId: string, hookName: string): Promise<string[]> {
      const hookId = `${pluginId}:${hookName}`;
      const dependencies = get().hookDependencies.get(hookId);
      
      if (!dependencies || dependencies.size === 0) {
        return [];
      }

      const resolved: string[] = [];
      
      for (const depId of dependencies) {
        const parts = depId.split(':');
        if (parts.length !== 2) {
          continue;
        }
        
        const [depPluginId, depHookName] = parts;
        if (!depPluginId || !depHookName) {
          continue;
        }
        
        const depProvider = await get().resolveHook(depPluginId, depHookName);
        
        if (depProvider) {
          resolved.push(depId);
        }
      }

      return resolved;
    },

    getDependentHooks(pluginId: string, hookName: string): string[] {
      const targetHookId = `${pluginId}:${hookName}`;
      const dependents: string[] = [];

      for (const [hookId, dependencies] of get().hookDependencies) {
        if (dependencies.has(targetHookId)) {
          dependents.push(hookId);
        }
      }

      return dependents;
    },

    async validateDependencies(pluginId: string, hookName: string): Promise<boolean> {
      const hookId = `${pluginId}:${hookName}`;
      const dependencies = get().hookDependencies.get(hookId);
      
      if (!dependencies || dependencies.size === 0) {
        return true;
      }

      for (const depId of dependencies) {
        const parts = depId.split(':');
        if (parts.length !== 2) {
          continue;
        }
        
        const [depPluginId, depHookName] = parts;
        if (!depPluginId || !depHookName) {
          continue;
        }
        
        const isLoaded = get().isHookLoaded(depPluginId, depHookName);
        
        if (!isLoaded) {
          // Try to load the dependency
          const loaded = await get().loadHook(depPluginId, depHookName);
          if (!loaded) {
            return false;
          }
        }
      }

      return true;
    },

    // Hook querying
    getRegisteredHooks(pluginId?: string): readonly HookRegistration[] {
      const { registeredHooks } = get();
      const hooks: HookRegistration[] = [];

      if (pluginId) {
        const pluginHooks = registeredHooks.get(pluginId);
        if (pluginHooks) {
          hooks.push(...Array.from(pluginHooks.values()));
        }
      } else {
        for (const pluginHooks of registeredHooks.values()) {
          hooks.push(...Array.from(pluginHooks.values()));
        }
      }

      return hooks;
    },

    getHooksByTag(tag: string): readonly HookRegistration[] {
      return get().getRegisteredHooks().filter(hook => 
        hook.tags?.includes(tag) ?? false
      );
    },

    searchHooks(query: string): readonly HookRegistration[] {
      const lowerQuery = query.toLowerCase();
      
      return get().getRegisteredHooks().filter(hook => 
        hook.name.toLowerCase().includes(lowerQuery) ||
        hook.description?.toLowerCase().includes(lowerQuery) ||
        hook.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      );
    },

    // Hook state management
    getHookErrors(): ReadonlyMap<string, PluginError> {
      return get().failedHooks;
    },

    clearHookError(hookId: string): void {
      set((state) => {
        const newFailedHooks = new Map(state.failedHooks);
        newFailedHooks.delete(hookId);
        return { failedHooks: newFailedHooks };
      });
    },

    clearHookErrors(pluginId?: string): void {
      set((state) => {
        const newFailedHooks = new Map(state.failedHooks);
        
        if (pluginId) {
          for (const hookId of newFailedHooks.keys()) {
            if (hookId.startsWith(`${pluginId}:`)) {
              newFailedHooks.delete(hookId);
            }
          }
        } else {
          newFailedHooks.clear();
        }

        return { failedHooks: newFailedHooks };
      });
    },

    // Hook usage tracking
    trackHookUsage(pluginId: string, hookName: string): void {
      const hookId = `${pluginId}:${hookName}`;
      const now = Date.now();
      
      set((state) => {
        const newHookUsage = new Map(state.hookUsage);
        const newLastUsed = new Map(state.lastUsed);
        
        newHookUsage.set(hookId, (newHookUsage.get(hookId) ?? 0) + 1);
        newLastUsed.set(hookId, now);

        return {
          hookUsage: newHookUsage,
          lastUsed: newLastUsed,
        };
      });
    },

    getHookUsage(pluginId: string, hookName: string): number {
      const hookId = `${pluginId}:${hookName}`;
      return get().hookUsage.get(hookId) ?? 0;
    },

    getMostUsedHooks(limit: number = 10): readonly [string, number][] {
      const { hookUsage } = get();
      
      return Array.from(hookUsage.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);
    },

    // Hook cleanup
    clearHookRegistry(): void {
      set(() => ({
        registeredHooks: new Map(),
        hookProviders: new Map(),
        hookDependencies: new Map(),
        loadingHooks: new Set(),
        loadedHooks: new Set(),
        failedHooks: new Map(),
        hookUsage: new Map(),
        lastUsed: new Map(),
      }));
    },

    cleanup(): void {
      get().clearHookRegistry();
    },
  }))
);

/**
 * Hook for accessing hook registry
 */
export const useHookRegistryActions = () => {
  return useHookRegistry((state) => ({
    registerHooks: state.registerHooks,
    unregisterHooks: state.unregisterHooks,
    resolveHook: state.resolveHook,
    resolveHookSync: state.resolveHookSync,
    loadHook: state.loadHook,
    unloadHook: state.unloadHook,
    isHookLoaded: state.isHookLoaded,
    isHookLoading: state.isHookLoading,
  }));
};

/**
 * Hook for querying registered hooks
 */
export const useRegisteredHooks = (pluginId?: string) => {
  return useHookRegistry((state) => ({
    hooks: state.getRegisteredHooks(pluginId),
    getHooksByTag: state.getHooksByTag,
    searchHooks: state.searchHooks,
  }));
};

/**
 * Hook for tracking hook usage
 */
export const useHookUsage = () => {
  return useHookRegistry((state) => ({
    trackUsage: state.trackHookUsage,
    getUsage: state.getHookUsage,
    getMostUsed: state.getMostUsedHooks,
  }));
};

/**
 * Hook for managing hook errors
 */
export const useHookErrors = () => {
  return useHookRegistry((state) => ({
    errors: state.getHookErrors(),
    clearError: state.clearHookError,
    clearErrors: state.clearHookErrors,
  }));
};
