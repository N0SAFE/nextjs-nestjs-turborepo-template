import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../core/modules/database/services/database.service";
import { user } from "@/config/drizzle/schema/auth";
import { eq, desc, asc, like, count, and, SQL, gte, lte, gt, lt, ilike } from "drizzle-orm";
import { randomUUID } from "crypto";
import type {
  UserCreateInput,
  UserUpdateInput,
  UserListInput,
  User,
} from "@repo/api-contracts/types";

// Re-export types for repository use
export type CreateUserInput = UserCreateInput;
export type UpdateUserInput = UserUpdateInput;
export type GetUsersInput = UserListInput;
export type GetUserOutput = User | null;

@Injectable()
export class UserRepository {
    constructor(private readonly databaseService: DatabaseService) {}

    /**
     * Transform user object for API response (serialize dates)
     */
    private transformUser<
        T extends {
            createdAt: Date;
            updatedAt: Date;
        }
    >(user: T): Omit<T, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };
    private transformUser<
        T extends {
            createdAt: Date;
            updatedAt: Date;
        } | null
    >(user: T): (Omit<NonNullable<T>, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string }) | null;
    private transformUser<
        T extends {
            createdAt: Date;
            updatedAt: Date;
        } | null
    >(user: T) {
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
    private transformUsers<T extends {
      createdAt: Date,
      updatedAt: Date
    }>(users: T[]): (Omit<T, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string })[] {
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
                image: input.image ?? null,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return this.transformUser(newUser[0] ?? null);
    }

    /**
     * Find user by ID
     */
    async findById(id: string) {
        const foundUser = await this.databaseService.db.select().from(user).where(eq(user.id, id)).limit(1);

        return this.transformUser(foundUser[0] ?? null);
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string) {
        const foundUser = await this.databaseService.db.select().from(user).where(eq(user.email, email)).limit(1);

        return this.transformUser(foundUser[0] ?? null);
    }

    /**
     * Find all users with pagination and filtering
     */
    async findMany(input: GetUsersInput) {
        // Build the where conditions with new filter structure
        const conditions: SQL[] = [];

        // Handle new filter operators for each field
        // ID filters
        if (input.id) {
            conditions.push(eq(user.id, input.id));
        }

        // Name filters with operators
        if (input.name) {
            conditions.push(eq(user.name, input.name));
        }
        if (input.name_like) {
            conditions.push(like(user.name, `%${input.name_like}%`));
        }
        if (input.name_ilike) {
            conditions.push(ilike(user.name, `%${input.name_ilike}%`));
        }

        // Email filters with operators
        if (input.email) {
            conditions.push(eq(user.email, input.email));
        }
        if (input.email_like) {
            conditions.push(like(user.email, `%${input.email_like}%`));
        }
        if (input.email_ilike) {
            conditions.push(ilike(user.email, `%${input.email_ilike}%`));
        }

        // EmailVerified filter
        if (input.emailVerified !== undefined) {
            conditions.push(eq(user.emailVerified, input.emailVerified));
        }

        // CreatedAt filters with operators
        if (input.createdAt_gt) {
            conditions.push(gt(user.createdAt, new Date(input.createdAt_gt)));
        }
        if (input.createdAt_gte) {
            conditions.push(gte(user.createdAt, new Date(input.createdAt_gte)));
        }
        if (input.createdAt_lt) {
            conditions.push(lt(user.createdAt, new Date(input.createdAt_lt)));
        }
        if (input.createdAt_lte) {
            conditions.push(lte(user.createdAt, new Date(input.createdAt_lte)));
        }
        if (input.createdAt_between) {
            conditions.push(
                and(
                    gte(user.createdAt, new Date(input.createdAt_between.from)),
                    lte(user.createdAt, new Date(input.createdAt_between.to))
                )!
            );
        }

        const whereCondition = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;

        // Build the order by condition - now uses sortBy and sortDirection
        let orderByCondition: SQL;

        if (!input.sortBy) {
            // Default sorting when no sort is provided
            orderByCondition = desc(user.createdAt);
        } else {
            const direction = input.sortDirection === "asc" ? asc : desc;
            switch (input.sortBy) {
                case "name":
                    orderByCondition = direction(user.name);
                    break;
                case "email":
                    orderByCondition = direction(user.email);
                    break;
                case "createdAt":
                    orderByCondition = direction(user.createdAt);
                    break;
                case "updatedAt":
                    orderByCondition = direction(user.updatedAt);
                    break;
                default:
                    throw new Error(`Unsupported sort field: ${input.sortBy as string}`);
            }
        }

        // Execute the main query with all conditions
        const users = whereCondition
            ? await this.databaseService.db.select().from(user).where(whereCondition).orderBy(orderByCondition).limit(input.limit).offset(input.offset)
            : await this.databaseService.db.select().from(user).orderBy(orderByCondition).limit(input.limit).offset(input.offset);

        // Get total count for pagination info
        const totalResult = whereCondition
            ? await this.databaseService.db.select({ count: count() }).from(user).where(whereCondition)
            : await this.databaseService.db.select({ count: count() }).from(user);

        const total = totalResult[0]?.count ?? 0;

        return {
            data: this.transformUsers(users),
            meta: {
                total,
                limit: input.limit,
                offset: input.offset,
                hasMore: input.offset + input.limit < total,
            },
        };
    }

    /**
     * Update user by ID
     */
    async update(id: string, input: Omit<UpdateUserInput, "id">) {
        const updatedUser = await this.databaseService.db
            .update(user)
            .set({
                ...input,
                createdAt: new Date(input.createdAt ?? Date.now()),
                updatedAt: new Date(),
            })
            .where(eq(user.id, id))
            .returning();

        return this.transformUser(updatedUser[0] ?? null);
    }

    /**
     * Delete user by ID
     */
    async delete(id: string) {
        const deletedUser = await this.databaseService.db.delete(user).where(eq(user.id, id)).returning();

        return this.transformUser(deletedUser[0] ?? null);
    }

    /**
     * Check if user exists by email
     */
    async existsByEmail(email: string): Promise<boolean> {
        const existingUser = await this.databaseService.db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);

        return existingUser.length > 0;
    }

    /**
     * Get user count
     */
    async getCount(): Promise<number> {
        const result = await this.databaseService.db.select({ count: count() }).from(user);

        return result[0]?.count ?? 0;
    }
}
