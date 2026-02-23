import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod/v4';
import { RouteBuilder, route } from '../core/route-builder';
import type { InferSchemaInput } from '../../shared/types';

const SHAPE_SYMBOL = Symbol.for('standard-schema:shape');

function getSchemaShape(value: unknown): Record<string, unknown> {
  return ((value as Record<symbol, unknown>)[SHAPE_SYMBOL] ?? {}) as Record<string, unknown>;
}

describe('RouteBuilder - Regression Coverage', () => {
  describe('static probe factories', () => {
    it('builds health probe with default path and GET method', () => {
      const contract = RouteBuilder.health().build();

      expect(contract['~orpc'].route.path).toBe('/health');
      expect(contract['~orpc'].route.method).toBe('GET');
      expect(contract['~orpc'].outputSchema).toBeDefined();
    });

    it('builds ready and live probes with custom paths', () => {
      const ready = RouteBuilder.ready({ path: '/probe/ready' }).build();
      const live = RouteBuilder.live({ path: '/probe/live' }).build();

      expect(ready['~orpc'].route.path).toBe('/probe/ready');
      expect(ready['~orpc'].route.method).toBe('GET');
      expect(live['~orpc'].route.path).toBe('/probe/live');
      expect(live['~orpc'].route.method).toBe('GET');
    });
  });

  describe('method/path metadata consistency', () => {
    it('keeps explicit method when route metadata does not provide one', () => {
      const contract = route({ path: '/users' })
        .method('PATCH')
        .input(z.object({ id: z.string() }))
        .output(z.object({ updated: z.boolean() }))
        .build();

      expect(contract['~orpc'].route.method).toBe('PATCH');
      expect(contract['~orpc'].route.path).toBe('/users');
    });

    it('propagates path from input(...params...) template builder', () => {
      const contract = new RouteBuilder({ method: 'GET' })
        .input((b) => b.params((p) => p`/orgs/${p('orgId', z.uuid())}/users/${p('userId', z.uuid())}`))
        .output(z.object({ id: z.string() }))
        .build();

      expect(contract['~orpc'].route.path).toBe('/orgs/{orgId}/users/{userId}');
    });
  });

  describe('legacy callable accessor compatibility', () => {
    it('exposes entitySchema on input and output callables', () => {
      const entitySchema = z.object({ id: z.string(), name: z.string() });
      const builder = new RouteBuilder().entity(entitySchema);
      const runtimeBuilder = builder as unknown as {
        input: { entitySchema: unknown };
        output: { entitySchema: unknown };
      };

      expect(runtimeBuilder.input.entitySchema).toBe(entitySchema);
      expect(runtimeBuilder.output.entitySchema).toBe(entitySchema);
    });

    it('uses a concrete default entity schema when none is provided', () => {
      const builder = new RouteBuilder();

      expect(builder.getEntitySchema()).toBeDefined();
      expect((builder as unknown as { input: { entitySchema: unknown } }).input.entitySchema).toBeDefined();
      expect((builder as unknown as { output: { entitySchema: unknown } }).output.entitySchema).toBeDefined();
    });
  });

  describe('build-time schema normalization', () => {
    it('preserves body key in inferred input when body fields are all optional', () => {
      const contract = new RouteBuilder({ method: 'POST' })
        .input((b) =>
          b
            .params((p) => p`/deployments/${p('id', z.uuid())}/cancel`)
            .body(z.object({ reason: z.string().optional() }))
        )
        .output(z.object({ success: z.boolean() }))
        .build();

      expect(contract['~orpc'].inputSchema).toBeDefined();

      type Input = InferSchemaInput<NonNullable<typeof contract['~orpc']['inputSchema']>>;

      expectTypeOf<Input>().toHaveProperty('params');
      expectTypeOf<Input>().toHaveProperty('body');
      expectTypeOf<Input['body']>().toMatchTypeOf<{ reason?: string | undefined } | undefined>();
    });

    it('compacts detailed input by removing void-like fields', () => {
      const contract = new RouteBuilder({ method: 'POST' })
        .input((b) =>
          b
            .body(z.object({ name: z.string(), email: z.email() }))
            .query(z.object({ locale: z.string().optional() }))
        )
        .output(z.object({ id: z.string() }))
        .build();

      const inputShape = getSchemaShape(contract['~orpc'].inputSchema as unknown);
      expect(inputShape).toBeDefined();
      expect(inputShape.body).toBeDefined();
      expect(inputShape.query).toBeDefined();

      // params and headers should be normalized to empty object schemas
      const paramsShape = getSchemaShape(inputShape.params);
      const headersShape = getSchemaShape(inputShape.headers);
      expect(Object.keys(paramsShape)).toHaveLength(0);
      expect(Object.keys(headersShape)).toHaveLength(0);
    });

    it('compacts detailed output by omitting empty headers/body for status-only responses', () => {
      const contract = new RouteBuilder({ method: 'DELETE' })
        .output((b) => b.status(204))
        .build();

      const outputShape = getSchemaShape(contract['~orpc'].outputSchema as unknown);
      expect(outputShape).toBeDefined();
      expect(outputShape.status).toBeDefined();

      const headersShape = getSchemaShape(outputShape.headers);
      expect(Object.keys(headersShape)).toHaveLength(0);
      if (outputShape.body === undefined) {
        expect(outputShape.body).toBeUndefined();
      } else {
        const bodyShape = getSchemaShape(outputShape.body);
        expect(Object.keys(bodyShape)).toHaveLength(0);
      }
    });

    it('keeps headers/body in output when explicitly set', () => {
      const contract = new RouteBuilder({ method: 'GET' })
        .output((b) =>
          b
            .status(200)
            .headers({ etag: z.string() })
            .body(z.object({ data: z.array(z.string()) }))
        )
        .build();

      const outputShape = getSchemaShape(contract['~orpc'].outputSchema as unknown);
      expect(outputShape.status).toBeDefined();
      expect(outputShape.headers).toBeDefined();
      expect(outputShape.body).toBeDefined();
    });
  });
});
