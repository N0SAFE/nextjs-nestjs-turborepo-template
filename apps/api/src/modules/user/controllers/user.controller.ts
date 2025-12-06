import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { userContract } from "@repo/api-contracts";
import { UserService } from "../services/user.service";
import { requireAuth } from "@/core/modules/auth/orpc/middlewares";

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Implement(userContract.list)
    list() {
        return implement(userContract.list).use(requireAuth()).handler(async ({ input }) => {
            const result = await this.userService.getUsers(input as any);
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
            return await this.userService.findUserById((input as any).id);
        });
    }

    @Implement(userContract.create)
    create() {
        return implement(userContract.create).use(requireAuth()).handler(async ({ input }) => {
            const user = await this.userService.createUser(input as any);
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
        return implement(userContract.update).use(requireAuth()).handler(async ({ input }) => {
            const typedInput = input as any;
            const user = await this.userService.updateUser(typedInput.id, typedInput);
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
            const user = await this.userService.deleteUser((input as any).id);
            if (!user) {
                return { success: false, message: "User not found" };
            }
            return { success: true, message: undefined };
        });
    }

    @Implement(userContract.checkEmail)
    checkEmail() {
        return implement(userContract.checkEmail).use(requireAuth()).handler(async ({ input }) => {
            return await this.userService.checkUserExistsByEmail((input as any).email);
        });
    }

    @Implement(userContract.count)
    count() {
        return implement(userContract.count).use(requireAuth()).handler(async () => {
            return await this.userService.getUserCount();
        });
    }
}
