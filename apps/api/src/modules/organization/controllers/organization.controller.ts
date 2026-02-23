import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { appContract } from '@repo/api-contracts';
import { OrganizationService } from '../services/organization.service';
import { requireAuth } from '@/core/modules/auth/orpc/middlewares';

@Controller()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Implement(appContract.organization.admin.listAll)
  listAll() {
    return implement(appContract.organization.admin.listAll)
      .use(requireAuth())
      .handler(async ({ input }) => {
        return await this.organizationService.listAll(input.query);
      });
  }

  @Implement(appContract.organization.admin.listMembers)
  listMembers() {
    return implement(appContract.organization.admin.listMembers)
      .use(requireAuth())
      .handler(async ({ input }) => {
        return await this.organizationService.listMembers(input.query);
      });
  }
}
