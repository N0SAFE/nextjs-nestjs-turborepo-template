import { Module } from "@nestjs/common";
import { TestController } from "./controllers/test.controller";
import { ArcjetService } from "@/core/services/arcjet.service";
import { EnvModule } from "@/config/env/env.module";

@Module({
    imports: [EnvModule],
    controllers: [TestController],
    providers: [ArcjetService],
})
export class TestModule {
}