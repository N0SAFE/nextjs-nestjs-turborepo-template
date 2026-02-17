import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { RouteBuilder } from '../core/route-builder';

describe('ErrorDefinitionBuilder', () => {
  it('should define errors with fluent builder syntax', () => {
    const route = new RouteBuilder()
      .path('/test')
      .method('POST')
      .input(z.object({ id: z.string() }))
      .output(z.object({ name: z.string() }))
      .errors(e => [
        e().code('NOT_FOUND').message('Resource not found').status(404),
        e().code('VALIDATION_FAILED')
          .message('Validation error')
          .data(z.object({ fields: z.array(z.string()) }))
          .status(422),
      ]);

    const contract = route.build();
    expect(contract).toBeDefined();
  });

  it('should support errors with data schema', () => {
    const route = new RouteBuilder()
      .path('/test')
      .input(z.object({ id: z.string() }))
      .output(z.object({ name: z.string() }))
      .errors(e => [
        e().code('RATE_LIMITED').data(z.object({ retryAfter: z.number() })),
      ] as const);

    const contract = route.build();
    expect(contract).toBeDefined();
  });

  it('should support errors with only code', () => {
    const route = new RouteBuilder()
      .path('/test')
      .input(z.object({ id: z.string() }))
      .output(z.object({ name: z.string() }))
      .errors(e => [
        e().code('UNAUTHORIZED'),
        e().code('FORBIDDEN'),
      ]);

    const contract = route.build();
    expect(contract).toBeDefined();
  });

  it('should support structured output with builder errors syntax', () => {
    const route = new RouteBuilder()
      .path('/test')
      .input(z.object({ id: z.string() }))
      .output(d => d.status(200).body(z.object({ name: z.string() })))
      .errors(e => [
        e().code('NOT_FOUND').message('Resource not found').status(404),
        e().code('VALIDATION_FAILED')
          .message('Validation error')
          .data(z.object({ fields: z.array(z.string()) }))
          .status(422),
      ]);

    const contract = route.build();
    expect(contract).toBeDefined();
  });

  it('should combine builder syntax with union outputs', () => {
    const route = new RouteBuilder()
      .path('/users/:id')
      .method('GET')
      .input(z.object({ params: z.object({ id: z.string() }) }))
      .output(b => b.union([
        b.status(200).body(z.object({ id: z.string(), name: z.string() })),
        b.status(404).body(z.object({ error: z.string() })),
      ]))
      .errors(e => [
        e().code('NOT_FOUND').message('User not found').status(404),
        e().code('UNAUTHORIZED').status(401),
      ]);

    // Type verification: the errors should be properly typed now
    // Expected: { NOT_FOUND: { message: 'User not found', status: 404 }, UNAUTHORIZED: { status: 401 } }
    type Errors = typeof route extends RouteBuilder<any, any, any, any, infer TErrors> ? TErrors : never;
    
    // Type should show 'NOT_FOUND' | 'UNAUTHORIZED' for the keys
    const _errorsCheck: keyof Errors = 'NOT_FOUND';
    void _errorsCheck; // Type check only - verify TypeScript accepts this

    // Type verification: the union output should be properly typed
    type Output = typeof route extends RouteBuilder<any, infer TOutput, any, any, any> ? TOutput : never;
    
    // Log type to see what we're getting (this will show in IDE hover)
    const _outputCheck: Output = null!;
    void _outputCheck;

    const contract = route.build();
    expect(contract).toBeDefined();
  });

  it('should support ORPC standard error codes', () => {
    const route = new RouteBuilder()
      .path('/test')
      .input(z.object({ id: z.string() }))
      .output(z.object({ name: z.string() }))
      .errors(e => [
        e().code('BAD_REQUEST').message('Invalid input').status(400),
        e().code('UNAUTHORIZED').message('Not authenticated').status(401),
        e().code('FORBIDDEN').message('No permission').status(403),
        e().code('NOT_FOUND').message('Not found').status(404),
        e().code('CONFLICT').message('Already exists').status(409),
        e().code('UNPROCESSABLE_CONTENT').message('Validation failed').status(422),
        e().code('TOO_MANY_REQUESTS').message('Rate limited').status(429),
        e().code('INTERNAL_SERVER_ERROR').message('Server error').status(500),
      ]);

    const contract = route.build();
    expect(contract).toBeDefined();
  });

  it('should merge multiple errors calls', () => {
    const route = new RouteBuilder()
      .path('/test')
      .input(z.object({ id: z.string() }))
      .output(z.object({ name: z.string() }))
      .errors(e => [
        e().code('NOT_FOUND').message('Not found'),
      ])
      .errors(e => [
        e().code('UNAUTHORIZED').message('Not authenticated'),
      ]);

    const contract = route.build();
    expect(contract).toBeDefined();
  });

  it('should support errors with custom status codes', () => {
    const route = new RouteBuilder()
      .path('/test')
      .input(z.object({ id: z.string() }))
      .output(z.object({ name: z.string() }))
      .errors(e => [
        e().code('CUSTOM_ERROR').message('Custom error').status(503),
        e().code('ANOTHER_ERROR').message('Another error').status(502),
      ]);

    const contract = route.build();
    expect(contract).toBeDefined();
  });

  it('should throw error if code is not set', () => {
    expect(() => {
      new RouteBuilder()
        .path('/test')
        .input(z.object({ id: z.string() }))
        .output(z.object({ name: z.string() }))
        .errors(e => [
          e().message('Missing code'), // no code() call
        ]);
    }).toThrow('Error code is required');
  });

  it('should allow chaining error methods in any order', () => {
    const route = new RouteBuilder()
      .path('/test')
      .input(z.object({ id: z.string() }))
      .output(z.object({ name: z.string() }))
      .errors(e => [
        // Different ordering
        e().status(404).message('Not found').code('NOT_FOUND'),
        e().data(z.object({ retryAfter: z.number() })).code('RATE_LIMITED').status(429),
        e().message('Forbidden').status(403).code('FORBIDDEN'),
      ]);

    const contract = route.build();
    expect(contract).toBeDefined();
  });
});
