import { Module, Global } from "@nestjs/common";
import { DatabaseService } from "./services/database.service";
import { DATABASE_CONNECTION } from "./database-connection";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../../config/drizzle/schema";
import { EnvService } from "../../../config/env/env.service";
import { EnvModule } from "../../../config/env/env.module";

@Global()
@Module({
    imports: [EnvModule],
    providers: [
        DatabaseService,
        {
            provide: DATABASE_CONNECTION,
            useFactory: (envService: EnvService) => {
                const pool = new Pool({
                    connectionString: envService.get('DATABASE_URL')
                });
                return drizzle(pool, {
                    schema: schema
                });
            },
            inject: [EnvService]
        }
    ],
    exports: [DatabaseService, DATABASE_CONNECTION]
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DatabaseModule {}
