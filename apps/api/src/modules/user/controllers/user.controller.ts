import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { userContract } from "@repo/api-contracts";
import { UserService } from "../services/user.service";

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Implement(userContract.list)
    list() {
        return implement(userContract.list).handler(async ({ input }) => {
            const result = await this.userService.getUsers(input);
            return {
                users: result.users
                    .filter((user): user is NonNullable<typeof user> => user !== null)
                    .map((user) => ({
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
        return implement(userContract.findById).handler(async ({ input }) => {
            return await this.userService.findUserById(input.id);
        });
    }

    @Implement(userContract.create)
    create() {
        return implement(userContract.create).handler(async ({ input }) => {
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
        return implement(userContract.update).handler(async ({ input }) => {
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
        return implement(userContract.delete).handler(async ({ input }) => {
            const user = await this.userService.deleteUser(input.id);
            if (!user) {
                return { success: false, message: "User not found" };
            }
            return { success: true };
        });
    }

    @Implement(userContract.checkEmail)
    checkEmail() {
        return implement(userContract.checkEmail).handler(async ({ input }) => {
            return await this.userService.checkUserExistsByEmail(input.email);
        });
    }

    @Implement(userContract.count)
    count() {
        return implement(userContract.count).handler(async () => {
            return await this.userService.getUserCount();
        });
    }
}
