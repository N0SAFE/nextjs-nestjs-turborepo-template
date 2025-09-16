import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DatabaseService } from "./services/database.service";
import { DATABASE_CONNECTION } from "./database-connection";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../../config/drizzle/schema";
import type { AppConfig } from "../../../config/app.config";

@Global()
@Module({
    providers: [
        DatabaseService,
        {
            provide: DATABASE_CONNECTION,
            useFactory: (configService: ConfigService<AppConfig>) => {
                const pool = new Pool({
                    connectionString: configService.get('databaseUrl', { infer: true })
                });
                return drizzle(pool, {
                    schema: schema
                });
            },
            inject: [ConfigService]
        }
    ],
    exports: [DatabaseService, DATABASE_CONNECTION]
})
export class DatabaseModule {}
