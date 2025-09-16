import { Injectable } from '@nestjs/common';
import { HealthRepository } from '../repositories/health.repository';

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  /**
   * Basic health check
   */
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'nestjs-api',
    };
  }

  /**
   * Readiness check
   */
  async getReadiness() {
    // Check if all required services are ready
    const dbHealth = await this.healthRepository.checkDatabaseHealth();
    
    const isReady = dbHealth.status === 'ok';
    
    return {
      status: isReady ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
      service: 'nestjs-api',
    };
  }

  /**
   * Liveness check
   */
  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'nestjs-api',
    };
  }

  /**
   * Detailed health check
   */
  async getDetailedHealth() {
    const dbHealth = await this.healthRepository.checkDatabaseHealth();
    const memory = this.healthRepository.getMemoryInfo();
    const uptime = this.healthRepository.getUptime();

    const isHealthy = dbHealth.status === 'ok';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'nestjs-api',
      uptime,
      memory,
      database: dbHealth,
    };
  }
}
