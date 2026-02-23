import { Injectable } from '@nestjs/common';
import { and, asc, eq, SQL } from 'drizzle-orm';
import { listBuilder } from '@/core/utils/drizzle-filter.utils';
import type { OrganizationListAllInput } from '@repo/api-contracts/modules/organization/listAll';
import type { OrganizationListMembersInput } from '@repo/api-contracts/modules/organization/listMembers';
import { DatabaseService } from '@/core/modules/database/services/database.service';
import { organization, member, user } from '@/config/drizzle/schema/auth';

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
        id: (entry) => entry.common.eq(organization.id),
        name: (entry) => {
          switch (entry.operator) {
            case 'eq':    return entry.common.eq(organization.name);
            case 'like':  return entry.common.like(organization.name);
            case 'ilike': return entry.common.ilike(organization.name);
          }
        },
        slug: (entry) => {
          switch (entry.operator) {
            case 'eq':    return entry.common.eq(organization.slug);
            case 'like':  return entry.common.like(organization.slug);
            case 'ilike': return entry.common.ilike(organization.slug);
          }
        },
        createdAt: (entry) => {
          switch (entry.operator) {
            case 'gt':  return entry.common.gt(organization.createdAt);
            case 'gte': return entry.common.gte(organization.createdAt);
            case 'lt':  return entry.common.lt(organization.createdAt);
            case 'lte': return entry.common.lte(organization.createdAt);
            case 'between': return entry.common.between(organization.createdAt);
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

  /**
   * List members of an organization with pagination and filtering
   */
  async listMembers(input: OrganizationListMembersInput) {
    const db = this.databaseService.db;
    const limit = input.limit;
    const offset = input.offset;
    const orgIdFilter = input.filter?.organizationId;

    const conditions: SQL[] = [];
    if (orgIdFilter?.operator === 'eq') {
      conditions.push(eq(member.organizationId, orgIdFilter.value));
    }

    const roleFilter = input.filter?.role;
    if (roleFilter?.operator === 'eq') {
      conditions.push(eq(member.role, roleFilter.value));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: member.id,
        organizationId: member.organizationId,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(member)
      .leftJoin(user, eq(member.userId, user.id))
      .where(whereClause)
      .orderBy(asc(member.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: rows,
      meta: {
        total: rows.length,
        limit,
        offset,
        hasMore: rows.length === limit,
      },
    };
  }
}
