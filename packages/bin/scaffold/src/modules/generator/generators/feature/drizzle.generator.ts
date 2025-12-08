/**
 * Drizzle ORM Generator
 *
 * Sets up Drizzle ORM with PostgreSQL for type-safe database operations.
 * Includes schema, migrations, and connection setup.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  ScriptSpec,
} from "../../../../types/generator.types";

@Injectable()
export class DrizzleGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "drizzle",
    priority: 30,
    version: "1.0.0",
    description: "Drizzle ORM with PostgreSQL integration",
    contributesTo: ["apps/api/src/db/**", "drizzle.config.ts"],
    dependsOn: ["nestjs", "postgresql"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Drizzle config
    files.push(
      this.file("apps/api/drizzle.config.ts", this.getDrizzleConfig(), {
        mergeStrategy: "replace",
        priority: 30,
      }),
    );

    // Schema file
    files.push(
      this.file("apps/api/src/db/drizzle/schema/index.ts", this.getSchemaIndex(), {
        mergeStrategy: "replace",
        priority: 30,
      }),
    );

    // User schema
    files.push(
      this.file("apps/api/src/db/drizzle/schema/user.schema.ts", this.getUserSchema(), {
        mergeStrategy: "replace",
        priority: 30,
      }),
    );

    // Database module for NestJS
    files.push(
      this.file("apps/api/src/db/drizzle.module.ts", this.getDrizzleModule(), {
        mergeStrategy: "replace",
        priority: 30,
      }),
    );

    // Database service
    files.push(
      this.file("apps/api/src/db/drizzle.service.ts", this.getDrizzleService(), {
        mergeStrategy: "replace",
        priority: 30,
      }),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      { name: "drizzle-orm", version: "^0.39.0", type: "prod", target: "apps/api", pluginId: "drizzle" },
      { name: "postgres", version: "^3.4.5", type: "prod", target: "apps/api", pluginId: "drizzle" },
      { name: "drizzle-kit", version: "^0.30.0", type: "dev", target: "apps/api", pluginId: "drizzle" },
    ];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      { name: "db:generate", command: "drizzle-kit generate", target: "apps/api", description: "Generate migrations", pluginId: "drizzle" },
      { name: "db:push", command: "drizzle-kit push", target: "apps/api", description: "Push schema changes", pluginId: "drizzle" },
      { name: "db:migrate", command: "drizzle-kit migrate", target: "apps/api", description: "Run migrations", pluginId: "drizzle" },
      { name: "db:studio", command: "drizzle-kit studio", target: "apps/api", description: "Open Drizzle Studio", pluginId: "drizzle" },
    ];
  }

  private getDrizzleConfig(): string {
    return `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/drizzle/schema/index.ts",
  out: "./src/db/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
`;
  }

  private getSchemaIndex(): string {
    return `export * from "./user.schema";
`;
  }

  private getUserSchema(): string {
    return `import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`;
  }

  private getDrizzleModule(): string {
    return `import { Global, Module } from "@nestjs/common";
import { DrizzleService } from "./drizzle.service";

@Global()
@Module({
  providers: [DrizzleService],
  exports: [DrizzleService],
})
export class DrizzleModule {}
`;
  }

  private getDrizzleService(): string {
    return `import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./drizzle/schema";

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private client: ReturnType<typeof postgres> | null = null;
  private _db: PostgresJsDatabase<typeof schema> | null = null;

  get db(): PostgresJsDatabase<typeof schema> {
    if (!this._db) {
      throw new Error("Database not initialized");
    }
    return this._db;
  }

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined");
    }

    this.client = postgres(connectionString);
    this._db = drizzle(this.client, { schema });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.end();
    }
  }
}
`;
  }
}
