// ============================================
// Type Definitions
// ============================================

import { StandardLinkOptions, StandardLinkPlugin } from "@orpc/client/standard";

export interface ProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
  phase: "upload" | "processing" | "download";
  timestamp: number;
}

type ProgressSubscriber = (event: ProgressEvent) => void;

// Internal symbols for context injection
const PROGRESS_SUBSCRIPTION_SYMBOL = Symbol("orpc.progress.subscription");
const PROGRESS_TRACKER_SYMBOL = Symbol("orpc.progress.tracker");

// ============================================
// Progress Subscription Manager
// ============================================

class ProgressSubscription {
  private subscribers = new Set<ProgressSubscriber>();
  private uploadSubscribers = new Set<ProgressSubscriber>();
  private downloadSubscribers = new Set<ProgressSubscriber>();
  private latestEvent: ProgressEvent | null = null;

  subscribe(callback: ProgressSubscriber): () => void {
    console.log('[ProgressPlugin] Subscribing to general progress events');
    this.subscribers.add(callback);
    console.log(`[ProgressPlugin] Total general subscribers: ${String(this.subscribers.size)}`);

    // Send latest event to new subscriber if available
    if (this.latestEvent) {
      console.log('[ProgressPlugin] Sending latest event to new subscriber:', this.latestEvent);
      callback(this.latestEvent);
    }

    return () => {
      console.log('[ProgressPlugin] Unsubscribing from general progress events');
      this.subscribers.delete(callback);
    };
  }

  subscribeUpload(callback: ProgressSubscriber): () => void {
    console.log('[ProgressPlugin] Subscribing to upload progress events');
    this.uploadSubscribers.add(callback);
    console.log(`[ProgressPlugin] Total upload subscribers: ${String(this.uploadSubscribers.size)}`);
    return () => {
      console.log('[ProgressPlugin] Unsubscribing from upload progress events');
      this.uploadSubscribers.delete(callback);
    };
  }

  subscribeDownload(callback: ProgressSubscriber): () => void {
    console.log('[ProgressPlugin] Subscribing to download progress events');
    this.downloadSubscribers.add(callback);
    console.log(`[ProgressPlugin] Total download subscribers: ${String(this.downloadSubscribers.size)}`);
    return () => {
      console.log('[ProgressPlugin] Unsubscribing from download progress events');
      this.downloadSubscribers.delete(callback);
    };
  }

  emit(event: ProgressEvent) {
    console.log(`[ProgressPlugin] Emitting ${event.phase} progress:`, {
      loaded: event.loaded,
      total: event.total,
      percentage: event.percentage.toFixed(2),
      phase: event.phase
    });
    this.latestEvent = event;

    // Emit to all general subscribers
    console.log(`[ProgressPlugin] Notifying ${String(this.subscribers.size)} general subscribers`);
    this.subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("Error in progress subscriber:", error);
      }
    });

    // Emit to phase-specific subscribers
    if (event.phase === "upload") {
      console.log(`[ProgressPlugin] Notifying ${String(this.uploadSubscribers.size)} upload subscribers`);
      this.uploadSubscribers.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error("Error in upload subscriber:", error);
        }
      });
    } else if (event.phase === "download") {
      console.log(`[ProgressPlugin] Notifying ${String(this.downloadSubscribers.size)} download subscribers`);
      this.downloadSubscribers.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error("Error in download subscriber:", error);
        }
      });
    }
  }

  getLatest(): ProgressEvent | null {
    return this.latestEvent;
  }

  clear() {
    this.subscribers.clear();
    this.uploadSubscribers.clear();
    this.downloadSubscribers.clear();
    this.latestEvent = null;
  }

  hasSubscribers(): boolean {
    return (
      this.subscribers.size > 0 ||
      this.uploadSubscribers.size > 0 ||
      this.downloadSubscribers.size > 0
    );
  }
}

// ============================================
// Progress Tracker with Subscription
// ============================================

class ProgressTracker {
  private uploadLoaded = 0;
  private uploadTotal = 0;
  private downloadLoaded = 0;
  private downloadTotal = 0;
  private subscription: ProgressSubscription;

  constructor(subscription: ProgressSubscription) {
    this.subscription = subscription;
  }

  updateUpload(loaded: number, total: number) {
    console.log(`[ProgressTracker] Upload progress update: ${String(loaded)}/${String(total)} bytes`);
    this.uploadLoaded = loaded;
    this.uploadTotal = total;

    const event: ProgressEvent = {
      loaded,
      total,
      percentage: total > 0 ? (loaded / total) * 100 : 0,
      phase: "upload",
      timestamp: Date.now(),
    };

    this.subscription.emit(event);
  }

  updateDownload(loaded: number, total: number) {
    console.log(`[ProgressTracker] Download progress update: ${String(loaded)}/${String(total)} bytes`);
    this.downloadLoaded = loaded;
    this.downloadTotal = total;

    const event: ProgressEvent = {
      loaded,
      total,
      percentage: total > 0 ? (loaded / total) * 100 : 0,
      phase: "download",
      timestamp: Date.now(),
    };

    this.subscription.emit(event);
  }

  updateProcessing(loaded: number, total: number) {
    const event: ProgressEvent = {
      loaded,
      total,
      percentage: total > 0 ? (loaded / total) * 100 : 0,
      phase: "processing",
      timestamp: Date.now(),
    };

    this.subscription.emit(event);
  }
}

// ============================================
// Stream Wrappers
// ============================================

async function createUploadProgressStream(
  body: BodyInit,
  tracker: ProgressTracker,
): Promise<ReadableStream<Uint8Array>> {
  console.log('[ProgressPlugin] Creating upload progress stream');
  let stream: ReadableStream<Uint8Array>;
  let total = 0;
  

  if (body instanceof ReadableStream) {
    console.log('[ProgressPlugin] Body is ReadableStream (size unknown)');
    stream = body as ReadableStream<Uint8Array>;
  } else if (body instanceof Blob) {
    total = body.size;
    console.log(`[ProgressPlugin] Body is Blob (size: ${String(total)} bytes)`);
    stream = body.stream();
  } else if (body instanceof ArrayBuffer) {
    total = body.byteLength;
    console.log(`[ProgressPlugin] Body is ArrayBuffer (size: ${String(total)} bytes)`);
    stream = new Blob([body]).stream();
  } else if (body instanceof FormData) {
    // FormData doesn't have a direct size property and can't be converted to Blob directly
    // We'll stream it without a known size
    console.log(`[ProgressPlugin] Body is FormData (size unknown)`);
    const response = new Response(body);
    const blob = await response.blob();
    total = blob.size;
    stream = blob.stream();
  } else if (typeof body === "string") {
    const blob = new Blob([body]);
    total = blob.size;
    console.log(`[ProgressPlugin] Body is string (size: ${String(total)} bytes)`);
    stream = blob.stream();
  } else if (body instanceof URLSearchParams) {
    const blob = new Blob([body.toString()]);
    total = blob.size;
    console.log(`[ProgressPlugin] Body is URLSearchParams (size: ${String(total)} bytes)`);
    stream = blob.stream();
  } else {
    const serialized = typeof body === 'object' ? JSON.stringify(body) : String(body);
    const blob = new Blob([serialized]);
    total = blob.size;
    console.log(`[ProgressPlugin] Body is unknown type (size: ${String(total)} bytes)`);
    stream = blob.stream();
  }

  let loaded = 0;
  const reader = stream.getReader();

  return new ReadableStream({
    async start(controller) {
      console.log('[ProgressPlugin] Starting upload stream read');
      try {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('[ProgressPlugin] Upload stream read complete');
            if (total > 0) {
              tracker.updateUpload(total, total);
            }
            controller.close();
            break;
          }

          loaded += value.byteLength;
          const actualTotal = total > 0 ? total : loaded;
          tracker.updateUpload(loaded, actualTotal);

          controller.enqueue(value);
        }
      } catch (error) {
        console.error('[ProgressPlugin] Error in upload stream:', error);
        controller.error(error);
        throw error;
      }
    },
    async cancel() {
      console.log('[ProgressPlugin] Upload stream cancelled');
      await reader.cancel();
    },
  });
}



export class ProgressPlugin<
  T extends {
    // Callback-based progress tracking (automatically subscribed)
    onProgress?: (event: ProgressEvent) => void;
    onUploadProgress?: (event: ProgressEvent) => void;
    onDownloadProgress?: (event: ProgressEvent) => void;

    // Subscription-based progress tracking (manual control)
    subscribeProgress?: (callback: ProgressSubscriber) => () => void;
    subscribeUploadProgress?: (callback: ProgressSubscriber) => () => void;
    subscribeDownloadProgress?: (callback: ProgressSubscriber) => () => void;
    
    [PROGRESS_TRACKER_SYMBOL]?: ProgressTracker;
    [PROGRESS_SUBSCRIPTION_SYMBOL]?: ProgressSubscription;
  },
> implements StandardLinkPlugin<T>
{
  // Order controls plugin loading order (higher = loads earlier)
  order = 100;

  init(link: StandardLinkOptions<T>): void {
    // Client interceptor: Intercept requests to add progress tracking
    link.clientInterceptors ??= [];
    link.clientInterceptors.push(async (options) => {
      const { context, request } = options;

      console.log('[ProgressPlugin] ===== Client Interceptor called =====');
      console.log('[ProgressPlugin] Context:', context);
      console.log('[ProgressPlugin] Request body:', request.body ? 'present' : 'none');

      // Check if we have any progress callbacks
      if (!context.onProgress && !context.onUploadProgress && !context.onDownloadProgress) {
        console.log('[ProgressPlugin] No progress callbacks, skipping');
        return await options.next(options);
      }

      // Create subscription and tracker for this request
      const subscription = new ProgressSubscription();
      const tracker = new ProgressTracker(subscription);
      const unsubscribers: (() => void)[] = [];

      if (context.onProgress) {
        console.log('[ProgressPlugin] Found onProgress callback, subscribing');
        unsubscribers.push(subscription.subscribe(context.onProgress));
      }
      if (context.onUploadProgress) {
        console.log('[ProgressPlugin] Found onUploadProgress callback, subscribing');
        unsubscribers.push(subscription.subscribeUpload(context.onUploadProgress));
      }
      if (context.onDownloadProgress) {
        console.log('[ProgressPlugin] Found onDownloadProgress callback, subscribing');
        unsubscribers.push(subscription.subscribeDownload(context.onDownloadProgress));
      }

      // Provide subscription functions for manual subscription
      if (context.subscribeProgress !== undefined) {
        context.subscribeProgress = (callback: ProgressSubscriber) => subscription.subscribe(callback);
      }
      if (context.subscribeUploadProgress !== undefined) {
        context.subscribeUploadProgress = (callback: ProgressSubscriber) => subscription.subscribeUpload(callback);
      }
      if (context.subscribeDownloadProgress !== undefined) {
        context.subscribeDownloadProgress = (callback: ProgressSubscriber) => subscription.subscribeDownload(callback);
      }

      // Store tracker in context
      context[PROGRESS_TRACKER_SYMBOL] = tracker;
      context[PROGRESS_SUBSCRIPTION_SYMBOL] = subscription;

      console.log('[ProgressPlugin] Wrapping request body and calling next');

      try {
        // Wrap request body if present
        let modifiedRequest = request;
        if (request.body) {
          console.log('[ProgressPlugin] Wrapping request body for upload progress');
          const progressStream = await createUploadProgressStream(request.body as BodyInit, tracker);
          modifiedRequest = {
            ...request,
            body: progressStream,
          };
        }

        // Call next with modified request
        return await options.next({
          ...options,
          request: modifiedRequest,
        });
      } finally {
        // Cleanup subscriptions
        console.log('[ProgressPlugin] Cleaning up subscriptions');
        unsubscribers.forEach((unsubscribe) => { unsubscribe() });
        subscription.clear();
        console.log('[ProgressPlugin] ===== Client Interceptor cleanup complete =====');
      }
    });
  }
}

export function createProgressPlugin() {
  return new ProgressPlugin();
}

const progressPluginDefault = {
  ProgressPlugin,
};

export default progressPluginDefault;
