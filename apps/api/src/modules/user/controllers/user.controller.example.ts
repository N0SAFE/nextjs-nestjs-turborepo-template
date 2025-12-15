import { Controller } from "@nestjs/common";
import { Implement } from "@orpc/nest";
import { userContract } from "@repo/api-contracts";
import { UserService } from "../services/user.service";
import { withAuth } from "@/core/modules/auth/orpc/contract-middleware";

/**
 * Example controller demonstrating the withAuth pattern for applying middleware
 * to all procedures in a contract at once.
 * 
 * Instead of calling `.use(requireAuth())` on each method:
 * 
 * ```ts
 * @Implement(userContract.list)
 * list() {
 *   return implement(userContract.list).use(requireAuth()).handler(...)
 * }
 * ```
 * 
 * We create a single implementer with middleware pre-applied:
 * 
 * ```ts
 * const impl = withAuth(userContract);
 * 
 * @Implement(userContract.list)
 * list() {
 *   return impl.list.handler(...)
 * }
 * ```
 * 
 * Benefits:
 * - Less repetition
 * - Centralized middleware configuration
 * - Full type safety preserved
 * - Easy to add/remove middleware for all methods
 */

// Create implementer with auth middleware pre-applied to ALL procedures
const impl = withAuth(userContract);

@Controller()
export class UserControllerWithMiddleware {
    constructor(private readonly userService: UserService) {}

    /**
     * Note: The @Implement decorator is still required for NestJS route registration,
     * but the actual implementation uses the pre-configured `impl` object.
     */
    @Implement(userContract.list)
    list() {
        // Use impl.list instead of implement(userContract.list).use(requireAuth())
        return impl.list.handler(async ({ input }) => {
            const result = await this.userService.getUsers(input);
            return {
                users: result.users.map((user) => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    image: user.image,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                })),
                meta: result.meta,
            };
        });
    }

    @Implement(userContract.findById)
    findById() {
        return impl.findById.handler(async ({ input }) => {
            return await this.userService.findUserById(input.id);
        });
    }

    @Implement(userContract.create)
    create() {
        return impl.create.handler(async ({ input }) => {
            const user = await this.userService.createUser(input);
            if (!user) {
                throw new Error("Failed to create user");
            }
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                image: user.image,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        });
    }

    @Implement(userContract.update)
    update() {
        return impl.update.handler(async ({ input }) => {
            const user = await this.userService.updateUser(input.id, input);
            if (!user) {
                throw new Error("User not found");
            }
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                image: user.image,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        });
    }

    @Implement(userContract.delete)
    delete() {
        return impl.delete.handler(async ({ input }) => {
            const user = await this.userService.deleteUser(input.id);
            if (!user) {
                return { success: false, message: "User not found" };
            }
            return { success: true };
        });
    }

    @Implement(userContract.checkEmail)
    checkEmail() {
        return impl.checkEmail.handler(async ({ input }) => {
            return await this.userService.checkUserExistsByEmail(input.email);
        });
    }

    @Implement(userContract.count)
    count() {
        return impl.count.handler(async () => {
            return await this.userService.getUserCount();
        });
    }
}
