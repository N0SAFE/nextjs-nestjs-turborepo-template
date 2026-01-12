# @repo/logger

Production-ready logger package using Pino for Next.js and NestJS applications.

## Features

- ✅ **All Log Levels**: trace, debug, info, warn, error, fatal
- ✅ **Pretty Printing**: Colorized logs in development, JSON in production
- ✅ **Scoped Loggers**: Namespace your logs by module/domain
- ✅ **Child Loggers**: Bind context to logger instances
- ✅ **Sensitive Data Redaction**: Automatic redaction of passwords, tokens, etc.
- ✅ **Error Serialization**: Automatic error stack traces and properties
- ✅ **Request/Response Serialization**: Built-in HTTP serializers
- ✅ **Zero Config**: Works out of the box with sensible defaults

## Installation

```bash
bun add @repo/logger
```

## Usage

### Basic Logging

```typescript
import { logger } from '@repo/logger'

// Different log levels
logger.trace('Very detailed debug info')
logger.debug('Debug information')
logger.info('General information')
logger.warn('Warning message')
logger.error('Error occurred')
logger.fatal('Fatal error - process should terminate')

// With structured data
logger.info('User logged in', {
  userId: '123',
  email: 'user@example.com',
  timestamp: Date.now()
})

// Error logging
try {
  throw new Error('Something went wrong')
} catch (err) {
  logger.error('Operation failed', err)
  // Automatically serializes error with stack trace
}
```

### Scoped Loggers

Create loggers with namespace prefixes for better organization:

```typescript
import { logger } from '@repo/logger'

const authLogger = logger.scope('Auth')
const dbLogger = logger.scope('Database')

authLogger.info('Login attempt', { userId: '123' })
// Output: Auth: Login attempt { userId: '123' }

dbLogger.warn('Slow query', { duration: 2500 })
// Output: Database: Slow query { duration: 2500 }

// Nested scopes
const userAuthLogger = authLogger.scope('User')
userAuthLogger.debug('Validating credentials')
// Output: Auth:User: Validating credentials
```

### Child Loggers with Context

Bind context that appears in all subsequent logs:

```typescript
import { logger } from '@repo/logger'

// Create a child logger with request context
const requestLogger = logger.child({
  requestId: 'abc-123',
  userId: '456',
  method: 'POST'
})

requestLogger.info('Processing request')
// Output: { requestId: 'abc-123', userId: '456', method: 'POST', msg: 'Processing request' }

requestLogger.info('Request completed', { duration: 150 })
// Output: { requestId: 'abc-123', userId: '456', method: 'POST', duration: 150, msg: 'Request completed' }
```

### Custom Configuration

```typescript
import { createLogger } from '@repo/logger'

// Custom log level
const apiLogger = createLogger({
  scope: 'API',
  level: 'debug'
})

// With base context (appears in all logs)
const appLogger = createLogger({
  scope: 'App',
  base: {
    version: '1.0.0',
    env: process.env.NODE_ENV
  }
})

// Custom redaction paths
const secureLogger = createLogger({
  scope: 'Security',
  redact: [
    'password',
    'creditCard',
    'ssn',
    '*.sensitive',
    'user.*.secret'
  ]
})

secureLogger.info('User data', {
  username: 'john',
  password: 'secret123', // Will be [REDACTED]
  email: 'john@example.com'
})
```

## Log Levels

| Level | Usage | Description |
|-------|-------|-------------|
| `trace` | Development | Most verbose, for detailed debugging |
| `debug` | Development | Debug information |
| `info` | Production | General informational messages |
| `warn` | Production | Warning messages (not errors) |
| `error` | Production | Error messages with stack traces |
| `fatal` | Production | Fatal errors (should terminate process) |
| `silent` | Testing | Disable all logging |

Default level: `debug` in development, `info` in production

## Sensitive Data Redaction

By default, the following fields are automatically redacted:

- `password`, `*.password`
- `token`, `*.token`
- `secret`, `*.secret`
- `apiKey`, `api_key`, `*.apiKey`, `*.api_key`
- `authorization`
- `cookie`, `set-cookie`
- `req.headers.authorization`
- `req.headers.cookie`

```typescript
logger.info('User credentials', {
  username: 'john',
  password: 'super-secret', // [REDACTED]
  token: 'abc-123' // [REDACTED]
})
```

## Error Serialization

Errors are automatically serialized with full stack traces:

```typescript
try {
  throw new Error('Database connection failed')
} catch (err) {
  logger.error('Failed to connect', err)
}

// Output includes:
// {
//   err: {
//     type: 'Error',
//     message: 'Database connection failed',
//     stack: '...'
//   },
//   msg: 'Failed to connect'
// }
```

## Best Practices

### 1. Use Scoped Loggers

Create scoped loggers at the module level:

```typescript
// services/user.service.ts
import { logger } from '@repo/logger'

const userLogger = logger.scope('UserService')

export class UserService {
  async createUser(data) {
    userLogger.info('Creating user', { email: data.email })
    // ...
  }
}
```

### 2. Use Child Loggers for Request Context

```typescript
// middleware/request-logger.ts
import { logger } from '@repo/logger'

export function requestLogger(req, res, next) {
  const requestLogger = logger.child({
    requestId: req.id,
    method: req.method,
    path: req.path
  })
  
  req.logger = requestLogger
  requestLogger.info('Request started')
  next()
}

// Later in your route
app.get('/users', (req, res) => {
  req.logger.info('Fetching users') // Includes requestId, method, path
})
```

### 3. Structure Your Logs

Always include structured data for better searchability:

```typescript
// ❌ Bad
logger.info(`User ${userId} logged in`)

// ✅ Good
logger.info('User logged in', { userId, timestamp: Date.now() })
```

### 4. Use Appropriate Log Levels

```typescript
logger.trace('Function called with args:', args) // Only in dev
logger.debug('Cache miss', { key })              // Debug info
logger.info('User action', { userId, action })    // Important events
logger.warn('Deprecated API used', { endpoint })  // Warnings
logger.error('Operation failed', error)           // Errors
logger.fatal('Unable to start server', error)    // Critical failures
```

## Environment Configuration

The logger automatically adjusts based on `NODE_ENV`:

### Development (`NODE_ENV=development`)
- Log level: `debug`
- Pretty printing: **enabled** (colorized, human-readable)
- Timestamp format: `HH:MM:ss Z`

### Production (`NODE_ENV=production`)
- Log level: `info`
- Pretty printing: **disabled** (JSON format)
- Structured logging for log aggregation

## TypeScript Support

Full TypeScript support with proper types:

```typescript
import { logger, Logger, LogLevel, LoggerOptions } from '@repo/logger'

const config: LoggerOptions = {
  level: 'debug',
  scope: 'MyModule',
  redact: ['sensitive']
}

const myLogger: Logger = createLogger(config)
```

## Performance

- Zero-cost abstractions in production
- Lazy evaluation of log arguments
- Efficient JSON serialization
- Minimal overhead (~5-10μs per log)

## License

MIT
