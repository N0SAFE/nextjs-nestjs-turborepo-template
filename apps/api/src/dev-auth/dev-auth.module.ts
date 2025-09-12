import { Module } from '@nestjs/common';
import { DevAuthController } from './controllers/dev-auth.controller';
import { DevAuthService } from './services/dev-auth.service';

@Module({
  controllers: [DevAuthController],
  providers: [DevAuthService],
  exports: [DevAuthService],
})
export class DevAuthModule {}