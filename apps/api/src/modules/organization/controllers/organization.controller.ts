import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { organizationAdminContract } from '@repo/api-contracts';
import { OrganizationService } from '../services/organization.service';
import { requireAuth, requirePlatformRole } from '@/core/modules/auth/orpc/middlewares';

@Controller()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Implement(organizationAdminContract.listAll)
  listAll() {
    return implement(organizationAdminContract.listAll)
      .use(requireAuth())
      .use(requirePlatformRole(['admin', 'superAdmin']))  // Only admins can view all organizations
      .handler(async ({ input }) => {
        return await this.organizationService.listAll(input);
      });
  }
}
