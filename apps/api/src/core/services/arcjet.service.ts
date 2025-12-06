import { Injectable } from '@nestjs/common';
import { createArcjetService, ArcjetService as BaseArcjetService } from '@repo/arcjet';
import { EnvService } from '@/config/env/env.service';

/**
 * NestJS-injectable Arcjet service
 * Wraps the @repo/arcjet service with dependency injection
 */
@Injectable()
export class ArcjetService {
  private readonly arcjet: BaseArcjetService;

  constructor(private readonly envService: EnvService) {
    // Initialize Arcjet with API key from environment
    // In dev mode, use a test key or skip if not provided
    const arcjetKey = process.env.ARCJET_KEY || 'test_key_dev_mode';
    this.arcjet = createArcjetService(arcjetKey);
  }

  /**
   * Get the underlying Arcjet service instance
   * Use this to access the service methods and create middleware
   */
  getInstance(): BaseArcjetService {
    return this.arcjet;
  }
}
