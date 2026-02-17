import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { RouteBuilder } from '../core/route-builder';

describe('Schema-first API', () => {
  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    password: z.string(),
    createdAt: z.string(),
  });

  it('supports direct input/output schemas', () => {
    const route = new RouteBuilder({ method: 'POST', path: '/users' })
      .input(userSchema)
      .output(userSchema.omit({ password: true }))
      .build();

    expect(route).toBeDefined();
  });

  it('supports schema-first input callback chaining', () => {
    const route = new RouteBuilder({ method: 'POST', path: '/users' })
      .input((b) => b
        .body(userSchema.omit({ id: true, createdAt: true }))
        .query(z.object({ limit: z.number().optional() }))
      )
      .output(z.object({ ok: z.literal(true) }))
      .build();

    expect(route).toBeDefined();
  });

  it('supports schema-first output callback chaining', () => {
    const route = new RouteBuilder({ method: 'GET', path: '/users/{id}' })
      .output((b) => b
        .status(200)
        .body(userSchema.omit({ password: true }))
        .headers({ etag: z.string() })
      )
      .build();

    expect(route).toBeDefined();
  });

  it('supports direct schema transform via body callback', () => {
    const route = new RouteBuilder({ method: 'GET', path: '/users' })
      .output(userSchema)
      .output((b) => b.body((s) => s.omit({ password: true, createdAt: true })))
      .build();

    expect(route).toBeDefined();
  });

  it('supports union variants without detailed wrapper', () => {
    const route = new RouteBuilder({ method: 'GET', path: '/users/{id}' })
      .output((b) => b.union([
        b.status(200).body(userSchema.omit({ password: true })),
        b.status(404).body(z.object({ error: z.string() })),
      ]))
      .build();

    expect(route).toBeDefined();
  });

  it('supports streamed body via body.streamed', () => {
    const route = new RouteBuilder({ method: 'GET', path: '/events' })
      .output((b) => b.streamed(z.object({ event: z.string() })))
      .build();

    expect(route).toBeDefined();
  });
});
