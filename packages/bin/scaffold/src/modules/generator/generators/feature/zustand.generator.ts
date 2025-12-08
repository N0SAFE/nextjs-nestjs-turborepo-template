/**
 * Zustand Generator
 *
 * Sets up Zustand for lightweight state management.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class ZustandGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "zustand",
    priority: 30,
    version: "1.0.0",
    description: "Lightweight state management with Zustand",
    dependencies: ["nextjs", "typescript"],
    contributesTo: ["package.json"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    if (!this.hasPlugin(context, "nextjs")) {
      return [];
    }

    return [
      this.file("apps/web/src/state/store.ts", this.getStoreSetup()),
      this.file("apps/web/src/state/index.ts", this.getStoreIndex()),
      this.file("apps/web/src/state/slices/ui.slice.ts", this.getUISlice()),
      this.file("apps/web/src/state/slices/index.ts", this.getSlicesIndex()),
      this.file("apps/web/src/state/middleware/logger.ts", this.getLoggerMiddleware()),
      this.file("apps/web/src/state/middleware/persist.ts", this.getPersistMiddleware()),
    ];
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    if (!this.hasPlugin(context, "nextjs")) {
      return [];
    }

    return [
      { name: "zustand", version: "^4.5.0", type: "prod", target: "apps/web", pluginId: "zustand" },
    ];
  }

  private getStoreSetup(): string {
    return `import { create, StateCreator } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createUISlice, UISlice } from "./slices/ui.slice";

/**
 * Combined store type
 */
export type AppStore = UISlice;

/**
 * Store slice creator type with middleware
 */
export type SliceCreator<T> = StateCreator<
  AppStore,
  [["zustand/devtools", never], ["zustand/subscribeWithSelector", never], ["zustand/immer", never]],
  [],
  T
>;

/**
 * Main app store
 */
export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector(
      immer((...a) => ({
        ...createUISlice(...a),
      }))
    ),
    {
      name: "app-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

/**
 * Selector hook for type-safe state selection
 */
export function useStore<T>(selector: (state: AppStore) => T): T {
  return useAppStore(selector);
}

/**
 * Action dispatcher hook
 */
export function useActions() {
  return {
    ui: {
      setTheme: useAppStore((s) => s.setTheme),
      toggleSidebar: useAppStore((s) => s.toggleSidebar),
      openModal: useAppStore((s) => s.openModal),
      closeModal: useAppStore((s) => s.closeModal),
    },
  };
}
`;
  }

  private getStoreIndex(): string {
    return `/**
 * State management exports
 */
export { useAppStore, useStore, useActions } from "./store";
export type { AppStore } from "./store";
export * from "./slices";
`;
  }

  private getUISlice(): string {
    return `import type { SliceCreator } from "../store";

/**
 * UI State Slice
 */
export interface UISlice {
  // Theme
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Modal
  activeModal: string | null;
  modalData: Record<string, unknown>;
  openModal: (id: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;
  setLoading: (loading: boolean, message?: string) => void;

  // Toast/Notifications
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    duration?: number;
  }>;
  addNotification: (notification: Omit<UISlice["notifications"][0], "id">) => void;
  removeNotification: (id: string) => void;
}

export const createUISlice: SliceCreator<UISlice> = (set, get) => ({
  // Theme
  theme: "system",
  setTheme: (theme) => set((state) => { state.theme = theme; }),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => { state.sidebarOpen = !state.sidebarOpen; }),
  setSidebarOpen: (open) => set((state) => { state.sidebarOpen = open; }),

  // Modal
  activeModal: null,
  modalData: {},
  openModal: (id, data = {}) => set((state) => {
    state.activeModal = id;
    state.modalData = data;
  }),
  closeModal: () => set((state) => {
    state.activeModal = null;
    state.modalData = {};
  }),

  // Loading
  isLoading: false,
  loadingMessage: null,
  setLoading: (loading, message) => set((state) => {
    state.isLoading = loading;
    state.loadingMessage = message ?? null;
  }),

  // Notifications
  notifications: [],
  addNotification: (notification) => set((state) => {
    const id = Math.random().toString(36).substring(7);
    state.notifications.push({ ...notification, id });
    
    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration ?? 5000);
    }
  }),
  removeNotification: (id) => set((state) => {
    state.notifications = state.notifications.filter((n) => n.id !== id);
  }),
});
`;
  }

  private getSlicesIndex(): string {
    return `/**
 * State slice exports
 */
export { createUISlice } from "./ui.slice";
export type { UISlice } from "./ui.slice";
`;
  }

  private getLoggerMiddleware(): string {
    return `import type { StateCreator, StoreMutatorIdentifier } from "zustand";

/**
 * Logger middleware for development debugging
 */
type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string,
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string,
) => StateCreator<T, [], []>;

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...args) => {
    const prevState = get();
    set(...args);
    const nextState = get();
    
    if (process.env.NODE_ENV === "development") {
      console.group(name ? \`[Zustand] \${name}\` : "[Zustand] State Update");
      console.log("Prev State:", prevState);
      console.log("Next State:", nextState);
      console.groupEnd();
    }
  };
  
  return f(loggedSet, get, store);
};

export const logger = loggerImpl as Logger;
`;
  }

  private getPersistMiddleware(): string {
    return `import { PersistOptions, createJSONStorage } from "zustand/middleware";
import type { AppStore } from "../store";

/**
 * Persist configuration for client-side storage
 */
export const persistConfig: PersistOptions<AppStore, Pick<AppStore, "theme" | "sidebarOpen">> = {
  name: "app-storage",
  version: 1,
  storage: createJSONStorage(() => {
    // Only use localStorage on client
    if (typeof window === "undefined") {
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };
    }
    return localStorage;
  }),
  partialize: (state) => ({
    theme: state.theme,
    sidebarOpen: state.sidebarOpen,
  }),
  onRehydrateStorage: () => (state) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Zustand] Hydrated state:", state);
    }
  },
};

/**
 * Create persist middleware with config
 */
export function createPersistConfig<T extends AppStore>(
  partialize: (state: T) => Partial<T>,
  name = "app-storage"
): PersistOptions<T, Partial<T>> {
  return {
    name,
    version: 1,
    storage: createJSONStorage(() => {
      if (typeof window === "undefined") {
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }
      return localStorage;
    }),
    partialize,
  };
}
`;
  }
}
