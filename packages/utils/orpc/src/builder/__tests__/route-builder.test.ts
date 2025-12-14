import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { RouteBuilder } from '../route-builder';

describe('RouteBuilder', () => {
  describe('Basic Route Creation', () => {
    it('should create a simple route with input and output', () => {
      const route = new RouteBuilder()
        .input(z.object({ name: z.string() }))
        .output(z.object({ message: z.string() }))
        .build();
      
      expect(route).toBeDefined();
    });

    it('should create route with only output', () => {
      const route = new RouteBuilder()
        .output(z.object({ data: z.string() }))
        .build();
      
      expect(route).toBeDefined();
    });

    it('should create route with description', () => {
      const route = new RouteBuilder()
        .input(z.object({ id: z.string() }))
        .output(z.object({ user: z.object({ name: z.string() }) }))
        .description('Get user by ID')
        .build();
      
      expect(route).toBeDefined();
    });
  });

  describe('Route Builder with InputBuilder', () => {
    it('should use inputBuilder to transform input schema', () => {
      const baseSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
      });
      
      const route = new RouteBuilder()
        .input(baseSchema)
        .inputBuilder((builder) => builder.pick(['id', 'name']))
        .output(z.object({ success: z.boolean() }))
        .build();
      
      expect(route).toBeDefined();
    });

    it('should chain multiple inputBuilder transformations', () => {
      const baseSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        age: z.number(),
      });
      
      const route = new RouteBuilder()
        .input(baseSchema)
        .inputBuilder((builder) =>
          builder
            .omit(['age'])
            .extend({ role: z.string().default('user') })
        )
        .output(z.object({ success: z.boolean() }))
        .build();
      
      expect(route).toBeDefined();
    });
  });

  describe('Route Builder with OutputBuilder', () => {
    it('should use outputBuilder to transform output schema', () => {
      const outputSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        password: z.string(),
      });
      
      const route = new RouteBuilder()
        .input(z.object({ id: z.string() }))
        .output(outputSchema)
        .outputBuilder((builder) => builder.omit(['password']))
        .build();
      
      expect(route).toBeDefined();
    });

    it('should chain multiple outputBuilder transformations', () => {
      const outputSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
      });
      
      const route = new RouteBuilder()
        .input(z.object({ id: z.string() }))
        .output(outputSchema)
        .outputBuilder((builder) => 
          builder
            .extend({ timestamp: z.number() })
            .partial(['email'])
        )
        .build();
      
      expect(route).toBeDefined();
    });
  });

  describe('Route Builder with Both Input and Output Builders', () => {
    it('should apply both inputBuilder and outputBuilder', () => {
      const inputSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
      });
      
      const outputSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        password: z.string(),
      });
      
      const route = new RouteBuilder()
        .input(inputSchema)
        .inputBuilder((builder) => builder.pick(['id']))
        .output(outputSchema)
        .outputBuilder((builder) => builder.omit(['password']))
        .build();
      
      expect(route).toBeDefined();
    });
  });

  describe('Route with Metadata', () => {
    it('should create route with custom metadata', () => {
      const route = new RouteBuilder()
        .input(z.object({ id: z.string() }))
        .output(z.object({ user: z.any() }))
        .description('Fetch user by ID')
        .build();
      
      expect(route).toBeDefined();
    });

    it('should handle route without input', () => {
      const route = new RouteBuilder()
        .output(z.object({ data: z.array(z.any()) }))
        .description('List all items')
        .build();
      
      expect(route).toBeDefined();
    });
  });

  describe('Complex Route Scenarios', () => {
    it('should handle nested schemas with builders', () => {
      const inputSchema = z.object({
        user: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        metadata: z.object({
          source: z.string(),
          timestamp: z.number(),
        }),
      });
      
      const outputSchema = z.object({
        success: z.boolean(),
        user: z.object({
          id: z.string(),
          name: z.string(),
        }),
      });
      
      const route = new RouteBuilder()
        .input(inputSchema)
        .inputBuilder((builder) => 
          builder.custom((schema) => 
            schema.extend({ processed: z.boolean().default(false) })
          )
        )
        .output(outputSchema)
        .build();
      
      expect(route).toBeDefined();
    });

    it('should handle routes with partial and defaults', () => {
      const inputSchema = z.object({
        name: z.string(),
        email: z.string(),
        role: z.string(),
      });
      
      const route = new RouteBuilder()
        .input(inputSchema)
        .inputBuilder((builder) => 
          builder
            .partial(['email'])
            .addDefaults({ role: 'user' })
        )
        .output(z.object({ created: z.boolean() }))
        .build();
      
      expect(route).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input schema', () => {
      const route = new RouteBuilder()
        .input(z.object({}))
        .output(z.object({ data: z.any() }))
        .build();
      
      expect(route).toBeDefined();
    });

    it('should handle empty output schema', () => {
      const route = new RouteBuilder()
        .input(z.object({ id: z.string() }))
        .output(z.object({}))
        .build();
      
      expect(route).toBeDefined();
    });

    it('should handle route without builders', () => {
      const route = new RouteBuilder()
        .input(z.object({ id: z.string() }))
        .output(z.object({ name: z.string() }))
        .build();
      
      expect(route).toBeDefined();
    });
  });

  describe('Type Safety Validation', () => {
    it('should maintain type safety through transformations', () => {
      const inputSchema = z.object({
        id: z.string(),
        name: z.string(),
      });
      
      const outputSchema = z.object({
        id: z.string(),
        name: z.string(),
        createdAt: z.string(),
      });
      
      const route = new RouteBuilder()
        .input(inputSchema)
        .inputBuilder((builder) => builder.extend({ active: z.boolean() }))
        .output(outputSchema)
        .outputBuilder((builder) => builder.omit(['createdAt']))
        .build();
      
      expect(route).toBeDefined();
    });
  });

  describe('Static Factory Methods', () => {
    describe('Health Check Endpoints', () => {
      it('should create health check endpoint', () => {
        const healthRoute = RouteBuilder.health().build();
        expect(healthRoute).toBeDefined();
      });

      it('should create readiness probe endpoint', () => {
        const readyRoute = RouteBuilder.ready().build();
        expect(readyRoute).toBeDefined();
      });

      it('should create liveness probe endpoint', () => {
        const liveRoute = RouteBuilder.live().build();
        expect(liveRoute).toBeDefined();
      });
    });

    describe('Generic Operations', () => {
      it('should create checkExists endpoint', () => {
        const checkRoute = RouteBuilder.checkExists(
          z.object({ email: z.email() })
        ).build();
        expect(checkRoute).toBeDefined();
      });

      it('should create action endpoint', () => {
        const actionRoute = RouteBuilder.action(
          z.object({
            userId: z.string(),
            message: z.string(),
          }),
          z.object({ success: z.boolean() }),
          { actionName: 'sendNotification' }
        ).build();
        expect(actionRoute).toBeDefined();
      });
    });

    describe('Async Job Operations', () => {
      it('should create triggerJob endpoint', () => {
        const triggerRoute = RouteBuilder.triggerJob(
          z.object({
            format: z.enum(['csv', 'json']),
            filters: z.object({}).optional(),
          })
        ).build();
        expect(triggerRoute).toBeDefined();
      });

      it('should create jobStatus endpoint', () => {
        const statusRoute = RouteBuilder.jobStatus(
          z.object({ data: z.string() })
        ).build();
        expect(statusRoute).toBeDefined();
      });

      it('should create streamJobProgress endpoint', () => {
        const streamRoute = RouteBuilder.streamJobProgress(
          z.object({ data: z.string() })
        ).build();
        expect(streamRoute).toBeDefined();
      });
    });

    describe('File Operations', () => {
      it('should create upload endpoint', () => {
        const uploadRoute = RouteBuilder.upload().build();
        expect(uploadRoute).toBeDefined();
      });

      it('should create download endpoint', () => {
        const downloadRoute = RouteBuilder.download().build();
        expect(downloadRoute).toBeDefined();
      });
    });

    describe('Webhook Operations', () => {
      it('should create webhook endpoint', () => {
        const webhookRoute = RouteBuilder.webhook(
          z.object({
            type: z.string(),
            data: z.any(),
          }),
          { path: '/webhooks/stripe' }
        ).build();
        expect(webhookRoute).toBeDefined();
      });
    });

    describe('System Endpoints', () => {
      it('should create metrics endpoint', () => {
        const metricsRoute = RouteBuilder.metrics().build();
        expect(metricsRoute).toBeDefined();
      });

      it('should create config endpoint', () => {
        const configRoute = RouteBuilder.config(
          z.object({
            maxUploadSize: z.number(),
            allowedTypes: z.array(z.string()),
          })
        ).build();
        expect(configRoute).toBeDefined();
      });

      it('should create version endpoint', () => {
        const versionRoute = RouteBuilder.version().build();
        expect(versionRoute).toBeDefined();
      });
    });
  });
});
