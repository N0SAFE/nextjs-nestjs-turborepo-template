# @repo/arcjet

Arcjet integration package for ORPC middleware with generic ORPC utilities.

## Features

### Arcjet Integration
- **ArcjetService**: Wrapper service for Arcjet SDK
- **ORPC Middleware**: Ready-to-use middleware factories for rate limiting, bot protection, and more
- **Type-safe**: Full TypeScript support with ORPC context types

### Generic ORPC Utilities
- **Middleware Factories**: Helper functions to create custom ORPC middleware
- **Common Patterns**: Logging, caching, validation, and more
- **Composable**: Combine multiple middleware easily

## Installation

This package is part of the monorepo and uses workspace dependencies:

```bash
bun install
```

## Usage

### Basic Arcjet Setup

```typescript
import { createArcjetService } from '@repo/arcjet';

// Create Arcjet service instance
const arcjetService = createArcjetService(process.env.ARCJET_KEY!);
```

### Using Arcjet Middleware in Controllers

```typescript
import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { rateLimitMiddleware, ArcjetService } from '@repo/arcjet';

@Controller()
export class UserController {
  constructor(private readonly arcjetService: ArcjetService) {}

  @Implement(userContract.create)
  create() {
    return implement(userContract.create)
      .use(rateLimitMiddleware(this.arcjetService, {
        refillRate: 10,
        interval: '1m',
        capacity: 100
      }))
      .handler(async ({ input }) => {
        // Handler logic
      });
  }
}
```

### Available Arcjet Middleware

#### Rate Limiting

```typescript
import { rateLimitMiddleware, ArcjetService } from '@repo/arcjet';

// Token bucket rate limiting
.use(rateLimitMiddleware(arcjetService, {
  refillRate: 10,
  interval: '60s',
  capacity: 100
}))

// Fixed window
.use(createArcjetMiddleware(arcjetService, [
  ArcjetService.fixedWindowRateLimit({
    max: 100,
    window: '1m'
  })
]))

// Sliding window
.use(createArcjetMiddleware(arcjetService, [
  ArcjetService.slidingWindowRateLimit({
    max: 100,
    interval: '60s'
  })
]))
```

#### Bot Protection

```typescript
import { botProtectionMiddleware } from '@repo/arcjet';

.use(botProtectionMiddleware(arcjetService, {
  mode: 'LIVE',
  allow: ['VERIFIED_BOT'],
  deny: ['AUTOMATED']
}))
```

#### Shield Protection

```typescript
import { shieldMiddleware } from '@repo/arcjet';

.use(shieldMiddleware(arcjetService))
```

### Custom Context Extraction

```typescript
import { createArcjetMiddleware } from '@repo/arcjet';

.use(createArcjetMiddleware(arcjetService, [...rules], {
  extractContext: (context) => ({
    // Add custom characteristics
    userId: context.auth?.user?.id,
    email: context.auth?.user?.email,
  }),
  onDenied: (decision, context) => {
    console.log('Request denied:', decision);
    throw new Error(`Rate limit exceeded: ${decision.reason}`);
  }
}))
```

### Generic ORPC Utilities

#### Custom Middleware

```typescript
import { createMiddleware } from '@repo/arcjet';

const loggingMiddleware = createMiddleware({
  before: (context, input) => {
    console.log('Request:', input);
  },
  after: (context, input, output) => {
    console.log('Response:', output);
  },
  onError: (error, context, input) => {
    console.error('Error:', error);
  }
});

implement(contract)
  .use(loggingMiddleware)
  .handler(async ({ input }) => {
    // Handler logic
  });
```

#### Conditional Middleware

```typescript
import { conditionalMiddleware, requireAuth } from '@repo/arcjet';

const conditionalAuth = conditionalMiddleware(
  (context, input) => input.requireAuth === true,
  requireAuth()
);

implement(contract)
  .use(conditionalAuth)
  .handler(async ({ input }) => {
    // Handler logic
  });
```

#### Context Transformation

```typescript
import { transformContext } from '@repo/arcjet';

const addTimestamp = transformContext((context) => ({
  ...context,
  timestamp: Date.now()
}));

implement(contract)
  .use(addTimestamp)
  .handler(async ({ context }) => {
    console.log('Request timestamp:', context.timestamp);
  });
```

#### Input Validation

```typescript
import { validateInput } from '@repo/arcjet';

const validateEmail = validateInput((input) => {
  if (!input.email.includes('@')) {
    throw new Error('Invalid email format');
  }
});

implement(contract)
  .use(validateEmail)
  .handler(async ({ input }) => {
    // Input is validated
  });
```

#### Composing Middleware

```typescript
import { composeMiddleware } from '@repo/arcjet';

const combined = composeMiddleware(
  requireAuth(),
  rateLimitMiddleware(arcjet, { ... }),
  loggingMiddleware()
);

implement(contract)
  .use(combined)
  .handler(async ({ input }) => {
    // Handler logic
  });
```

## API Reference

### ArcjetService

Main service class for Arcjet integration.

#### Methods

- `protect(context)`: Protect a request with configured rules
- `withRules(...rules)`: Create new client with specific rules
- `static rateLimit(options)`: Create rate limit rule
- `static fixedWindowRateLimit(options)`: Create fixed window rate limit
- `static slidingWindowRateLimit(options)`: Create sliding window rate limit
- `static botProtection(options)`: Create bot detection rule
- `static emailValidation(options)`: Create email validation rule
- `static shieldProtection(options)`: Create shield rule

### Middleware Factories

- `createArcjetMiddleware(service, rules, options)`: Create custom Arcjet middleware
- `rateLimitMiddleware(service, options, middlewareOptions)`: Rate limiting middleware
- `botProtectionMiddleware(service, options, middlewareOptions)`: Bot protection middleware
- `shieldMiddleware(service, options, middlewareOptions)`: Shield protection middleware

### ORPC Utilities

- `createMiddleware(options)`: Create middleware with before/after hooks
- `conditionalMiddleware(condition, middleware)`: Apply middleware conditionally
- `transformContext(transformer)`: Transform ORPC context
- `validateInput(validator)`: Validate request input
- `cacheResults(cache, keyGenerator, ttl)`: Cache handler results
- `loggingMiddleware(options)`: Log requests and responses
- `composeMiddleware(...middlewares)`: Combine multiple middleware

## Environment Variables

- `ARCJET_KEY`: Your Arcjet API key (required)

## Testing

```bash
bun test
```

## License

Same as the monorepo.
