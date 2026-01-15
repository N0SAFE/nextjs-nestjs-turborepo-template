import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../repositories/organization.repository';
import type { OrganizationListAllInput } from '@repo/api-contracts/modules/organization/listAll';

@Injectable()
export class OrganizationService {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  /**
   * Get all organizations (admin endpoint)
   */
  async listAll(input: OrganizationListAllInput) {
    return this.organizationRepository.listAll(input);
  }
}
