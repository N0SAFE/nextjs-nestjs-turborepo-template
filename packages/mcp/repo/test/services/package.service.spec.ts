import { describe, it, expect } from 'vitest';
import { PackageService } from '../../src/services/package.service.js';

describe('PackageService', () => {
  it('should be defined', () => {
    const service = new PackageService();
    expect(service).toBeDefined();
  });

  it('should list packages', async () => {
    const service = new PackageService();
    const packages = await service.listPackages();
    
    expect(Array.isArray(packages)).toBe(true);
  });
});
