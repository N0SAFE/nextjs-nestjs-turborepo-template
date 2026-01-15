/**
 * Custom OpenAPILink that intercepts file uploads and uses XMLHttpRequest for progress tracking
 * 
 * This is the correct architectural approach for ORPC - modifying the link layer
 * rather than wrapping the client, since createTanstackQueryUtils directly accesses
 * the underlying client properties and bypasses any client-level Proxy wrappers.
 * 
 * Uses Web Workers to handle uploads in background thread with streaming response support.
 */

import { OpenAPILink } from "@orpc/openapi-client/fetch";
import type { ContractRouter, Meta } from "@orpc/contract";
import type { ClientContext, NestedClient, Client } from "@orpc/client";

/**
 * Progress event for file uploads
 */
export interface FileUploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
  progress: number; // alias for percentage
}

/**
 * Context extension for file upload routes
 * This is merged with the existing ORPC context type
 */
export interface FileUploadContext {
  onProgress?: (event: FileUploadProgressEvent) => void;
}

/**
 * Upload tracking registry
 */
interface ActiveUpload {
  id: string;
  endpoint: string;
  fileName: string;
  fileSize: number;
  progress: {
    loaded: number;
    total: number;
    percentage: number;
  };
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  error?: string;
}

class UploadRegistry {
  private uploads = new Map<string, ActiveUpload>();
  private listeners = new Set<(uploads: ActiveUpload[]) => void>();

  addUpload(upload: ActiveUpload) {
    this.uploads.set(upload.id, upload);
    this.notify();
  }

  updateUpload(id: string, updates: Partial<ActiveUpload>) {
    const upload = this.uploads.get(id);
    if (upload) {
      Object.assign(upload, updates);
      this.notify();
    }
  }

  removeUpload(id: string) {
    this.uploads.delete(id);
    this.notify();
  }

  getUpload(id: string): ActiveUpload | undefined {
    return this.uploads.get(id);
  }

  getAllUploads(): ActiveUpload[] {
    return Array.from(this.uploads.values());
  }

  getActiveUploads(): ActiveUpload[] {
    return this.getAllUploads().filter(u => u.status === 'uploading' || u.status === 'pending');
  }

  subscribe(listener: (uploads: ActiveUpload[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const uploads = this.getAllUploads();
    this.listeners.forEach(listener => {listener(uploads)});
  }
}

// Global upload registry
export const uploadRegistry = new UploadRegistry();

/**
 * Creates a Web Worker that handles file uploads with XMLHttpRequest
 * Supports progress tracking and streaming response via MessageChannel
 */
function createUploadWorker(): Worker {
  const workerCode = `
    // Store active XHR requests for tracking/cancellation
    const activeRequests = new Map();
    
    self.addEventListener('message', function(e) {
      const { type, uploadId, input, endpoint, port } = e.data;
      
      if (type === 'upload') {
        handleUpload(uploadId, input, endpoint, port);
      } else if (type === 'cancel') {
        cancelUpload(uploadId);
      } else if (type === 'getActive') {
        self.postMessage({
          type: 'activeList',
          uploads: Array.from(activeRequests.keys())
        });
      }
    });
    
    function handleUpload(uploadId, input, endpoint, port) {
      const xhr = new XMLHttpRequest();
      activeRequests.set(uploadId, xhr);
      
      // Track upload progress
      xhr.upload.addEventListener('progress', function(event) {
        if (event.lengthComputable) {
          const progress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          
          // Send via main message
          self.postMessage({
            type: 'progress',
            uploadId,
            progress
          });
        }
      });
      
      // Handle completion - stream response chunks
      xhr.addEventListener('load', function() {
        activeRequests.delete(uploadId);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          // Get response as ArrayBuffer
          const responseBuffer = xhr.response;
          const contentType = xhr.getResponseHeader('Content-Type') || 'application/json';
          
          // Send response metadata
          self.postMessage({
            type: 'responseStart',
            uploadId,
            status: xhr.status,
            statusText: xhr.statusText,
            contentType
          });
          
          // Stream response data via MessageChannel port
          if (port && responseBuffer) {
            port.postMessage({
              type: 'chunk',
              data: responseBuffer
            }, [responseBuffer]); // Transfer ownership
          }
          
          // Signal completion
          self.postMessage({
            type: 'complete',
            uploadId
          });
          
          if (port) {
            port.postMessage({ type: 'done' });
          }
        } else {
          // Handle error
          let errorMessage = \`HTTP \${xhr.status}: \${xhr.statusText}\`;
          try {
            if (xhr.responseText) {
              const errorData = JSON.parse(xhr.responseText);
              errorMessage = errorData.message || errorMessage;
            }
          } catch {}
          
          self.postMessage({
            type: 'error',
            uploadId,
            error: errorMessage
          });
          
          if (port) {
            port.postMessage({
              type: 'error',
              error: errorMessage
            });
          }
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', function() {
        activeRequests.delete(uploadId);
        const error = 'Network error';
        
        self.postMessage({
          type: 'error',
          uploadId,
          error
        });
        
        if (port) {
          port.postMessage({ type: 'error', error });
        }
      });
      
      xhr.addEventListener('abort', function() {
        activeRequests.delete(uploadId);
        const error = 'Upload aborted';
        
        self.postMessage({
          type: 'error',
          uploadId,
          error
        });
        
        if (port) {
          port.postMessage({ type: 'error', error });
        }
      });
      
      // Open connection
      xhr.open('POST', endpoint, true);
      xhr.responseType = 'arraybuffer';
      
      // Build FormData
      const formData = new FormData();
      for (const [key, value] of Object.entries(input)) {
        // Check for File/Blob by duck-typing (constructor not available in worker)
        if (value && typeof value === 'object' && (value.constructor.name === 'File' || value.constructor.name === 'Blob')) {
          formData.append(key, value);
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
      
      // Set credentials
      xhr.withCredentials = true;
      
      // Send request
      self.postMessage({
        type: 'started',
        uploadId
      });
      
      xhr.send(formData);
    }
    
    function cancelUpload(uploadId) {
      const xhr = activeRequests.get(uploadId);
      if (xhr) {
        xhr.abort();
        activeRequests.delete(uploadId);
      }
    }
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  return new Worker(workerUrl);
}

// Shared worker instance (singleton)
let sharedWorker: Worker | null = null;

function getUploadWorker(): Worker {
  sharedWorker ??= createUploadWorker();
  return sharedWorker;
}

/**
 * Upload using Web Worker with XMLHttpRequest for progress tracking
 * Returns a Response with streaming body created from MessageChannel
 */
function uploadWithWorker(
  input: Record<string, unknown>,
  endpoint: string,
  onProgress?: (event: { loaded: number; total: number; percentage: number }) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const worker = getUploadWorker();
    const uploadId = `upload_${String(Date.now())}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Extract file info for tracking
    let fileName = 'unknown';
    let fileSize = 0;
    for (const value of Object.values(input)) {
      if (value instanceof File) {
        fileName = value.name;
        fileSize = value.size;
        break;
      }
    }

    // Add to registry
    uploadRegistry.addUpload({
      id: uploadId,
      endpoint,
      fileName,
      fileSize,
      progress: { loaded: 0, total: fileSize, percentage: 0 },
      status: 'pending',
      startTime: Date.now()
    });

    // Create MessageChannel for streaming response
    const channel = new MessageChannel();
    let responseMetadata: { status: number; statusText: string; contentType: string } | null = null;

    // Create ReadableStream controlled by worker messages
    const stream = new ReadableStream({
      start(controller) {
        channel.port1.onmessage = (e: MessageEvent<{
          type: string; 
          data: ArrayBuffer;
          error?: string;
        }>) => {
          const { type, data, error } = e.data;

          if (type === 'chunk') {
            // Enqueue chunk from worker
            controller.enqueue(new Uint8Array(data));
          } else if (type === 'done') {
            // Close stream
            controller.close();
            channel.port1.close();
          } else if (type === 'error') {
            // Error in stream
            controller.error(new Error(error));
            channel.port1.close();
          }
        };
      },
      cancel() {
        // Cancel upload if stream is cancelled
        worker.postMessage({ type: 'cancel', uploadId });
        channel.port1.close();
        uploadRegistry.updateUpload(uploadId, {
          status: 'failed',
          error: 'Cancelled by user',
          endTime: Date.now()
        });
      }
    });

    // Listen to worker messages
    const messageHandler = (e: MessageEvent<{
      type: string;
      uploadId: string;
      progress: { loaded: number; total: number; percentage: number };
      status: number;
      statusText: string;
      contentType: string;
      error: string;
    }>) => {
      const { type, uploadId: msgUploadId, progress, status, statusText, contentType, error } = e.data;

      // Only handle messages for this upload
      if (msgUploadId !== uploadId) return;

      if (type === 'started') {
        uploadRegistry.updateUpload(uploadId, { status: 'uploading' });
      } else if (type === 'progress') {
        uploadRegistry.updateUpload(uploadId, { progress });
        if (onProgress) {
          console.log(`[FileUploadLink] Upload progress: ${String(progress.percentage)}%`);
          onProgress(progress);
        }
      } else if (type === 'responseStart') {
        // Store response metadata
        responseMetadata = { status, statusText, contentType };
      } else if (type === 'complete') {
        console.log('[FileUploadLink] Upload completed successfully');
        uploadRegistry.updateUpload(uploadId, {
          status: 'completed',
          endTime: Date.now(),
          progress: { loaded: fileSize, total: fileSize, percentage: 100 }
        });

        // Resolve with Response containing the stream
        if (responseMetadata) {
          resolve(new Response(stream, {
            status: responseMetadata.status,
            statusText: responseMetadata.statusText,
            headers: { 'Content-Type': responseMetadata.contentType }
          }));
        } else {
          resolve(new Response(stream));
        }

        // Cleanup listener
        worker.removeEventListener('message', messageHandler);
      } else if (type === 'error') {
        console.error('[FileUploadLink] Upload failed:', error);
        uploadRegistry.updateUpload(uploadId, {
          status: 'failed',
          error,
          endTime: Date.now()
        });

        reject(new Error(error));
        worker.removeEventListener('message', messageHandler);
      }
    };

    worker.addEventListener('message', messageHandler);

    // Start upload (transfer port2 to worker)
    worker.postMessage({
      type: 'upload',
      uploadId,
      input,
      endpoint,
      port: channel.port2
    }, [channel.port2]);
  });
}

/**
 * Check if input contains File objects
 */
function containsFile(input: unknown): boolean {
  if (!input || typeof input !== 'object') return false;

  if (input instanceof File) return true;

  if (Array.isArray(input)) {
    return input.some(item => containsFile(item));
  }

  return Object.values(input).some(value => containsFile(value));
}

/**
 * Type-level detection of File in TypeScript types
 * Returns true if the type contains File at any level
 * Note: This checks the INFERRED TypeScript type, not the Zod schema
 */
type HasFileInType<T> = T extends File
  ? true
  : T extends (infer Element)[]
    ? HasFileInType<Element>
    : T extends object
      ? keyof T extends never
        ? false // Empty object has no keys, no File
        : true extends { [K in keyof T]: HasFileInType<T[K]> }[keyof T]
          ? true
          : false
      : false;

/**
 * Transform a client type to extend context with FileUploadContext ONLY for routes with files
 * Routes without files will NOT have FileUploadContext in their type
 */
export type WithFileUploadsClient<T extends NestedClient<ClientContext>> = 
  T extends Client<infer UContext, infer UInput, infer UOutput, infer UError>
    ? HasFileInType<UInput> extends true
      ? Client<UContext & FileUploadContext, UInput, UOutput, UError>
      : Client<UContext, UInput, UOutput, UError>
    : {
        [K in keyof T]: T[K] extends NestedClient<ClientContext> 
          ? WithFileUploadsClient<T[K]>
          : T[K]
      }

/**
 * Custom OpenAPILink that handles file uploads with progress tracking
 */
export class FileUploadOpenAPILink<TContext extends ClientContext> extends OpenAPILink<TContext> {
  constructor(
    contract: ContractRouter<Meta>,
    options: ConstructorParameters<typeof OpenAPILink<TContext>>[1]
  ) {
    // Store original fetch function
    const originalFetch = options.fetch;

    // Create wrapped fetch function
    const wrappedFetch: typeof originalFetch = async (request, init, linkOptions, path, input) => {
      // Check if this is a multipart/form-data request (file upload)
      // Note: init is { redirect?: RequestRedirect }, not full RequestInit
      // Content-Type detection needs to be done via Request object or options
      const requestUrl = typeof request === 'string' ? request : request.url;
      
      // Check if input contains File objects (indicates file upload)
      const isFileUpload = containsFile(input);

      // Get onProgress callback from context
      const onProgress = linkOptions.context.onProgress as ((event: { loaded: number; total: number; percentage: number }) => void) | undefined;

      // Only use XMLHttpRequest if:
      // 1. It's a file upload (multipart/form-data)
      // 2. We have an onProgress callback
      // 3. We're in the browser (not SSR)
      if (isFileUpload && onProgress && typeof window !== 'undefined') {
        console.log('[FileUploadLink] Intercepted file upload, using XMLHttpRequest for progress');

        try {
          // Input already contains the data with File objects
          const inputData = input as Record<string, unknown>;

          // Use Web Worker with XMLHttpRequest for upload with progress
          // uploadWithWorker returns a Response with streaming body from MessageChannel
          const response = await uploadWithWorker(inputData, requestUrl, onProgress);
            
          // Return the streamed Response directly
          return response;
        } catch (error) {
          console.error('[FileUploadLink] Error during XHR upload:', error);
          // Fall through to regular fetch on error
        }
      }

      // Use regular fetch for non-file uploads or if XHR failed
      if (originalFetch) {
        return originalFetch(request, init, linkOptions, path, input);
      }

      // Fallback to standard fetch (shouldn't happen with OpenAPILink)
      return fetch(request, init as RequestInit);
    };

    // Call parent constructor with wrapped fetch
    super(contract, {
      ...options,
      fetch: wrappedFetch
    });
  }
}
