'use client'

import * as React from 'react'
import { logger } from '@repo/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    logger.error(error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ color: '#dc2626' }}>Application Error</h1>
          <h2>Something went wrong!</h2>
          <p style={{ color: '#6b7280' }}>
            {error.message || 'An unexpected error occurred'}
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => {
              reset()
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
