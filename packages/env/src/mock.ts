/**
 * Mock environment variables for local development and testing
 * These are safe defaults that work out of the box without configuration
 */

export const mockEnv = {
    // ============================================================================
    // API Mock Environment
    // ============================================================================
    api: {
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/dev',
        API_PORT: '3001',
        AUTH_SECRET: 'mock-auth-secret-key-for-development-only-change-in-production',
        DEV_AUTH_KEY: 'mock-dev-auth-key-for-development-only',
        PASSKEY_RPID: 'localhost',
        PASSKEY_RPNAME: 'NestJS Directus Turborepo Template',
        PASSKEY_ORIGIN: 'http://localhost:3000',
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },

    // ============================================================================
    // Web Mock Environment
    // ============================================================================
    web: {
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        API_URL: 'http://localhost:3001',
        NEXT_PUBLIC_SHOW_AUTH_LOGS: 'false',
        NEXT_PUBLIC_DEBUG: '',
        NEXT_PUBLIC_DOC_URL: 'http://localhost:3020',
        NEXT_PUBLIC_DOC_PORT: '3020',
        NODE_ENV: 'development',
        REACT_SCAN: 'false',
        MILLION_LINT: 'false',
        // React Scan (optional)
        REACT_SCAN_GIT_COMMIT_HASH: '',
        REACT_SCAN_GIT_BRANCH: '',
        REACT_SCAN_TOKEN: '',
    },

    // ============================================================================
    // Doc Mock Environment
    // ============================================================================
    doc: {
        NODE_ENV: 'development',
    },
}

/**
 * Get mock environment for a specific app
 */
export function getMockEnv(appName: 'api' | 'web' | 'doc'): Record<string, string> {
    return mockEnv[appName]
}

/**
 * Get all mock environments merged
 */
export function getAllMockEnv(): Record<string, string> {
    return {
        ...mockEnv.api,
        ...mockEnv.web,
        ...mockEnv.doc,
    }
}

/**
 * Merge mock environment with existing environment
 */
export function mergeMockEnv(
    existing: Record<string, string>,
    appName?: 'api' | 'web' | 'doc'
): Record<string, string> {
    if (appName) {
        return { ...mockEnv[appName], ...existing }
    }
    return { ...getAllMockEnv(), ...existing }
}
