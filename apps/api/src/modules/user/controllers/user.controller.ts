import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { userContract } from '@repo/api-contracts';
import { UserService } from '../services/user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Implement(userContract.list)
  list() {
    return implement(userContract.list).handler(async ({ input }) => {
      return await this.userService.getUsers(input);
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
      return await this.userService.createUser(input);
    });
  }

  @Implement(userContract.update)
  update() {
    return implement(userContract.update).handler(async ({ input }) => {
      return await this.userService.updateUser(input.id, input);
    });
  }

  @Implement(userContract.delete)
  delete() {
    return implement(userContract.delete).handler(async ({ input }) => {
      return await this.userService.deleteUser(input.id);
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
