# Debug Library

A powerful and flexible debug logging system for Next.js applications with advanced pattern matching capabilities.

## Features

- **Scoped Debugging**: Organize debug messages by scope (e.g., `middleware/auth`, `api/users`)
- **Pattern Matching**: Support for wildcards, nested scopes, and brace expansion
- **Environment Controlled**: Enable/disable debug messages via `NEXT_PUBLIC_DEBUG` environment variable
- **Multiple Scopes**: Debug functions can target multiple scopes simultaneously
- **Performance Friendly**: Includes `isDebugEnabled()` to avoid expensive operations when debugging is disabled
- **TypeScript Ready**: Full TypeScript support with proper type definitions

## Basic Usage

```typescript
import { debug, createDebug, isDebugEnabled } from '@/lib/debug'

// Basic debug logging
debug('middleware/auth', 'User authentication started')

// Multiple arguments
debug('api/users', 'User created:', { id: 123, name: 'John' })

// Multiple scopes (logs if any scope matches)
debug(['middleware/auth', 'api/users'], 'Multi-scope message')

// Create bound debug function
const authDebug = createDebug('middleware/auth')
authDebug('Always uses middleware/auth scope')

// Conditional expensive operations
if (isDebugEnabled('expensive/computation')) {
    const result = performExpensiveCalculation()
    debug('expensive/computation', 'Result:', result)
}
```

## Environment Variable Patterns

Set `NEXT_PUBLIC_DEBUG` to control which debug messages are shown:

### Basic Patterns

| Pattern | Description | Example Matches |
|---------|-------------|-----------------|
| `*` | Match everything | All debug messages |
| `middleware/auth` | Exact match | `middleware/auth` only |
| `middleware/*` | Direct children | `middleware/auth`, `middleware/router` |
| `middleware/**` | All nested | `middleware/auth`, `middleware/auth/session`, `middleware/auth/session/token` |

### Advanced Patterns

| Pattern | Description | Example Matches |
|---------|-------------|-----------------|
| `middleware/{auth,router}/*` | Multiple sub-scopes | `middleware/auth/session`, `middleware/router/handler` |
| `middleware/{auth,router}/**` | Deep nested multiple | `middleware/auth/session/token`, `middleware/router/handler/get` |
| `api/{users,posts,comments}/*` | API endpoints | `api/users/create`, `api/posts/update`, `api/comments/delete` |

### Complex Examples

```bash
# Multiple patterns separated by commas
NEXT_PUBLIC_DEBUG="middleware/{auth,router}/**,api/users,database/*"

# This enables:
# - All nested auth and router middleware debugging
# - Exact API users debugging  
# - Direct database children debugging
```

## Real-World Examples

### Development Environment
```bash
# Debug all middleware and API calls
NEXT_PUBLIC_DEBUG="middleware/**,api/**"
```

### Authentication Debugging
```bash
# Debug authentication flow
NEXT_PUBLIC_DEBUG="middleware/auth/**,api/auth/**,lib/auth/**"
```

### Performance Debugging
```bash
# Debug database and caching
NEXT_PUBLIC_DEBUG="database/**,cache/**,performance/**"
```

### Feature-Specific Debugging
```bash
# Debug specific features
NEXT_PUBLIC_DEBUG="user-management/**,payment/**,notification/**"
```

## Console Output Format

Debug messages appear with the following format:

```
[DEBUG] [2025-01-20T15:30:45.123Z] [middleware/auth] User authentication started
[DEBUG] [2025-01-20T15:30:45.125Z] [api/users,api/posts] Multi-scope message
```

- `[DEBUG]` in yellow text
- Timestamp in ISO format
- Scope(s) that triggered the log
- Your debug message and arguments

## Integration with Existing Code

The debug library is already integrated into:

- **WithAuth Middleware**: Use `NEXT_PUBLIC_DEBUG="middleware/auth/**"` to see authentication flow
- **Environment System**: Configured via the Zod schema in `env.ts`

## Performance Notes

- When debug is disabled, function calls have minimal overhead
- Use `isDebugEnabled()` before expensive operations
- The environment is checked once at startup, so runtime performance is optimal

## TypeScript Support

Full TypeScript support with proper type inference:

```typescript
import { debug } from '@/lib/debug'

// All properly typed
debug('scope', 'message', { data: 'object' }, ['array'], 123)
```