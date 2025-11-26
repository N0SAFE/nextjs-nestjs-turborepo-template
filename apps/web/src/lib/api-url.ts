/**
 * Utility functions to get the correct API URLs
 * Uses direct URLs bypassing Next.js proxy
 * 
 * Browser: NEXT_PUBLIC_API_URL (public endpoint)
 * Server: API_URL (private Docker network endpoint)
 */

/**
 * Get the base API URL based on execution context
 * @returns Base API URL (without trailing slash)
 */
export function getBaseApiUrl(): string {
    if (typeof window !== 'undefined') {
        // Browser: use public API URL
        return process.env.NEXT_PUBLIC_API_URL ?? ''
    } else {
        // Server: use private API URL (Docker network)
        return process.env.API_URL ?? ''
    }
}

/**
 * Get the full API URL for a given path
 * @param path - API path (e.g., '/presentation/video', '/storage/files/image.png')
 * @returns Full API URL
 * 
 * @example
 * getApiUrl('/presentation/video')
 * // Browser: 'http://localhost:3001/presentation/video'
 * // Server: 'http://api:3001/presentation/video'
 */
export function getApiUrl(path: string): string {
    const baseUrl = getBaseApiUrl()
    // Remove trailing slash from base and leading slash from path, then join
    const cleanBase = baseUrl.replace(/\/$/, '')
    const cleanPath = path.replace(/^\//, '')
    return `${cleanBase}/${cleanPath}`
}

/**
 * Get the full Auth API URL for a given path
 * @param path - Auth path (e.g., '/get-session', '/dev/login-as')
 * @returns Full Auth API URL
 * 
 * @example
 * getAuthUrl('/get-session')
 * // Browser: 'http://localhost:3001/api/auth/get-session'
 * // Server: 'http://api:3001/api/auth/get-session'
 */
export function getAuthUrl(path: string): string {
    const baseUrl = getBaseApiUrl()
    const cleanBase = baseUrl.replace(/\/$/, '')
    const cleanPath = path.replace(/^\//, '')
    return `${cleanBase}/api/auth/${cleanPath}`
}
