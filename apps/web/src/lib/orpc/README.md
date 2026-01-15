# ORPC Client with File Upload Enhancement

This directory contains the ORPC client configuration and utilities for the web application.

## Files

- `index.ts` - Main ORPC client setup with plugins and TanStack Query integration
- `withFileUploads.ts` - Wrapper to enhance ORPC client with automatic Web Worker-based file uploads
- `plugins/` - Custom ORPC plugins for cookies, authentication, context, etc.

## withFileUploads - Automatic File Upload Enhancement

The `withFileUploads` wrapper automatically detects ORPC routes that accept file inputs and enhances them to use Web Worker-based XMLHttpRequest uploads with progress tracking.

### Features

- **Automatic Detection**: Scans ORPC contract routes for `z.file()` inputs
- **Web Worker Uploads**: Non-blocking file uploads using XMLHttpRequest in background thread
- **Progress Tracking**: Real-time upload progress with `onProgress` callback
- **Error Handling**: Automatic toast notifications for success/failure
- **Abort Support**: Can cancel uploads via AbortSignal
- **Type-Safe**: Maintains full TypeScript type safety

### Basic Usage

```typescript
import { orpc } from '@/lib/orpc'
import { withFileUploads } from '@/lib/orpc/withFileUploads'

// Wrap the ORPC client
const orpcWithUploads = withFileUploads(orpc)

// Now use file upload routes directly
const result = await orpcWithUploads.storage.uploadImage(file, {
  onProgress: (event) => {
    console.log(`Upload progress: ${event.percentage}%`)
  },
  onSuccess: (data) => {
    console.log('Upload successful:', data)
  },
  onError: (error) => {
    console.error('Upload failed:', error)
  }
})
```

### React Hook Usage

```typescript
import { orpc } from '@/lib/orpc'
import { useFileUploadRoutes } from '@/lib/orpc/withFileUploads'

function MyComponent() {
  const orpcWithUploads = useFileUploadRoutes(orpc)
  const [progress, setProgress] = useState(0)
  
  const handleUpload = async (file: File) => {
    try {
      const result = await orpcWithUploads.storage.uploadImage(file, {
        onProgress: (e) => setProgress(e.percentage)
      })
      console.log('Uploaded:', result)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }
  
  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {progress > 0 && <progress value={progress} max={100} />}
    </div>
  )
}
```

### Advanced Usage with Abort Controller

```typescript
const orpcWithUploads = withFileUploads(orpc)
const abortController = new AbortController()

// Start upload with ability to cancel
const uploadPromise = orpcWithUploads.storage.uploadVideo(videoFile, {
  signal: abortController.signal,
  onProgress: (e) => console.log(`Uploading: ${e.percentage}%`)
})

// Cancel upload if needed
abortController.abort()
```

### Complete Example Component

```typescript
'use client'

import { useState } from 'react'
import { orpc } from '@/lib/orpc'
import { withFileUploads, type FileUploadProgressEvent } from '@/lib/orpc/withFileUploads'
import { Button } from '@repo/ui/button'
import { Progress } from '@repo/ui/progress'

export function FileUploadExample() {
  const orpcWithUploads = withFileUploads(orpc)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    setProgress(0)
    setResult(null)
    
    const controller = new AbortController()
    setAbortController(controller)
    
    try {
      const data = await orpcWithUploads.storage.uploadImage(file, {
        signal: controller.signal,
        onProgress: (e: FileUploadProgressEvent) => {
          setProgress(e.percentage)
        },
        onSuccess: (data: any) => {
          setResult(data)
        }
      })
      
      console.log('Upload complete:', data)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
      setAbortController(null)
    }
  }
  
  const handleCancel = () => {
    abortController?.abort()
  }
  
  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        disabled={uploading}
      />
      
      <div className="flex gap-2">
        <Button onClick={handleUpload} disabled={!file || uploading}>
          Upload
        </Button>
        
        {uploading && (
          <Button onClick={handleCancel} variant="destructive">
            Cancel
          </Button>
        )}
      </div>
      
      {uploading && (
        <div>
          <p>Progress: {progress.toFixed(1)}%</p>
          <Progress value={progress} />
        </div>
      )}
      
      {result && (
        <div className="p-4 bg-green-50 rounded">
          <p>✅ Upload successful!</p>
          <p>Filename: {result.filename}</p>
          <p>Size: {(result.size / 1024).toFixed(2)} KB</p>
        </div>
      )}
    </div>
  )
}
```

### How It Works

1. **Detection**: The wrapper uses a Proxy to intercept property access on the ORPC client
2. **Analysis**: For each route, it checks if the contract's input schema contains a `file` field
3. **Wrapping**: Routes with file inputs are wrapped with a Web Worker-based upload function
4. **Passthrough**: Routes without file inputs are left unchanged
5. **Type Safety**: TypeScript types are preserved throughout the wrapping process

### API Reference

#### `withFileUploads<T>(orpcClient: T): T`

Wraps an ORPC client to enhance file upload routes.

**Parameters:**
- `orpcClient`: The ORPC client instance to wrap

**Returns:**
- Enhanced ORPC client with automatic file upload handling

#### `useFileUploadRoutes<T>(orpcClient: T): T`

React hook version of `withFileUploads`.

**Parameters:**
- `orpcClient`: The ORPC client instance to wrap

**Returns:**
- Enhanced ORPC client with automatic file upload handling

#### `FileUploadOptions`

Options for file upload routes:

```typescript
type FileUploadOptions = {
  onProgress?: (event: FileUploadProgressEvent) => void
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}
```

#### `FileUploadProgressEvent`

Progress event data:

```typescript
type FileUploadProgressEvent = {
  loaded: number      // Bytes uploaded
  total: number       // Total bytes
  percentage: number  // Upload percentage (0-100)
  progress: number    // Alias for percentage
}
```

### Benefits

1. **Seamless Integration**: No changes needed to existing ORPC contracts
2. **Automatic Enhancement**: Routes are automatically detected and enhanced
3. **Type Safety**: Full TypeScript support maintained
4. **Non-Blocking**: Uploads run in Web Worker, UI stays responsive
5. **Progress Tracking**: Real-time progress updates
6. **Error Handling**: Automatic toast notifications
7. **Cancellation**: Built-in support for aborting uploads

### Comparison with Direct Hook Usage

**Before (using hooks directly):**
```typescript
import { useWorkerUploadFile } from '@/hooks/useWorkerFileUpload'
import { orpc } from '@/lib/orpc'

const upload = useWorkerUploadFile(orpc.storage.uploadImage)
upload.mutate(file)
```

**After (using withFileUploads):**
```typescript
import { withFileUploads } from '@/lib/orpc/withFileUploads'
import { orpc } from '@/lib/orpc'

const orpcWithUploads = withFileUploads(orpc)
await orpcWithUploads.storage.uploadImage(file, { onProgress: ... })
```

The `withFileUploads` approach provides a more natural API that matches standard ORPC usage patterns while automatically providing Web Worker-based uploads with progress tracking.
