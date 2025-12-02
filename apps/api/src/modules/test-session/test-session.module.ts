import { Module } from '@nestjs/common';
import { TestSessionController } from './test-session.controller';

@Module({
  controllers: [TestSessionController],
})
export class TestSessionModule {}
