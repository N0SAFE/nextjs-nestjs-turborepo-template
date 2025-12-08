/**
 * ORPC Streaming Generator
 *
 * Generates SSE (Server-Sent Events) utilities and streaming handlers
 * for real-time data communication in ORPC applications.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  ScriptSpec,
} from "../../../../types/generator.types";

@Injectable()
export class OrpcStreamingGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "orpc-streaming",
    priority: 27,
    version: "1.0.0",
    description: "SSE utilities and streaming handlers for ORPC",
    dependencies: ["orpc"],
    contributesTo: ["apps/api", "apps/web", "packages/contracts/api"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Streaming schemas
    files.push(
      this.file("packages/contracts/api/src/schemas/streaming.ts", this.getStreamingSchemas()),
    );

    // API streaming utilities
    if (this.hasPlugin(context, "nestjs")) {
      files.push(
        this.file("apps/api/src/lib/streaming/index.ts", this.getApiStreamingIndex()),
        this.file("apps/api/src/lib/streaming/sse-handler.ts", this.getSseHandler()),
        this.file("apps/api/src/lib/streaming/stream-utils.ts", this.getStreamUtils()),
        this.file("apps/api/src/lib/streaming/event-emitter.ts", this.getEventEmitter()),
        this.file("apps/api/src/lib/streaming/types.ts", this.getApiStreamingTypes()),
      );
    }

    // Web streaming utilities
    if (this.hasPlugin(context, "nextjs")) {
      files.push(
        this.file("apps/web/src/lib/streaming/index.ts", this.getWebStreamingIndex()),
        this.file("apps/web/src/lib/streaming/use-sse.ts", this.getUseSseHook()),
        this.file("apps/web/src/lib/streaming/use-stream.ts", this.getUseStreamHook()),
        this.file("apps/web/src/lib/streaming/event-source.ts", this.getEventSourceClient()),
        this.file("apps/web/src/lib/streaming/types.ts", this.getWebStreamingTypes()),
      );
    }

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // SSE is built into browsers and Node.js - no external deps needed
    return [];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [];
  }

  private getStreamingSchemas(): string {
    return `import { z } from "zod";

/**
 * Streaming Schemas
 *
 * Type definitions for SSE and streaming events
 */

/**
 * Base SSE event schema
 */
export const sseEventSchema = z.object({
  id: z.string().optional(),
  event: z.string().optional(),
  data: z.unknown(),
  retry: z.number().optional(),
});

export type SseEvent = z.infer<typeof sseEventSchema>;

/**
 * Typed SSE event schema factory
 */
export function createSseEventSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    id: z.string().optional(),
    event: z.string().optional(),
    data: dataSchema,
    retry: z.number().optional(),
  });
}

/**
 * Stream status schema
 */
export const streamStatusSchema = z.enum([
  "connecting",
  "open",
  "closed",
  "error",
  "reconnecting",
]);

export type StreamStatus = z.infer<typeof streamStatusSchema>;

/**
 * Stream connection options
 */
export const streamOptionsSchema = z.object({
  reconnect: z.boolean().default(true),
  reconnectInterval: z.number().default(3000),
  maxReconnectAttempts: z.number().default(5),
  withCredentials: z.boolean().default(true),
  headers: z.record(z.string()).optional(),
});

export type StreamOptions = z.infer<typeof streamOptionsSchema>;

/**
 * Progress event schema (for uploads/downloads)
 */
export const progressEventSchema = z.object({
  type: z.literal("progress"),
  loaded: z.number(),
  total: z.number().optional(),
  percent: z.number().min(0).max(100).optional(),
});

export type ProgressEvent = z.infer<typeof progressEventSchema>;

/**
 * Heartbeat event schema
 */
export const heartbeatEventSchema = z.object({
  type: z.literal("heartbeat"),
  timestamp: z.string().datetime(),
  connectionId: z.string().optional(),
});

export type HeartbeatEvent = z.infer<typeof heartbeatEventSchema>;

/**
 * Error event schema
 */
export const streamErrorEventSchema = z.object({
  type: z.literal("error"),
  code: z.string(),
  message: z.string(),
  recoverable: z.boolean().default(true),
});

export type StreamErrorEvent = z.infer<typeof streamErrorEventSchema>;

/**
 * Complete event schema
 */
export const streamCompleteEventSchema = z.object({
  type: z.literal("complete"),
  summary: z.record(z.unknown()).optional(),
});

export type StreamCompleteEvent = z.infer<typeof streamCompleteEventSchema>;

/**
 * Generic stream event union
 */
export const streamEventSchema = z.discriminatedUnion("type", [
  progressEventSchema,
  heartbeatEventSchema,
  streamErrorEventSchema,
  streamCompleteEventSchema,
  z.object({
    type: z.literal("data"),
    data: z.unknown(),
  }),
]);

export type StreamEvent = z.infer<typeof streamEventSchema>;
`;
  }

  private getApiStreamingIndex(): string {
    return `/**
 * API Streaming Module
 *
 * Server-side SSE and streaming utilities
 */
export * from "./sse-handler";
export * from "./stream-utils";
export * from "./event-emitter";
export * from "./types";
`;
  }

  private getSseHandler(): string {
    return `import type { Response } from "express";
import type { SseEvent, StreamEvent } from "./types";

/**
 * SSE Handler
 *
 * Manages Server-Sent Events connections
 */

export interface SseClient {
  id: string;
  response: Response;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export class SseHandler {
  private clients: Map<string, SseClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private options: { heartbeatMs?: number } = {}) {}

  /**
   * Initialize SSE response headers
   */
  initializeConnection(res: Response, clientId: string, userId?: string): SseClient {
    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    });

    // Create client
    const client: SseClient = {
      id: clientId,
      response: res,
      userId,
      createdAt: new Date(),
    };

    this.clients.set(clientId, client);

    // Handle client disconnect
    res.on("close", () => {
      this.removeClient(clientId);
    });

    // Start heartbeat if needed
    if (this.options.heartbeatMs && !this.heartbeatInterval) {
      this.startHeartbeat();
    }

    // Send initial connection event
    this.sendToClient(clientId, {
      event: "connected",
      data: { clientId, timestamp: new Date().toISOString() },
    });

    return client;
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId: string, event: SseEvent): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    try {
      const message = this.formatEvent(event);
      client.response.write(message);
      return true;
    } catch (error) {
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Send event to all clients
   */
  broadcast(event: SseEvent): number {
    let sent = 0;
    for (const [clientId] of this.clients) {
      if (this.sendToClient(clientId, event)) {
        sent++;
      }
    }
    return sent;
  }

  /**
   * Send event to clients matching a filter
   */
  sendToMatching(
    event: SseEvent,
    filter: (client: SseClient) => boolean
  ): number {
    let sent = 0;
    for (const [clientId, client] of this.clients) {
      if (filter(client) && this.sendToClient(clientId, event)) {
        sent++;
      }
    }
    return sent;
  }

  /**
   * Send event to all clients of a specific user
   */
  sendToUser(userId: string, event: SseEvent): number {
    return this.sendToMatching(event, (client) => client.userId === userId);
  }

  /**
   * Format SSE event
   */
  private formatEvent(event: SseEvent): string {
    const lines: string[] = [];

    if (event.id) {
      lines.push(\`id: \${event.id}\`);
    }

    if (event.event) {
      lines.push(\`event: \${event.event}\`);
    }

    if (event.retry) {
      lines.push(\`retry: \${event.retry}\`);
    }

    // Data must be serialized
    const data = typeof event.data === "string" 
      ? event.data 
      : JSON.stringify(event.data);
    
    // Split data by newlines and prefix each line
    const dataLines = data.split("\\n");
    for (const line of dataLines) {
      lines.push(\`data: \${line}\`);
    }

    // SSE requires double newline to end message
    return lines.join("\\n") + "\\n\\n";
  }

  /**
   * Remove client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.response.end();
      } catch {
        // Client may already be disconnected
      }
      this.clients.delete(clientId);
    }

    // Stop heartbeat if no clients
    if (this.clients.size === 0 && this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get connected clients count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get client by ID
   */
  getClient(clientId: string): SseClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        event: "heartbeat",
        data: { timestamp: new Date().toISOString() },
      });
    }, this.options.heartbeatMs || 30000);
  }

  /**
   * Cleanup all connections
   */
  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const [clientId] of this.clients) {
      this.removeClient(clientId);
    }
  }
}

/**
 * Create SSE handler instance
 */
export function createSseHandler(options?: { heartbeatMs?: number }): SseHandler {
  return new SseHandler(options);
}

/**
 * Global SSE handler instance
 */
export const globalSseHandler = createSseHandler({ heartbeatMs: 30000 });
`;
  }

  private getStreamUtils(): string {
    return `/**
 * Stream Utilities
 *
 * Helper functions for working with streams
 */

/**
 * Create an async iterator from a stream
 */
export async function* streamToAsyncIterator<T>(
  stream: ReadableStream<T>
): AsyncIterableIterator<T> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Create a readable stream from an async iterator
 */
export function asyncIteratorToStream<T>(
  iterator: AsyncIterable<T>
): ReadableStream<T> {
  return new ReadableStream<T>({
    async pull(controller) {
      for await (const value of iterator) {
        controller.enqueue(value);
      }
      controller.close();
    },
  });
}

/**
 * Transform stream data
 */
export function transformStream<T, U>(
  stream: ReadableStream<T>,
  transformer: (chunk: T) => U | Promise<U>
): ReadableStream<U> {
  const reader = stream.getReader();
  
  return new ReadableStream<U>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      const transformed = await transformer(value);
      controller.enqueue(transformed);
    },
    cancel() {
      reader.cancel();
    },
  });
}

/**
 * Create a text encoder stream for SSE
 */
export function createSseEncoderStream(): TransformStream<unknown, Uint8Array> {
  const encoder = new TextEncoder();
  
  return new TransformStream({
    transform(chunk, controller) {
      const data = typeof chunk === "string" ? chunk : JSON.stringify(chunk);
      const message = \`data: \${data}\\n\\n\`;
      controller.enqueue(encoder.encode(message));
    },
  });
}

/**
 * Batch stream chunks
 */
export function batchStream<T>(
  stream: ReadableStream<T>,
  size: number,
  timeoutMs?: number
): ReadableStream<T[]> {
  let batch: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return new ReadableStream<T[]>({
    async start(controller) {
      const reader = stream.getReader();

      const flush = () => {
        if (batch.length > 0) {
          controller.enqueue([...batch]);
          batch = [];
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            flush();
            controller.close();
            break;
          }

          batch.push(value);

          if (batch.length >= size) {
            flush();
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
          } else if (timeoutMs && !timeoutId) {
            timeoutId = setTimeout(() => {
              flush();
              timeoutId = null;
            }, timeoutMs);
          }
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reader.releaseLock();
      }
    },
  });
}

/**
 * Create a progress tracking stream
 */
export function createProgressStream(
  total: number,
  onProgress: (progress: { loaded: number; total: number; percent: number }) => void
): TransformStream<Uint8Array, Uint8Array> {
  let loaded = 0;

  return new TransformStream({
    transform(chunk, controller) {
      loaded += chunk.length;
      const percent = Math.round((loaded / total) * 100);
      onProgress({ loaded, total, percent });
      controller.enqueue(chunk);
    },
  });
}

/**
 * Create a debounced stream
 */
export function debounceStream<T>(
  stream: ReadableStream<T>,
  delayMs: number
): ReadableStream<T> {
  let lastValue: T | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return new ReadableStream<T>({
    async start(controller) {
      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (lastValue !== undefined) {
              controller.enqueue(lastValue);
            }
            controller.close();
            break;
          }

          lastValue = value;

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          timeoutId = setTimeout(() => {
            if (lastValue !== undefined) {
              controller.enqueue(lastValue);
              lastValue = undefined;
            }
          }, delayMs);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reader.releaseLock();
      }
    },
  });
}
`;
  }

  private getEventEmitter(): string {
    return `/**
 * Event Emitter
 *
 * Type-safe event emitter for streaming events
 */

type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

export class TypedEventEmitter<TEvents extends Record<string, unknown>> {
  private handlers: Map<keyof TEvents, Set<EventHandler>> = new Map();

  /**
   * Subscribe to an event
   */
  on<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event once
   */
  once<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): () => void {
    const wrapper: EventHandler<TEvents[K]> = (data) => {
      this.off(event, wrapper);
      return handler(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    this.handlers.get(event)?.delete(handler as EventHandler);
  }

  /**
   * Emit an event
   */
  async emit<K extends keyof TEvents>(event: K, data: TEvents[K]): Promise<void> {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;

    const promises = Array.from(eventHandlers).map((handler) =>
      Promise.resolve(handler(data))
    );

    await Promise.all(promises);
  }

  /**
   * Emit event synchronously (for performance-critical paths)
   */
  emitSync<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;

    for (const handler of eventHandlers) {
      handler(data);
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount<K extends keyof TEvents>(event: K): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  /**
   * Remove all listeners
   */
  removeAllListeners<K extends keyof TEvents>(event?: K): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Create an async iterator for an event
   */
  async *subscribe<K extends keyof TEvents>(
    event: K,
    options?: { signal?: AbortSignal }
  ): AsyncIterableIterator<TEvents[K]> {
    const queue: TEvents[K][] = [];
    let resolve: (() => void) | null = null;
    let done = false;

    const handler: EventHandler<TEvents[K]> = (data) => {
      queue.push(data);
      if (resolve) {
        resolve();
        resolve = null;
      }
    };

    this.on(event, handler);

    const cleanup = () => {
      done = true;
      this.off(event, handler);
      if (resolve) resolve();
    };

    options?.signal?.addEventListener("abort", cleanup);

    try {
      while (!done) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          await new Promise<void>((r) => {
            resolve = r;
          });
        }
      }
    } finally {
      cleanup();
    }
  }
}

/**
 * Create a typed event emitter
 */
export function createEventEmitter<TEvents extends Record<string, unknown>>() {
  return new TypedEventEmitter<TEvents>();
}
`;
  }

  private getApiStreamingTypes(): string {
    return `/**
 * API Streaming Types
 */

export interface SseEvent<T = unknown> {
  id?: string;
  event?: string;
  data: T;
  retry?: number;
}

export interface StreamEvent {
  type: "data" | "progress" | "heartbeat" | "error" | "complete";
  data?: unknown;
  error?: string;
  progress?: {
    loaded: number;
    total?: number;
    percent?: number;
  };
}

export interface StreamingOptions {
  heartbeatMs?: number;
  bufferSize?: number;
  timeout?: number;
}
`;
  }

  private getWebStreamingIndex(): string {
    return `/**
 * Web Streaming Module
 *
 * Client-side SSE and streaming utilities
 */
export * from "./use-sse";
export * from "./use-stream";
export * from "./event-source";
export * from "./types";
`;
  }

  private getUseSseHook(): string {
    return `"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SseEvent, StreamStatus, StreamOptions } from "./types";

/**
 * SSE Hook Options
 */
interface UseSseOptions<T> extends Partial<StreamOptions> {
  onMessage?: (event: SseEvent<T>) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  enabled?: boolean;
  eventTypes?: string[];
}

/**
 * SSE Hook Return Type
 */
interface UseSseReturn<T> {
  data: T | null;
  status: StreamStatus;
  error: Error | null;
  events: SseEvent<T>[];
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Hook for consuming Server-Sent Events
 */
export function useSse<T = unknown>(
  url: string,
  options: UseSseOptions<T> = {}
): UseSseReturn<T> {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    enabled = true,
    reconnect: shouldReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    withCredentials = true,
    eventTypes = [],
  } = options;

  const [status, setStatus] = useState<StreamStatus>("closed");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [events, setEvents] = useState<SseEvent<T>[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus("closed");
    onClose?.();
  }, [clearReconnectTimeout, onClose]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      disconnect();
    }

    setStatus("connecting");
    setError(null);

    const eventSource = new EventSource(url, { withCredentials });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStatus("open");
      reconnectAttemptsRef.current = 0;
      onOpen?.();
    };

    eventSource.onerror = (e) => {
      const err = new Error("SSE connection error");
      setError(err);
      onError?.(err);

      if (
        shouldReconnect &&
        reconnectAttemptsRef.current < maxReconnectAttempts
      ) {
        setStatus("reconnecting");
        reconnectAttemptsRef.current++;

        clearReconnectTimeout();
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      } else {
        setStatus("error");
        disconnect();
      }
    };

    // Default message handler
    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as T;
        const sseEvent: SseEvent<T> = {
          id: e.lastEventId,
          data: parsed,
        };

        setData(parsed);
        setEvents((prev) => [...prev.slice(-99), sseEvent]);
        onMessage?.(sseEvent);
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    // Custom event type handlers
    eventTypes.forEach((eventType) => {
      eventSource.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data) as T;
          const sseEvent: SseEvent<T> = {
            id: e.lastEventId,
            event: eventType,
            data: parsed,
          };

          setData(parsed);
          setEvents((prev) => [...prev.slice(-99), sseEvent]);
          onMessage?.(sseEvent);
        } catch (err) {
          console.error(\`Failed to parse SSE \${eventType} message:\`, err);
        }
      });
    });
  }, [
    url,
    withCredentials,
    shouldReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    eventTypes,
    onMessage,
    onError,
    onOpen,
    disconnect,
    clearReconnectTimeout,
  ]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    connect();
  }, [connect, disconnect]);

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    data,
    status,
    error,
    events,
    connect,
    disconnect,
    reconnect,
  };
}
`;
  }

  private getUseStreamHook(): string {
    return `"use client";

import { useCallback, useRef, useState } from "react";
import type { StreamStatus, StreamEvent } from "./types";

/**
 * Stream Hook Options
 */
interface UseStreamOptions<T> {
  onChunk?: (chunk: T) => void;
  onComplete?: (chunks: T[]) => void;
  onError?: (error: Error) => void;
  transform?: (text: string) => T;
}

/**
 * Stream Hook Return Type
 */
interface UseStreamReturn<T> {
  data: T[];
  status: StreamStatus;
  error: Error | null;
  progress: number;
  start: (url: string, init?: RequestInit) => Promise<void>;
  abort: () => void;
  reset: () => void;
}

/**
 * Hook for consuming streaming responses (like fetch with ReadableStream)
 */
export function useStream<T = string>(
  options: UseStreamOptions<T> = {}
): UseStreamReturn<T> {
  const {
    onChunk,
    onComplete,
    onError,
    transform = (text) => text as unknown as T,
  } = options;

  const [status, setStatus] = useState<StreamStatus>("closed");
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStatus("closed");
  }, []);

  const reset = useCallback(() => {
    abort();
    setData([]);
    setError(null);
    setProgress(0);
  }, [abort]);

  const start = useCallback(
    async (url: string, init?: RequestInit) => {
      reset();
      setStatus("connecting");

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        setStatus("open");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const chunks: T[] = [];
        let totalBytes = 0;
        const contentLength = response.headers.get("content-length");
        const totalLength = contentLength ? parseInt(contentLength, 10) : 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setStatus("closed");
            onComplete?.(chunks);
            break;
          }

          totalBytes += value.length;
          if (totalLength) {
            setProgress(Math.round((totalBytes / totalLength) * 100));
          }

          const text = decoder.decode(value, { stream: true });
          const transformed = transform(text);

          chunks.push(transformed);
          setData((prev) => [...prev, transformed]);
          onChunk?.(transformed);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("closed");
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus("error");
        onError?.(error);
      }
    },
    [transform, onChunk, onComplete, onError, reset]
  );

  return {
    data,
    status,
    error,
    progress,
    start,
    abort,
    reset,
  };
}

/**
 * Hook for streaming JSON lines (NDJSON)
 */
export function useJsonStream<T = unknown>(
  options: Omit<UseStreamOptions<T>, "transform"> = {}
) {
  const buffer = useRef("");

  const transform = (text: string): T[] => {
    buffer.current += text;
    const lines = buffer.current.split("\\n");
    buffer.current = lines.pop() || "";

    return lines
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line) as T;
        } catch {
          return null;
        }
      })
      .filter((item): item is T => item !== null);
  };

  return useStream<T[]>({
    ...options,
    transform,
    onChunk: (chunks) => {
      chunks.forEach((chunk) => options.onChunk?.(chunk as unknown as T[]));
    },
  });
}
`;
  }

  private getEventSourceClient(): string {
    return `/**
 * Event Source Client
 *
 * Enhanced EventSource wrapper with reconnection and authentication
 */

import type { StreamOptions, SseEvent } from "./types";

export interface EventSourceClientOptions extends StreamOptions {
  onMessage?: (event: SseEvent) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export class EventSourceClient {
  private eventSource: EventSource | null = null;
  private url: string;
  private options: EventSourceClientOptions;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(url: string, options: EventSourceClientOptions = {}) {
    this.url = url;
    this.options = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      withCredentials: true,
      ...options,
    };
  }

  /**
   * Connect to the SSE endpoint
   */
  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    // Add authorization header if provided
    let url = this.url;
    if (this.options.headers?.Authorization) {
      // EventSource doesn't support custom headers natively
      // Pass token as query parameter if needed
      const token = this.options.headers.Authorization.replace("Bearer ", "");
      url = \`\${this.url}\${this.url.includes("?") ? "&" : "?"}token=\${token}\`;
    }

    this.eventSource = new EventSource(url, {
      withCredentials: this.options.withCredentials,
    });

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
      this.options.onOpen?.();
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.options.onMessage?.({
          id: event.lastEventId,
          data,
        });
      } catch {
        this.options.onMessage?.({
          id: event.lastEventId,
          data: event.data,
        });
      }
    };

    this.eventSource.onerror = () => {
      const error = new Error("EventSource connection error");
      this.options.onError?.(error);

      if (this.shouldReconnect()) {
        this.scheduleReconnect();
      } else {
        this.disconnect();
      }
    };
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.options.onClose?.();
  }

  /**
   * Add event listener for specific event type
   */
  addEventListener(type: string, handler: (event: MessageEvent) => void): void {
    this.eventSource?.addEventListener(type, handler);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: string, handler: (event: MessageEvent) => void): void {
    this.eventSource?.removeEventListener(type, handler);
  }

  /**
   * Check if should attempt reconnection
   */
  private shouldReconnect(): boolean {
    return (
      this.options.reconnect === true &&
      this.reconnectAttempts < (this.options.maxReconnectAttempts ?? 5)
    );
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval ?? 3000);
  }

  /**
   * Get connection state
   */
  get readyState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED;
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

/**
 * Create event source client
 */
export function createEventSourceClient(
  url: string,
  options?: EventSourceClientOptions
): EventSourceClient {
  return new EventSourceClient(url, options);
}
`;
  }

  private getWebStreamingTypes(): string {
    return `/**
 * Web Streaming Types
 */

export interface SseEvent<T = unknown> {
  id?: string;
  event?: string;
  data: T;
  retry?: number;
}

export type StreamStatus =
  | "connecting"
  | "open"
  | "closed"
  | "error"
  | "reconnecting";

export interface StreamOptions {
  reconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  withCredentials: boolean;
  headers?: Record<string, string>;
}

export interface StreamEvent {
  type: "data" | "progress" | "heartbeat" | "error" | "complete";
  data?: unknown;
  error?: string;
  progress?: {
    loaded: number;
    total?: number;
    percent?: number;
  };
}
`;
  }
}
