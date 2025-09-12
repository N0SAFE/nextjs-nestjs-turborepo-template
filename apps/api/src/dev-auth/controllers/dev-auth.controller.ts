import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { devAuthContract } from '@repo/api-contracts';
import { DevAuthService } from '../services/dev-auth.service';

@Controller()
export class DevAuthController {
  constructor(private readonly devAuthService: DevAuthService) {}

  @Implement(devAuthContract.getSeededUsers)
  getSeededUsers() {
    return implement(devAuthContract.getSeededUsers).handler(async () => {
      return await this.devAuthService.getSeededUsers();
    });
  }

  @Implement(devAuthContract.loginWithApiKey)
  loginWithApiKey() {
    return implement(devAuthContract.loginWithApiKey).handler(async ({ input }) => {
      return await this.devAuthService.loginWithApiKey(input);
    });
  }
}