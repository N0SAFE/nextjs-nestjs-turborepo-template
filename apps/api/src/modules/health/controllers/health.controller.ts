import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { HealthService } from '../services/health.service';
import { healthContract } from '@repo/api-contracts';
import { requireAuth } from '@/core/modules/auth/orpc/middlewares';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Implement the entire health contract
   * This endpoint is public (no auth required)
   */
  @Implement(healthContract.check)
  check() {
    return implement(healthContract.check).handler(() => {
      return this.healthService.getHealth();
    });
  }

  @Implement(healthContract.detailed)
  detailed() {
    return implement(healthContract.detailed).use(requireAuth()).handler(async () => {
      return await this.healthService.getDetailedHealth();
    });
  }
}
