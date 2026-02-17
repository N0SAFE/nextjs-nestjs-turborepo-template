import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { RouteBuilder } from '../core/route-builder';

describe('PathParams - Template Literal API', () => {
  describe('Basic path param creation', () => {
    it('should create single path param with template literal', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/${p('id', z.uuid())}`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/{id}');
    });

    it('should create multiple path params', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/orgs/${p('orgId', z.uuid())}/users/${p('userId', z.uuid())}`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/orgs/{orgId}/users/{userId}');
    });

    it('should handle nested path structure', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/api/v1/resources/${p('resourceId', z.string())}/items/${p('itemId', z.number().int())}`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/api/v1/resources/{resourceId}/items/{itemId}');
    });

    it('should handle path param at start', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`${p('tenantId', z.string())}/data`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('{tenantId}/data');
    });

    it('should handle path param at end', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/items/${p('id', z.string())}`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/items/{id}');
    });
  });

  describe('Path param schemas', () => {
    it('should support z.uuid() schema', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/${p('id', z.uuid())}`))
        .build();
      
      expect(route).toBeDefined();
    });

    it('should support z.string() schema', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/${p('slug', z.string())}`))
        .build();
      
      expect(route).toBeDefined();
    });

    it('should support z.number() schema', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/${p('page', z.number().int().positive())}`))
        .build();
      
      expect(route).toBeDefined();
    });

    it('should support z.coerce.number() schema', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/${p('id', z.coerce.number())}`))
        .build();
      
      expect(route).toBeDefined();
    });

    it('should support z.enum() schema', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/${p('status', z.enum(['active', 'inactive']))}`))
        .build();
      
      expect(route).toBeDefined();
    });
  });

  describe('Object definition + template pattern', () => {
    it('should define params in object and reference in template', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(
          { orgId: z.uuid(), userId: z.uuid() },
          p => p`/orgs/${p.orgId}/users/${p.userId}`
        ));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/orgs/{orgId}/users/{userId}');
    });

    it('should allow mixing new params with object-defined params', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(
          { orgId: z.uuid() },
          p => p`/orgs/${p.orgId}/users/${p('userId', z.uuid())}`
        ));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/orgs/{orgId}/users/{userId}');
    });
  });

  describe('Chained params calls', () => {
    it('should chain params calls and preserve path', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b
          .params(p => p`/orgs/${p('orgId', z.uuid())}`)
          .params(p => p`${p.orgId}/users/${p('userId', z.uuid())}`)
        );
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('{orgId}/users/{userId}');
    });

    it('should allow body after params', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(b => b
          .params(p => p`/users/${p('id', z.uuid())}`)
          .body(z.object({ name: z.string() }))
        );
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/users/{id}');
    });

    it('should allow query after params', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b
          .params(p => p`/users/${p('id', z.uuid())}`)
          .query(z.object({ include: z.string().optional() }))
        );
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/users/{id}');
    });
  });

  describe('Params type overrides', () => {
    it('should override param type with object notation', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b
          .params(p => p`/users/${p('id', z.string())}`)
          .params({ id: z.uuid() })
        );
      
      // Path should remain unchanged
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/users/{id}');
    });
  });

  describe('Wildcard params', () => {
    it('should create wildcard path param', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/files/${p.wildcard('path', z.string())}`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/files/*path');
    });

    it('should handle wildcard at end of path', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/proxy/${p.wildcard('url', z.string())}`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/proxy/*url');
    });
  });
});

describe('PathParams - Input Schema Building', () => {
  describe('Schema structure', () => {
    it('should build detailed input schema with params', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/users/${p('id', z.uuid())}`))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should combine params with body in detailed input', () => {
      const route = new RouteBuilder({ method: 'PUT' })
        .input(b => b
          .params(p => p`/users/${p('id', z.uuid())}`)
          .body(z.object({ name: z.string(), email: z.email() }))
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should combine params with query in detailed input', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b
          .params(p => p`/users/${p('id', z.uuid())}`)
          .query(z.object({ fields: z.string().optional() }))
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should combine params, query, body in detailed input', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(b => b
          .params(p => p`/orgs/${p('orgId', z.uuid())}/users`)
          .query(z.object({ notify: z.boolean().default(false) }))
          .body(z.object({ name: z.string(), email: z.email() }))
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });
});

describe('PathParams - Edge Cases', () => {
  describe('Empty and minimal paths', () => {
    it('should handle root path', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .path('/');
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/');
    });

    it('should handle path with no params', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/users/list`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/users/list');
    });
  });

  describe('Special characters in static path segments', () => {
    it('should handle hyphens in path', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/api-v2/users/${p('id', z.uuid())}`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/api-v2/users/{id}');
    });

    it('should handle underscores in path', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/user_profiles/${p('id', z.uuid())}`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/user_profiles/{id}');
    });
  });

  describe('Multiple same-named params error prevention', () => {
    it('should allow different param names', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.params(p => p`/users/${p('userId', z.uuid())}/posts/${p('postId', z.uuid())}`));
      
      const metadata = route.getRouteMetadata();
      expect(metadata.path).toBe('/users/{userId}/posts/{postId}');
    });
  });
});
