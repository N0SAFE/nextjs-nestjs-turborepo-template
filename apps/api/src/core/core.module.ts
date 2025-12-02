import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { DatabaseModule } from "./modules/database/database.module";
import { PushModule } from "./modules/push/push.module";

@Module({
    imports: [],
    providers: [AuthModule, DatabaseModule, PushModule],
    exports: [AuthModule, DatabaseModule, PushModule],
})
export class CoreModule {}
