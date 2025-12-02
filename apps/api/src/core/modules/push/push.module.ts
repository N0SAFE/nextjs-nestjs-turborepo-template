import { Module } from "@nestjs/common";
import { PushService } from "./services/push.service";
import { PushRepository } from "./repositories/push.repository";
import { PushController } from "./controllers/push.controller";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [PushController],
  providers: [PushService, PushRepository],
  exports: [PushService],
})
export class PushModule {}
