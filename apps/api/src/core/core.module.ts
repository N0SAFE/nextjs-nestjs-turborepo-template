import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { DatabaseModule } from "./modules/database/database.module";

@Module({
    imports: [],
    providers: [AuthModule, DatabaseModule],
    exports: [AuthModule, DatabaseModule],
})
export class CoreModule {}
