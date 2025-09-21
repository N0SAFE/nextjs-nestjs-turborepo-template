import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../core/modules/database/services/database.service";
import { user } from "@/config/drizzle/schema/auth";
import { eq, desc, asc, like, count, and, SQL } from "drizzle-orm";
import {
  userCreateInput,
  userUpdateInput,
  userListInput,
} from "@repo/api-contracts";
import { z } from "zod";
import { randomUUID } from "crypto";

export type CreateUserInput = z.infer<typeof userCreateInput>;
export type UpdateUserInput = z.infer<typeof userUpdateInput>;
export type GetUsersInput = z.infer<typeof userListInput>;

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Transform user object for API response (serialize dates)
   */
  private transformUser(user: any) {
    if (!user) {
      return null;
    }
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Transform multiple users for API response
   */
  private transformUsers(users: any[]) {
    return users.map((user) => this.transformUser(user));
  }

  /**
   * Create a new user
   */
  async create(input: CreateUserInput) {
    const newUser = await this.databaseService.db
      .insert(user)
      .values({
        id: randomUUID(),
        name: input.name,
        email: input.email,
        image: input.image || null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return this.transformUser(newUser[0]);
  }

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const foundUser = await this.databaseService.db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return this.transformUser(foundUser[0] || null);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    const foundUser = await this.databaseService.db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    return this.transformUser(foundUser[0] || null);
  }

  /**
   * Find all users with pagination and filtering
   */
  async findMany(input: GetUsersInput) {
    // Build the where conditions
    const conditions: SQL<unknown>[] = [];

    if (input.filter?.name) {
      conditions.push(like(user.name, `%${input.filter.name}%`));
    }

    if (input.filter?.email) {
      conditions.push(like(user.email, `%${input.filter.email}%`));
    }

    if (input.filter?.id) {
      conditions.push(eq(user.id, input.filter.id));
    }

    const whereCondition =
      conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]
          : and(...conditions)
        : undefined;

    // Build the order by condition
    let orderByCondition;
    
    if (!input.sort) {
      // Default sorting when no sort is provided
      orderByCondition = desc(user.createdAt);
    } else {
      switch (input.sort.field) {
        case "id":
          orderByCondition =
            input.sort.direction === "asc" ? asc(user.id) : desc(user.id);
          break;
        case "name":
          orderByCondition =
            input.sort.direction === "asc" ? asc(user.name) : desc(user.name);
          break;
        case "email":
          orderByCondition =
            input.sort.direction === "asc" ? asc(user.email) : desc(user.email);
          break;
        case "emailVerified":
          orderByCondition =
            input.sort.direction === "asc" ? asc(user.emailVerified) : desc(user.emailVerified);
          break;
        case "image":
          orderByCondition =
            input.sort.direction === "asc" ? asc(user.image) : desc(user.image);
          break;
        case "createdAt":
          orderByCondition =
            input.sort.direction === "asc" ? asc(user.createdAt) : desc(user.createdAt);
          break;
        case "updatedAt":
          orderByCondition =
            input.sort.direction === "asc" ? asc(user.updatedAt) : desc(user.updatedAt);
          break;
        default:
          throw new Error(`Unsupported sort field: ${input.sort.field}`);
      }
    }

    // Execute the main query with all conditions
    const users = whereCondition
      ? await this.databaseService.db
          .select()
          .from(user)
          .where(whereCondition)
          .orderBy(orderByCondition)
          .limit(input.pagination.limit)
          .offset(input.pagination.offset)
      : await this.databaseService.db
          .select()
          .from(user)
          .orderBy(orderByCondition)
          .limit(input.pagination.limit)
          .offset(input.pagination.offset);

    // Get total count for pagination info
    const totalResult = whereCondition
      ? await this.databaseService.db
          .select({ count: count() })
          .from(user)
          .where(whereCondition)
      : await this.databaseService.db.select({ count: count() }).from(user);

    const total = totalResult[0]?.count || 0;

    return {
      users: this.transformUsers(users),
      meta: {
        pagination: {
          total,
          limit: input.pagination.limit,
          offset: input.pagination.offset,
          hasMore: input.pagination.offset + input.pagination.limit < total,
        },
      },
    };
  }

  /**
   * Update user by ID
   */
  async update(id: string, input: UpdateUserInput) {
    const updatedUser = await this.databaseService.db
      .update(user)
      .set({
        ...input,
        createdAt: new Date(input.createdAt || Date.now()),
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning();

    return this.transformUser(updatedUser[0] || null);
  }

  /**
   * Delete user by ID
   */
  async delete(id: string) {
    const deletedUser = await this.databaseService.db
      .delete(user)
      .where(eq(user.id, id))
      .returning();

    return this.transformUser(deletedUser[0] || null);
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const existingUser = await this.databaseService.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    return existingUser.length > 0;
  }

  /**
   * Get user count
   */
  async getCount(): Promise<number> {
    const result = await this.databaseService.db
      .select({ count: count() })
      .from(user);

    return result[0]?.count || 0;
  }
}
