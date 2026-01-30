'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#fafafa',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '28rem',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '4rem',
                height: '4rem',
                margin: '0 auto 1rem',
                backgroundColor: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem',
              }}
            >
              Critical Error
            </h1>
            <p
              style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
              }}
            >
              A critical error has occurred. Please reload the page or contact support if the
              problem persists.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginBottom: '1.5rem',
                  fontFamily: 'monospace',
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#111827',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: 'white',
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
