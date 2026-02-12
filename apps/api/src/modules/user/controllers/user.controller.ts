import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { userContract } from "@repo/api-contracts";
import { UserService } from "../services/user.service";
import { requireAuth } from "@/core/modules/auth/orpc/middlewares";
import { PLATFORM_ROLES } from '../../../../../../packages/utils/auth/src/permissions/config';

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Implement(userContract.list)
    list() {
        return implement(userContract.list).use(requireAuth()).handler(async ({ input }) => {
            const result = await this.userService.getUsers(input.query);
            return {
                data: result.data.map((user) => ({
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
        return implement(userContract.findById).use(requireAuth()).handler(async ({ input }) => {
            const userId = input.params.id;
            if (!userId) {
                throw new Error("Missing user id parameter");
            }
            const user = await this.userService.findUserById(userId);
            if (!user) {
                return null;
            }
            return {
                ...user,
                role: user.role as typeof PLATFORM_ROLES[number],
                banned: user.banned ?? undefined,
            };
        });
    }

    @Implement(userContract.create)
    create() {
        return implement(userContract.create).use(requireAuth()).handler(async ({ input }) => {
            const user = await this.userService.createUser(input);
            if (!user) {
                throw new Error("Failed to create user");
            }
            return {
                status: 201,
                headers: {},
                body: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    image: user.image,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            };
        });
    }

    @Implement(userContract.update)
    update() {
        return implement(userContract.update).use(requireAuth()).handler(async ({ input }) => {
            const { id, ...updateData } = input;
            const user = await this.userService.updateUser(id, updateData);
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
        return implement(userContract.delete).use(requireAuth()).handler(async ({ input }) => {
            const userId = input.params.id;
            if (!userId) {
                throw new Error("Missing user id parameter");
            }
            const user = await this.userService.deleteUser(userId);
            if (!user) {
                return { success: false, message: "User not found" };
            }
            return { success: true, message: undefined };
        });
    }

    @Implement(userContract.checkEmail)
    checkEmail() {
        return implement(userContract.checkEmail).use(requireAuth()).handler(async ({ input }) => {
            return await this.userService.checkUserExistsByEmail(input.email);
        });
    }

    @Implement(userContract.count)
    count() {
        return implement(userContract.count).handler(async ({ context }) => {
            context.auth.requireAuth();
            return await this.userService.getUserCount();
        });
    }
}
