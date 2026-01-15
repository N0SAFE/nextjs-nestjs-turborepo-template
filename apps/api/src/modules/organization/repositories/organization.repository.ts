import { Injectable } from '@nestjs/common';
import type { SQL } from 'drizzle-orm';
import { desc, like, asc, and, gte, gt, lte, lt, eq, ilike, count } from 'drizzle-orm';
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
    // Build the where conditions
    const conditions: (SQL | undefined)[] = [];

    // ID filter
    if (input.id) {
      conditions.push(eq(organization.id, input.id));
    }

    // Name filters with operators
    if (input.name) {
      conditions.push(eq(organization.name, input.name));
    }
    if (input.name_like) {
      conditions.push(like(organization.name, `%${input.name_like}%`));
    }
    if (input.name_ilike) {
      conditions.push(ilike(organization.name, `%${input.name_ilike}%`));
    }

    // Slug filters with operators
    if (input.slug) {
      conditions.push(eq(organization.slug, input.slug));
    }
    if (input.slug_like) {
      conditions.push(like(organization.slug, `%${input.slug_like}%`));
    }
    if (input.slug_ilike) {
      conditions.push(ilike(organization.slug, `%${input.slug_ilike}%`));
    }

    // CreatedAt filters with operators
    if (input.createdAt_gt) {
      conditions.push(gt(organization.createdAt, new Date(input.createdAt_gt)));
    }
    if (input.createdAt_gte) {
      conditions.push(gte(organization.createdAt, new Date(input.createdAt_gte)));
    }
    if (input.createdAt_lt) {
      conditions.push(lt(organization.createdAt, new Date(input.createdAt_lt)));
    }
    if (input.createdAt_lte) {
      conditions.push(lte(organization.createdAt, new Date(input.createdAt_lte)));
    }
    if (input.createdAt_between) {
      conditions.push(
        and(
          gte(organization.createdAt, new Date(input.createdAt_between.from)),
          lte(organization.createdAt, new Date(input.createdAt_between.to))
        )
      );
    }

    const whereCondition = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;

    // Build the order by condition
    let orderByCondition: SQL;

    if (!input.sortBy) {
      // Default sorting when no sort is provided
      orderByCondition = desc(organization.createdAt);
    } else {
      const direction = input.sortDirection === 'asc' ? asc : desc;
      switch (input.sortBy) {
        case 'name':
          orderByCondition = direction(organization.name);
          break;
        case 'slug':
          orderByCondition = direction(organization.slug);
          break;
        case 'createdAt':
          orderByCondition = direction(organization.createdAt);
          break;
        case 'updatedAt':
          // Note: updatedAt doesn't exist in the schema, so we'll use createdAt
          orderByCondition = direction(organization.createdAt);
          break;
        default:
          throw new Error(`Unsupported sort field: ${input.sortBy}`);
      }
    }

    // Execute the main query with all conditions
    const organizations = whereCondition
      ? await this.databaseService.db
          .select()
          .from(organization)
          .where(whereCondition)
          .orderBy(orderByCondition)
          .limit(input.limit)
          .offset(input.offset)
      : await this.databaseService.db
          .select()
          .from(organization)
          .orderBy(orderByCondition)
          .limit(input.limit)
          .offset(input.offset);

    // Get total count for pagination info
    const totalResult = whereCondition
      ? await this.databaseService.db.select({ count: count() }).from(organization).where(whereCondition)
      : await this.databaseService.db.select({ count: count() }).from(organization);

    const total = totalResult[0]?.count ?? 0;

    return {
      data: organizations,
      meta: {
        total,
        limit: input.limit,
        offset: input.offset,
        hasMore: input.offset + input.limit < total,
      },
    };
  }
}
