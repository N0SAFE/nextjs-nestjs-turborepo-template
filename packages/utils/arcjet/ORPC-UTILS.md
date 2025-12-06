# ORPC Utilities

Generic utilities for creating ORPC middleware. These utilities complement the Arcjet middleware and can be used independently.

## Status

⚠️ **Type Refinements Needed**: The ORPC utilities currently use simplified types (`any`) for complex ORPC generics. Full type safety is planned for a future iteration.

## Available Utilities

- `createMiddleware(options)` - Create middleware with before/after hooks
- `conditionalMiddleware(condition, middleware)` - Apply middleware conditionally
- `transformContext(transformer)` - Transform ORPC context
- `validateInput(validator)` - Validate request input
- `cacheResults(cache, keyGenerator, ttl)` - Cache handler results
- `loggingMiddleware(options)` - Log requests and responses
- `composeMiddleware(...middlewares)` - Combine multiple middleware

## Roadmap

- [ ] Refine TypeScript types for full type safety
- [ ] Add more utility functions based on common patterns
- [ ] Integration tests with real ORPC handlers
- [ ] Performance benchmarks

## Contributing

When adding new utilities:
1. Follow the existing pattern of using `os.$context<TContext>()`
2. Add comprehensive JSDoc comments
3. Include usage examples in comments
4. Add tests in corresponding `.spec.ts` file
