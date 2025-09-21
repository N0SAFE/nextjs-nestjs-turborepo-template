import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { HealthService } from './services/health.service';
import { HealthRepository } from './repositories/health.repository';
import { DatabaseModule } from '../../core/modules/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [HealthService, HealthRepository],
  exports: [HealthService, HealthRepository],
})
export class HealthModule {}
