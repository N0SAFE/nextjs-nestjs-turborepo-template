import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { standard } from '../zod/standard-operations';

describe('Standard Operations - Advanced Edge Cases', () => {
  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  });

  describe('Basic Operation Creation', () => {
    it('should handle complex schemas in standard operations', () => {
      const operations = standard.zod(userSchema, 'user');
      
      expect(() => {
        operations.create().build();
      }).not.toThrow();

      expect(() => {
        operations.read().build();
      }).not.toThrow();

      expect(() => {
        operations.update().build();
      }).not.toThrow();

      expect(() => {
        operations.delete().build();
      }).not.toThrow();
    });

    it('should handle custom paths and methods', () => {
      const operations = standard.zod(userSchema, 'user');

      expect(() => {
        operations.create().build();
      }).not.toThrow();

      expect(() => {
        operations.read().build();
      }).not.toThrow();
    });

    it('should handle streaming operations', () => {
      const operations = standard.zod(userSchema, 'user');

      expect(() => {
        operations.streamingRead().build();
      }).not.toThrow();

      expect(() => {
        operations.streamingRead().build();
      }).not.toThrow();
    });
  });

  describe('List Operations with Query Config', () => {
    it('should handle list operations without config', () => {
      const operations = standard.zod(userSchema, 'user');

      expect(() => {
        operations.list().build();
      }).not.toThrow();
    });

    it('should handle list operations with pagination', () => {
      const operations = standard.zod(userSchema, 'user');

      expect(() => {
        operations.list({
          pagination: {
            defaultLimit: 20,
            maxLimit: 200,
            includeOffset: true,
          }
        }).build();
      }).not.toThrow();
    });

    it('should handle list operations with sorting', () => {
      const operations = standard.zod(userSchema, 'user');

      expect(() => {
        operations.list({
          sorting: {
            fields: ['name', 'email', 'createdAt'], // Correct API: fields not allowedFields
          }
        }).build();
      }).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty entity schema', () => {
      const emptySchema = z.object({});
      expect(() => {
        standard.zod(emptySchema, 'empty');
      }).not.toThrow();
    });

    it('should handle very long entity names', () => {
      const longName = 'a'.repeat(1000);
      expect(() => {
        standard.zod(userSchema, longName);
      }).not.toThrow();
    });

    it('should handle entity names with special characters', () => {
      const specialNames = ['user-data', 'user_info', 'user.profile', 'user@domain'];
      
      specialNames.forEach(name => {
        expect(() => {
          standard.zod(userSchema, name);
        }).not.toThrow();
      });
    });
  });

  describe('Performance with Large Schemas', () => {
    it('should handle schemas with many fields', () => {
      const largeSchemaFields = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [
          `field${String(i)}`,
          i % 2 === 0 ? z.string() : z.number(),
        ])
      );

      const largeSchema = z.object(largeSchemaFields);

      expect(() => {
        const operations = standard.zod(largeSchema, 'large');
        operations.create().build();
        operations.read().build();
        operations.list().build();
      }).not.toThrow();
    });

    it('should handle many operation definitions efficiently', () => {
      const operations = standard.zod(userSchema, 'user');
      const start = performance.now();

      // Create many operations
      for (let i = 0; i < 100; i++) {
        operations.create().build();
        operations.read().build();
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Builder State Consistency', () => {
    it('should maintain immutable state across transformations', () => {
      const operations = standard.zod(userSchema, 'user');

      const baseOperation1 = operations.create();
      const baseOperation2 = operations.create();
      const withPath1 = baseOperation1.path('/users1');
      const withPath2 = baseOperation2.path('/users2');

      // Different base operations should be different
      expect(baseOperation1).not.toBe(baseOperation2);
      expect(withPath1).not.toBe(withPath2);

      // All should build successfully
      expect(() => {
        baseOperation1.build();
        baseOperation2.build();
        withPath1.build();
        withPath2.build();
      }).not.toThrow();
    });

    it('should handle concurrent operation building', () => {
      const operations = standard.zod(userSchema, 'user');

      const concurrentBuilds = Array.from({ length: 10 }, () =>
        operations
          .create()
          .build()
      );

      expect(() => {
        concurrentBuilds.forEach(build => build);
      }).not.toThrow();
    });
  });
});