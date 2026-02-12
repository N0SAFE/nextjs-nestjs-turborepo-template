import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../core/modules/database/services/database.service";
import { user } from "@/config/drizzle/schema/auth";
import { eq, like, and, count, gte, lte, gt, lt, ilike } from "drizzle-orm";
import { listBuilder } from "@/core/utils/drizzle-filter.utils";
import { randomUUID } from "crypto";
import type {
  UserCreateInput,
  UserUpdateInput,
  User,
} from "@repo/api-contracts/types";
import type { UserListInput } from "@repo/api-contracts/modules/user/list";

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
        const result = await listBuilder(input.filter)
            .filter({
                id: ({ operator, value }) => {
                    switch (operator) {
                        case "eq": return eq(user.id, value);
                    }
                },
                name: ({ operator, value }) => {
                    switch (operator) {
                        case "eq":    return eq(user.name, value);
                        case "like":  return like(user.name, `%${value}%`);
                        case "ilike": return ilike(user.name, `%${value}%`);
                    }
                },
                email: ({ operator, value }) => {
                    switch (operator) {
                        case "eq":    return eq(user.email, value);
                        case "like":  return like(user.email, `%${value}%`);
                        case "ilike": return ilike(user.email, `%${value}%`);
                    }
                },
                emailVerified: ({ operator, value }) => {
                    switch (operator) {
                        case "eq": return eq(user.emailVerified, value);
                    }
                },
                createdAt: ({ operator, value }) => {
                    switch (operator) {
                        case "gt":  return gt(user.createdAt, new Date(value));
                        case "gte": return gte(user.createdAt, new Date(value));
                        case "lt":  return lt(user.createdAt, new Date(value));
                        case "lte": return lte(user.createdAt, new Date(value));
                        case "between": {
                            const [from, to] = value;
                            return and(
                                gte(user.createdAt, new Date(from)),
                                lte(user.createdAt, new Date(to))
                            );
                        }
                    }
                },
            })
            .order(input.sortBy, input.sortDirection, {
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }, user.createdAt)
            .pagination({ limit: input.limit, offset: input.offset })
            .execute(this.databaseService.db, user);

        return {
            data: this.transformUsers(result.data),
            meta: result.meta,
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
