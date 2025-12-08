import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  DependencySpec,
  FileSpec,
  GeneratorContext,
} from "../../../../types/generator.types";

/**
 * Toast/Sonner Generator
 *
 * Sets up Sonner for beautiful toast notifications including:
 * - Toast provider configuration
 * - Custom toast utilities
 * - Toast action helpers for mutations
 * - Promise-based toast helpers
 * - Dark mode support
 * - Custom styling integration
 *
 * Sonner is a lightweight and highly customizable toast library
 * that works well with React/Next.js applications.
 */
@Injectable()
export class ToastSonnerGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "toast-sonner",
    priority: 25,
    version: "1.0.0",
    description:
      "Beautiful toast notifications with Sonner - includes provider setup, utilities, and action helpers",
    contributesTo: ["app/layout.tsx", "lib/toast.ts"],
    dependsOn: ["nextjs"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    if (!this.hasPlugin(context, "nextjs")) {
      return [];
    }

    const files: FileSpec[] = [];
    const hasReactQuery = this.hasPlugin(context, "react-query");
    const hasTailwind = this.hasPlugin(context, "tailwindcss");

    // Toast provider component
    files.push(
      this.file(
        "apps/web/src/components/providers/toast-provider.tsx",
        this.generateToastProvider(hasTailwind),
        { mergeStrategy: "replace", priority: 25 },
      ),
    );

    // Toast utilities
    files.push(
      this.file(
        "apps/web/src/lib/toast.ts",
        this.generateToastUtils(hasReactQuery),
        { mergeStrategy: "replace", priority: 25 },
      ),
    );

    // Toast hook for common patterns
    files.push(
      this.file(
        "apps/web/src/hooks/use-toast-action.ts",
        this.generateToastActionHook(),
        { mergeStrategy: "replace", priority: 25 },
      ),
    );

    // Example usage documentation
    files.push(
      this.file(
        "apps/web/src/lib/toast.example.tsx",
        this.generateToastExamples(),
        { mergeStrategy: "replace", priority: 25, skipIfExists: true },
      ),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      {
        name: "sonner",
        version: "^1.7.0",
        type: "prod",
        target: "web",
        pluginId: "toast-sonner",
      },
    ];
  }

  private generateToastProvider(hasTailwind: boolean): string {
    const positionClass = hasTailwind
      ? `className="toaster group"`
      : ``;

    return `"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

/**
 * Toast provider component that wraps the app with Sonner's Toaster.
 * Automatically handles dark mode based on the current theme.
 *
 * @example
 * // In your root layout:
 * import { ToastProvider } from "@/components/providers/toast-provider";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <ToastProvider />
 *       </body>
 *     </html>
 *   );
 * }
 */
export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme as "light" | "dark" | "system"}
      position="bottom-right"
      richColors
      closeButton
      expand={false}
      duration={5000}
      gap={12}
      ${positionClass}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive",
          success: "group-[.toaster]:bg-success group-[.toaster]:text-success-foreground",
          warning: "group-[.toaster]:bg-warning group-[.toaster]:text-warning-foreground",
          info: "group-[.toaster]:bg-info group-[.toaster]:text-info-foreground",
        },
      }}
    />
  );
}

export default ToastProvider;
`;
  }

  private generateToastUtils(hasReactQuery: boolean): string {
    const reactQueryImport = hasReactQuery
      ? `import type { UseMutationResult } from "@tanstack/react-query";`
      : "";

    const mutationHelper = hasReactQuery
      ? `
/**
 * Helper to show toast notifications for React Query mutations.
 * Automatically handles loading, success, and error states.
 *
 * @example
 * const mutation = useCreateUser();
 * const showToast = mutationToast(mutation, {
 *   loading: "Creating user...",
 *   success: "User created!",
 *   error: "Failed to create user",
 * });
 *
 * // Execute with toast
 * showToast.mutate({ name: "John" });
 */
export function mutationToast<TData, TError, TVariables, TContext>(
  mutation: UseMutationResult<TData, TError, TVariables, TContext>,
  messages: {
    loading?: string;
    success?: string | ((data: TData) => string);
    error?: string | ((error: TError) => string);
  },
) {
  return {
    mutate: (variables: TVariables) => {
      const toastId = messages.loading ? toast.loading(messages.loading) : undefined;

      mutation.mutate(variables, {
        onSuccess: (data) => {
          const message = typeof messages.success === "function"
            ? messages.success(data)
            : messages.success || "Success!";

          if (toastId) {
            toast.success(message, { id: toastId });
          } else {
            toast.success(message);
          }
        },
        onError: (error) => {
          const message = typeof messages.error === "function"
            ? messages.error(error)
            : messages.error || "An error occurred";

          if (toastId) {
            toast.error(message, { id: toastId });
          } else {
            toast.error(message);
          }
        },
      });
    },
    mutateAsync: async (variables: TVariables) => {
      return toast.promise(mutation.mutateAsync(variables), {
        loading: messages.loading || "Loading...",
        success: (data) =>
          typeof messages.success === "function"
            ? messages.success(data)
            : messages.success || "Success!",
        error: (error) =>
          typeof messages.error === "function"
            ? messages.error(error as TError)
            : messages.error || "An error occurred",
      });
    },
  };
}
`
      : "";

    return `import { toast as sonnerToast, type ExternalToast } from "sonner";

${reactQueryImport}

/**
 * Toast notification utilities built on top of Sonner.
 * Provides typed helpers and common patterns for showing notifications.
 *
 * @example
 * import { toast } from "@/lib/toast";
 *
 * // Basic usage
 * toast.success("Operation completed!");
 * toast.error("Something went wrong");
 *
 * // With options
 * toast.info("Check this out", {
 *   description: "More details here",
 *   action: { label: "Undo", onClick: () => handleUndo() },
 * });
 *
 * // Promise-based
 * toast.promise(fetchData(), {
 *   loading: "Loading...",
 *   success: "Data loaded!",
 *   error: "Failed to load",
 * });
 */

export type ToastOptions = ExternalToast;

export type ToastAction = {
  label: string;
  onClick: () => void;
};

/**
 * Extended toast interface with typed helpers
 */
export const toast = {
  /**
   * Show a basic toast message
   */
  message: (message: string, options?: ToastOptions) =>
    sonnerToast(message, options),

  /**
   * Show a success toast
   */
  success: (message: string, options?: ToastOptions) =>
    sonnerToast.success(message, options),

  /**
   * Show an error toast
   */
  error: (message: string, options?: ToastOptions) =>
    sonnerToast.error(message, options),

  /**
   * Show an info toast
   */
  info: (message: string, options?: ToastOptions) =>
    sonnerToast.info(message, options),

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: ToastOptions) =>
    sonnerToast.warning(message, options),

  /**
   * Show a loading toast
   */
  loading: (message: string, options?: ToastOptions) =>
    sonnerToast.loading(message, options),

  /**
   * Show a toast with a promise, automatically handling loading/success/error states
   */
  promise: sonnerToast.promise,

  /**
   * Show a custom toast with full control
   */
  custom: sonnerToast.custom,

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),

  /**
   * Show a toast with an action button
   */
  action: (
    message: string,
    action: ToastAction,
    options?: Omit<ToastOptions, "action">,
  ) =>
    sonnerToast(message, {
      ...options,
      action: {
        label: action.label,
        onClick: action.onClick,
      },
    }),

  /**
   * Show a success toast with an action button
   */
  successAction: (
    message: string,
    action: ToastAction,
    options?: Omit<ToastOptions, "action">,
  ) =>
    sonnerToast.success(message, {
      ...options,
      action: {
        label: action.label,
        onClick: action.onClick,
      },
    }),

  /**
   * Show an error toast with a retry action
   */
  errorRetry: (
    message: string,
    onRetry: () => void,
    options?: Omit<ToastOptions, "action">,
  ) =>
    sonnerToast.error(message, {
      ...options,
      action: {
        label: "Retry",
        onClick: onRetry,
      },
    }),
};
${mutationHelper}
/**
 * Create a toast notification for async operations
 * @param asyncFn - The async function to execute
 * @param messages - Messages for loading, success, and error states
 */
export async function withToast<T>(
  asyncFn: () => Promise<T>,
  messages: {
    loading?: string;
    success?: string | ((result: T) => string);
    error?: string | ((error: unknown) => string);
  },
): Promise<T> {
  return toast.promise(asyncFn(), {
    loading: messages.loading || "Loading...",
    success: (result) =>
      typeof messages.success === "function"
        ? messages.success(result)
        : messages.success || "Success!",
    error: (error) =>
      typeof messages.error === "function"
        ? messages.error(error)
        : messages.error || "An error occurred",
  });
}

/**
 * Create a debounced toast to prevent spam
 */
export function createDebouncedToast(delay = 1000) {
  let lastToastTime = 0;

  return {
    show: (
      type: "success" | "error" | "info" | "warning",
      message: string,
      options?: ToastOptions,
    ) => {
      const now = Date.now();
      if (now - lastToastTime > delay) {
        lastToastTime = now;
        toast[type](message, options);
      }
    },
  };
}

export default toast;
`;
  }

  private generateToastActionHook(): string {
    return `"use client";

import { useCallback, useRef } from "react";
import { toast, type ToastOptions } from "@/lib/toast";

interface UseToastActionOptions {
  /**
   * Delay between showing the same toast (in ms)
   * @default 1000
   */
  debounceDelay?: number;
  /**
   * Default duration for toasts (in ms)
   * @default 5000
   */
  duration?: number;
}

interface ToastActionMessages {
  loading?: string;
  success?: string | (() => string);
  error?: string | ((error: unknown) => string);
}

/**
 * Hook for managing toast notifications for async actions.
 * Provides debouncing, loading states, and automatic error handling.
 *
 * @example
 * function MyComponent() {
 *   const { executeWithToast, isLoading } = useToastAction();
 *
 *   const handleSubmit = async (data: FormData) => {
 *     await executeWithToast(
 *       () => submitForm(data),
 *       {
 *         loading: "Submitting...",
 *         success: "Form submitted!",
 *         error: "Failed to submit form",
 *       }
 *     );
 *   };
 *
 *   return (
 *     <button onClick={handleSubmit} disabled={isLoading}>
 *       Submit
 *     </button>
 *   );
 * }
 */
export function useToastAction(options: UseToastActionOptions = {}) {
  const { debounceDelay = 1000, duration = 5000 } = options;

  const lastToastTime = useRef(0);
  const currentToastId = useRef<string | number | undefined>();

  /**
   * Show a toast with debouncing
   */
  const showToast = useCallback(
    (
      type: "success" | "error" | "info" | "warning" | "message",
      message: string,
      toastOptions?: ToastOptions,
    ) => {
      const now = Date.now();
      if (now - lastToastTime.current > debounceDelay) {
        lastToastTime.current = now;
        if (type === "message") {
          toast.message(message, { duration, ...toastOptions });
        } else {
          toast[type](message, { duration, ...toastOptions });
        }
      }
    },
    [debounceDelay, duration],
  );

  /**
   * Execute an async function with toast notifications
   */
  const executeWithToast = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      messages: ToastActionMessages,
      toastOptions?: ToastOptions,
    ): Promise<T | undefined> => {
      // Show loading toast
      if (messages.loading) {
        currentToastId.current = toast.loading(messages.loading, {
          duration: Infinity,
          ...toastOptions,
        });
      }

      try {
        const result = await asyncFn();

        // Dismiss loading and show success
        if (currentToastId.current) {
          toast.dismiss(currentToastId.current);
        }

        const successMessage =
          typeof messages.success === "function"
            ? messages.success()
            : messages.success;

        if (successMessage) {
          showToast("success", successMessage, toastOptions);
        }

        return result;
      } catch (error) {
        // Dismiss loading and show error
        if (currentToastId.current) {
          toast.dismiss(currentToastId.current);
        }

        const errorMessage =
          typeof messages.error === "function"
            ? messages.error(error)
            : messages.error || "An error occurred";

        showToast("error", errorMessage, toastOptions);

        throw error;
      } finally {
        currentToastId.current = undefined;
      }
    },
    [showToast],
  );

  /**
   * Execute with optimistic update pattern
   */
  const executeOptimistic = useCallback(
    async <T, TOptimistic>(
      asyncFn: () => Promise<T>,
      optimisticUpdate: () => TOptimistic,
      rollback: (previous: TOptimistic) => void,
      messages: ToastActionMessages,
    ): Promise<T | undefined> => {
      const previous = optimisticUpdate();

      try {
        const result = await asyncFn();

        const successMessage =
          typeof messages.success === "function"
            ? messages.success()
            : messages.success;

        if (successMessage) {
          showToast("success", successMessage);
        }

        return result;
      } catch (error) {
        // Rollback on error
        rollback(previous);

        const errorMessage =
          typeof messages.error === "function"
            ? messages.error(error)
            : messages.error || "An error occurred";

        showToast("error", errorMessage);

        throw error;
      }
    },
    [showToast],
  );

  /**
   * Show a confirm toast with undo action
   */
  const confirmAction = useCallback(
    (
      message: string,
      onUndo: () => void,
      undoTimeout = 5000,
    ) => {
      toast.successAction(
        message,
        {
          label: "Undo",
          onClick: onUndo,
        },
        { duration: undoTimeout },
      );
    },
    [],
  );

  return {
    showToast,
    executeWithToast,
    executeOptimistic,
    confirmAction,
    toast,
  };
}

export default useToastAction;
`;
  }

  private generateToastExamples(): string {
    return `"use client";

/**
 * Toast Usage Examples
 *
 * This file demonstrates various ways to use the toast utilities.
 * Remove this file in production - it's just for reference.
 */

import { toast, withToast, createDebouncedToast } from "@/lib/toast";
import { useToastAction } from "@/hooks/use-toast-action";

// =============================================================================
// Basic Toast Examples
// =============================================================================

export function BasicToastExamples() {
  return (
    <div className="space-y-4">
      <button onClick={() => toast.success("Operation successful!")}>
        Success Toast
      </button>

      <button onClick={() => toast.error("Something went wrong")}>
        Error Toast
      </button>

      <button onClick={() => toast.info("Here's some information")}>
        Info Toast
      </button>

      <button onClick={() => toast.warning("Warning: Check this out")}>
        Warning Toast
      </button>

      <button
        onClick={() =>
          toast.message("Custom message", {
            description: "With a description",
            duration: 10000,
          })
        }
      >
        Custom Toast
      </button>
    </div>
  );
}

// =============================================================================
// Action Toast Examples
// =============================================================================

export function ActionToastExamples() {
  const handleUndo = () => {
    console.log("Undo clicked!");
    toast.info("Action undone");
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() =>
          toast.action("Item deleted", { label: "Undo", onClick: handleUndo })
        }
      >
        Toast with Action
      </button>

      <button
        onClick={() =>
          toast.successAction(
            "File uploaded!",
            { label: "View", onClick: () => console.log("View file") },
          )
        }
      >
        Success with Action
      </button>

      <button
        onClick={() =>
          toast.errorRetry(
            "Upload failed",
            () => console.log("Retrying..."),
          )
        }
      >
        Error with Retry
      </button>
    </div>
  );
}

// =============================================================================
// Promise Toast Examples
// =============================================================================

async function fakeApiCall(): Promise<{ data: string }> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  if (Math.random() > 0.5) {
    throw new Error("Random failure");
  }
  return { data: "Success!" };
}

export function PromiseToastExamples() {
  const handlePromiseToast = () => {
    toast.promise(fakeApiCall(), {
      loading: "Loading data...",
      success: (data) => \`Loaded: \${data.data}\`,
      error: (err) => \`Error: \${err instanceof Error ? err.message : "Unknown"}\`,
    });
  };

  const handleWithToast = async () => {
    try {
      await withToast(fakeApiCall, {
        loading: "Fetching...",
        success: "Data fetched successfully!",
        error: "Failed to fetch data",
      });
    } catch {
      // Error already handled by toast
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={handlePromiseToast}>Promise Toast</button>
      <button onClick={handleWithToast}>With Toast Helper</button>
    </div>
  );
}

// =============================================================================
// Hook Usage Examples
// =============================================================================

export function HookToastExamples() {
  const { executeWithToast, confirmAction } = useToastAction({
    debounceDelay: 500,
  });

  const handleSave = async () => {
    await executeWithToast(
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return { saved: true };
      },
      {
        loading: "Saving changes...",
        success: "Changes saved!",
        error: "Failed to save changes",
      },
    );
  };

  const handleDelete = () => {
    // Simulate deletion with undo option
    confirmAction(
      "Item deleted",
      () => {
        toast.info("Deletion cancelled");
      },
      5000,
    );
  };

  return (
    <div className="space-y-4">
      <button onClick={handleSave}>Save with Toast Hook</button>
      <button onClick={handleDelete}>Delete with Undo</button>
    </div>
  );
}

// =============================================================================
// Debounced Toast Example
// =============================================================================

export function DebouncedToastExample() {
  const debouncedToast = createDebouncedToast(2000);

  const handleSpamClick = () => {
    // This will only show one toast every 2 seconds
    debouncedToast.show("info", "You can spam click, but I'm debounced!");
  };

  return (
    <button onClick={handleSpamClick}>
      Click Rapidly (Debounced Toast)
    </button>
  );
}

// =============================================================================
// Main Example Component
// =============================================================================

export default function ToastExamplesPage() {
  return (
    <div className="container mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-bold">Toast Examples</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">Basic Toasts</h2>
        <BasicToastExamples />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Action Toasts</h2>
        <ActionToastExamples />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Promise Toasts</h2>
        <PromiseToastExamples />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Hook Usage</h2>
        <HookToastExamples />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Debounced Toast</h2>
        <DebouncedToastExample />
      </section>
    </div>
  );
}
`;
  }
}
