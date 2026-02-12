import { Injectable } from '@nestjs/common';
import { like, and, gte, gt, lte, lt, eq, ilike } from 'drizzle-orm';
import { listBuilder } from '@/core/utils/drizzle-filter.utils';
import type { OrganizationListAllInput } from '@repo/api-contracts/modules/organization/listAll';
import { DatabaseService } from '@/core/modules/database/services/database.service';
import { organization } from '@/config/drizzle/schema/auth';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * List all organizations with pagination, sorting, and filtering
   * Used by the admin panel to display all organizations in the system
   */
  async listAll(input: OrganizationListAllInput) {
    return listBuilder(input.filter)
      .filter({
        id: (entry) => {
          switch (entry.operator) {
            case 'eq': return eq(organization.id, entry.value);
          }
        },
        name: (entry) => {
          switch (entry.operator) {
            case 'eq':    return eq(organization.name, entry.value);
            case 'like':  return like(organization.name, `%${entry.value}%`);
            case 'ilike': return ilike(organization.name, `%${entry.value}%`);
          }
        },
        slug: (entry) => {
          switch (entry.operator) {
            case 'eq':    return eq(organization.slug, entry.value);
            case 'like':  return like(organization.slug, `%${entry.value}%`);
            case 'ilike': return ilike(organization.slug, `%${entry.value}%`);
          }
        },
        createdAt: (entry) => {
          switch (entry.operator) {
            case 'gt':  return gt(organization.createdAt, new Date(entry.value));
            case 'gte': return gte(organization.createdAt, new Date(entry.value));
            case 'lt':  return lt(organization.createdAt, new Date(entry.value));
            case 'lte': return lte(organization.createdAt, new Date(entry.value));
            case 'between': {
              const [from, to] = entry.value;
              return and(
                gte(organization.createdAt, new Date(from)),
                lte(organization.createdAt, new Date(to))
              );
            }
          }
        },
      })
      .order(input.sortBy, input.sortDirection, {
        name: organization.name,
        slug: organization.slug,
        createdAt: organization.createdAt,
      }, organization.createdAt)
      .pagination({ limit: input.limit, offset: input.offset })
      .execute(this.databaseService.db, organization);
  }
}
