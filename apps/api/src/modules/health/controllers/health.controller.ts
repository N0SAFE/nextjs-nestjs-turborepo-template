import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { HealthService } from '../services/health.service';
import { healthContract } from '@repo/api-contracts';
import { AllowAnonymous } from '@/core/modules/auth/decorators/decorators';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Implement the entire health contract
   */
  @AllowAnonymous()
  @Implement(healthContract.check)
  check() {
    return implement(healthContract.check).handler(() => {
      return this.healthService.getHealth();
    });
  }

  @Implement(healthContract.detailed)
  detailed() {
    return implement(healthContract.detailed).handler(async () => {
      return await this.healthService.getDetailedHealth();
    });
  }
}
