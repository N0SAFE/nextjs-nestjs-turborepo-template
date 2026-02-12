import { describe, it, expect } from 'vitest';
import { implement } from '@orpc/nest';
import { userContract } from '@repo/api-contracts';

/**
 * These tests verify that the ORPC implement function supports the .use() method
 * for applying middleware at the router level, which is the foundation for the
 * withAuth, withAccessControl, and withMiddleware helper functions.
 * 
 * Note: The actual contract-middleware helper functions use dynamic property access
 * to call the .use() method on the Proxy returned by implement(). This works at
 * runtime but some test environments may have issues with Proxy behavior.
 */
describe('contract-middleware foundation', () => {
  it('should verify implement returns object with use method available', () => {
    const impl = implement(userContract);
    
    // The use method is available via Proxy
    expect(typeof (impl as any).use).toBe('function');
  });

  it('should verify implement returns all contract procedures', () => {
    const impl = implement(userContract);
    
    expect(impl.list).toBeDefined();
    expect(impl.findById).toBeDefined();
    expect(impl.create).toBeDefined();
    expect(impl.update).toBeDefined();
    expect(impl.delete).toBeDefined();
    expect(impl.checkEmail).toBeDefined();
    expect(impl.count).toBeDefined();
  });

  it('should verify each procedure has handler method', () => {
    const impl = implement(userContract);
    
    expect(typeof impl.list.handler).toBe('function');
    expect(typeof impl.findById.handler).toBe('function');
    expect(typeof impl.create.handler).toBe('function');
  });

  it('should verify each procedure has use method for chaining', () => {
    const impl = implement(userContract);
    
    expect(typeof impl.list.use).toBe('function');
    expect(typeof impl.findById.use).toBe('function');
    expect(typeof impl.create.use).toBe('function');
  });
});
