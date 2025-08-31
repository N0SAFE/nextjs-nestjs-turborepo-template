/**
 * Debug Library Usage Examples
 * 
 * This file demonstrates how to use the enhanced debug library with various patterns.
 * Set NEXT_PUBLIC_DEBUG environment variable to test different scenarios.
 */

import { debug, createDebug, isDebugEnabled } from '.'

// Example 1: Basic debug usage with single scope
debug('middleware/auth', 'User authentication started')

// Example 2: Debug with multiple scopes (any match will log)
debug(['middleware/auth', 'api/users'], 'Multiple scopes example')

// Example 3: Using nested sub-scopes
debug('middleware/auth/session', 'Session validation')
debug('middleware/auth/session/token', 'Token validation')
debug('middleware/router/handler/get', 'GET request handler')

// Example 4: Using createDebug for bound scopes
const authDebug = createDebug('middleware/auth')
const apiDebug = createDebug(['api/users', 'api/posts'])

authDebug('This will always use middleware/auth scope')
apiDebug('This will always use api/users and api/posts scopes')

// Example 5: Conditional debugging with isDebugEnabled
if (isDebugEnabled('expensive/operation')) {
    // Only perform expensive operations if debug is enabled
    const expensiveData = { computed: 'heavy calculation result' }
    debug('expensive/operation', 'Expensive operation result:', expensiveData)
}

// Example 6: Multiple arguments
debug('middleware/auth', 'User login attempt', {
    userId: '123',
    timestamp: new Date().toISOString(),
    ip: '192.168.1.1'
})

/*
Environment Variable Examples:

NEXT_PUBLIC_DEBUG="*"
- Logs everything

NEXT_PUBLIC_DEBUG="middleware/auth"
- Only logs exact matches for "middleware/auth"

NEXT_PUBLIC_DEBUG="middleware/*"
- Logs "middleware/auth", "middleware/router", etc. (direct children only)

NEXT_PUBLIC_DEBUG="middleware/**"
- Logs "middleware/auth", "middleware/auth/session", "middleware/auth/session/token", etc. (all nested)

NEXT_PUBLIC_DEBUG="middleware/{auth,router}/*"
- Logs "middleware/auth/session", "middleware/router/handler", but NOT "middleware/cors/policy"

NEXT_PUBLIC_DEBUG="middleware/{auth,router}/**,api/users,database/*"
- Complex pattern: all nested auth & router middleware + exact API users + direct database children

NEXT_PUBLIC_DEBUG="middleware/auth,api/*,database/connection"
- Multiple exact and wildcard patterns
*/

export {}