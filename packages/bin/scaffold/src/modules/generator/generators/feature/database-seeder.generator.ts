/**
 * Database Seeder Generator
 *
 * Sets up database seeding infrastructure with version tracking,
 * seed command, example seeds, and reset functionality.
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
export class DatabaseSeederGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "database-seeder",
    priority: 31,
    version: "1.0.0",
    description: "Database seeding with version tracking and CLI commands",
    contributesTo: ["apps/api/src/db/seeds/**", "apps/api/src/commands/**"],
    dependsOn: ["drizzle"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Seed version tracking schema
    files.push(
      this.file("apps/api/src/db/drizzle/schema/seed-version.schema.ts", this.getSeedVersionSchema(), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Update schema index to include seed version
    files.push(
      this.file("apps/api/src/db/drizzle/schema/index.ts", this.getUpdatedSchemaIndex(context), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Seeder service
    files.push(
      this.file("apps/api/src/db/seeds/seeder.service.ts", this.getSeederService(), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Seeder module
    files.push(
      this.file("apps/api/src/db/seeds/seeder.module.ts", this.getSeederModule(), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Base seed class
    files.push(
      this.file("apps/api/src/db/seeds/base.seed.ts", this.getBaseSeed(), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Seed types
    files.push(
      this.file("apps/api/src/db/seeds/seed.types.ts", this.getSeedTypes(), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Example user seed
    files.push(
      this.file("apps/api/src/db/seeds/seeders/001-users.seed.ts", this.getUsersSeed(context), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Seeders index
    files.push(
      this.file("apps/api/src/db/seeds/seeders/index.ts", this.getSeedersIndex(), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Seeds index
    files.push(
      this.file("apps/api/src/db/seeds/index.ts", this.getSeedsIndex(), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Seed command (CLI)
    files.push(
      this.file("apps/api/src/commands/seed.command.ts", this.getSeedCommand(), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Commands index
    files.push(
      this.file("apps/api/src/commands/index.ts", this.getCommandsIndex(context), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Commands module
    files.push(
      this.file("apps/api/src/commands/commands.module.ts", this.getCommandsModule(context), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    // Seed script for package.json
    files.push(
      this.file("apps/api/scripts/seed.ts", this.getSeedScript(), {
        mergeStrategy: "replace",
        priority: 31,
      }),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      { name: "nest-commander", version: "^3.15.0", type: "prod", target: "apps/api", pluginId: "database-seeder" },
      { name: "@faker-js/faker", version: "^9.3.0", type: "dev", target: "apps/api", pluginId: "database-seeder" },
    ];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      { name: "db:seed", command: "bun run scripts/seed.ts", target: "apps/api", description: "Run database seeds", pluginId: "database-seeder" },
      { name: "db:seed:fresh", command: "bun run scripts/seed.ts --fresh", target: "apps/api", description: "Reset and run all seeds", pluginId: "database-seeder" },
      { name: "db:seed:status", command: "bun run scripts/seed.ts --status", target: "apps/api", description: "Show seed status", pluginId: "database-seeder" },
    ];
  }

  private getSeedVersionSchema(): string {
    return `import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

/**
 * Seed version tracking table
 * Records which seeds have been run and their status
 */
export const seedVersions = pgTable("seed_versions", {
  id: text("id").primaryKey(), // Seed file name/identifier
  version: integer("version").notNull().default(1),
  name: text("name").notNull(),
  description: text("description"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  executionTimeMs: integer("execution_time_ms"),
  success: boolean("success").notNull().default(true),
  error: text("error"),
  checksum: text("checksum"), // Hash of seed content for change detection
});

export type SeedVersion = typeof seedVersions.$inferSelect;
export type NewSeedVersion = typeof seedVersions.$inferInsert;
`;
  }

  private getUpdatedSchemaIndex(context: GeneratorContext): string {
    let exports = `export * from "./user.schema";
export * from "./seed-version.schema";
`;

    // Add better-auth schema if enabled
    if (this.hasPlugin(context, "better-auth")) {
      exports += `export * from "./auth.schema";
`;
    }

    return exports;
  }

  private getSeederService(): string {
    return `import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";
import { seedVersions, type NewSeedVersion, type SeedVersion } from "../drizzle/schema/seed-version.schema";
import type { BaseSeed, SeedContext, SeedResult } from "./base.seed";
import { createHash } from "crypto";

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  private readonly seeds: Map<string, BaseSeed> = new Map();

  constructor(private readonly drizzle: DrizzleService) {}

  /**
   * Register a seed class
   */
  register(seed: BaseSeed): void {
    this.seeds.set(seed.id, seed);
    this.logger.debug(\`Registered seed: \${seed.id}\`);
  }

  /**
   * Get all registered seeds sorted by order
   */
  getSeeds(): BaseSeed[] {
    return Array.from(this.seeds.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get seed status from database
   */
  async getStatus(seedId: string): Promise<SeedVersion | null> {
    const results = await this.drizzle.db
      .select()
      .from(seedVersions)
      .where(eq(seedVersions.id, seedId))
      .limit(1);
    return results[0] || null;
  }

  /**
   * Get all seed statuses
   */
  async getAllStatuses(): Promise<SeedVersion[]> {
    return this.drizzle.db.select().from(seedVersions);
  }

  /**
   * Check if a seed needs to run
   */
  async needsRun(seed: BaseSeed): Promise<boolean> {
    const status = await this.getStatus(seed.id);
    if (!status) return true;

    // Check if seed content changed (via checksum)
    const currentChecksum = this.calculateChecksum(seed);
    if (status.checksum && status.checksum !== currentChecksum) {
      this.logger.log(\`Seed \${seed.id} content changed, needs re-run\`);
      return true;
    }

    // Check version
    if (seed.version > status.version) {
      this.logger.log(\`Seed \${seed.id} has new version (\${status.version} -> \${seed.version})\`);
      return true;
    }

    return false;
  }

  /**
   * Calculate checksum for seed content detection
   */
  private calculateChecksum(seed: BaseSeed): string {
    const content = JSON.stringify({
      id: seed.id,
      version: seed.version,
      // Include seed class name as part of checksum
      className: seed.constructor.name,
    });
    return createHash("md5").update(content).digest("hex");
  }

  /**
   * Run a single seed
   */
  async runSeed(seed: BaseSeed, context: SeedContext): Promise<SeedResult> {
    const startTime = Date.now();
    const seedVersion: NewSeedVersion = {
      id: seed.id,
      version: seed.version,
      name: seed.name,
      description: seed.description,
      checksum: this.calculateChecksum(seed),
      success: false,
    };

    try {
      this.logger.log(\`Running seed: \${seed.name} (v\${seed.version})\`);

      // Check dependencies
      for (const depId of seed.dependsOn) {
        const depStatus = await this.getStatus(depId);
        if (!depStatus || !depStatus.success) {
          throw new Error(\`Dependency seed '\${depId}' not completed\`);
        }
      }

      // Run the seed
      const result = await seed.run(context);
      const executionTime = Date.now() - startTime;

      // Record success
      seedVersion.success = true;
      seedVersion.executionTimeMs = executionTime;
      
      await this.drizzle.db
        .insert(seedVersions)
        .values(seedVersion)
        .onConflictDoUpdate({
          target: seedVersions.id,
          set: {
            version: seedVersion.version,
            executedAt: new Date(),
            executionTimeMs: executionTime,
            success: true,
            error: null,
            checksum: seedVersion.checksum,
          },
        });

      this.logger.log(\`Seed \${seed.name} completed in \${executionTime}ms\`);
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Record failure
      seedVersion.success = false;
      seedVersion.error = errorMessage;
      seedVersion.executionTimeMs = executionTime;

      await this.drizzle.db
        .insert(seedVersions)
        .values(seedVersion)
        .onConflictDoUpdate({
          target: seedVersions.id,
          set: {
            executedAt: new Date(),
            executionTimeMs: executionTime,
            success: false,
            error: errorMessage,
          },
        });

      this.logger.error(\`Seed \${seed.name} failed: \${errorMessage}\`);
      throw error;
    }
  }

  /**
   * Run all pending seeds
   */
  async runAll(options: { fresh?: boolean; verbose?: boolean } = {}): Promise<void> {
    const seeds = this.getSeeds();
    const context: SeedContext = {
      db: this.drizzle.db,
      logger: this.logger,
      verbose: options.verbose ?? false,
    };

    if (options.fresh) {
      this.logger.log("Fresh seed requested, clearing seed history...");
      await this.drizzle.db.delete(seedVersions);
    }

    for (const seed of seeds) {
      const needsRun = options.fresh || await this.needsRun(seed);
      if (needsRun) {
        await this.runSeed(seed, context);
      } else {
        this.logger.debug(\`Skipping seed \${seed.id} (already completed)\`);
      }
    }
  }

  /**
   * Reset all seeds (delete data and seed history)
   */
  async reset(): Promise<void> {
    const seeds = this.getSeeds().reverse(); // Run in reverse order

    for (const seed of seeds) {
      if (seed.down) {
        this.logger.log(\`Rolling back seed: \${seed.name}\`);
        await seed.down({ db: this.drizzle.db, logger: this.logger, verbose: false });
      }
    }

    await this.drizzle.db.delete(seedVersions);
    this.logger.log("All seeds reset");
  }
}
`;
  }

  private getSeederModule(): string {
    return `import { Module, OnModuleInit } from "@nestjs/common";
import { SeederService } from "./seeder.service";
import { DrizzleModule } from "../drizzle.module";
import { getAllSeeds } from "./seeders";

@Module({
  imports: [DrizzleModule],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule implements OnModuleInit {
  constructor(private readonly seeder: SeederService) {}

  onModuleInit() {
    // Register all seeds
    const seeds = getAllSeeds();
    for (const Seed of seeds) {
      this.seeder.register(new Seed());
    }
  }
}
`;
  }

  private getBaseSeed(): string {
    return `import type { Logger } from "@nestjs/common";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../drizzle/schema";

/**
 * Context passed to seed functions
 */
export interface SeedContext {
  db: PostgresJsDatabase<typeof schema>;
  logger: Logger;
  verbose: boolean;
}

/**
 * Result of a seed run
 */
export interface SeedResult {
  recordsCreated: number;
  recordsUpdated?: number;
  recordsDeleted?: number;
  details?: Record<string, unknown>;
}

/**
 * Base class for all database seeds
 */
export abstract class BaseSeed {
  /** Unique identifier for this seed */
  abstract readonly id: string;

  /** Human-readable name */
  abstract readonly name: string;

  /** Description of what this seed does */
  abstract readonly description?: string;

  /** Version number (increment to re-run seed) */
  readonly version: number = 1;

  /** Order in which seeds should run (lower = earlier) */
  readonly order: number = 100;

  /** IDs of seeds that must run before this one */
  readonly dependsOn: string[] = [];

  /**
   * Run the seed
   */
  abstract run(context: SeedContext): Promise<SeedResult>;

  /**
   * Optional: Rollback/undo the seed
   */
  down?(context: SeedContext): Promise<void>;
}
`;
  }

  private getSeedTypes(): string {
    return `export type { SeedContext, SeedResult, BaseSeed } from "./base.seed";
export type { SeedVersion, NewSeedVersion } from "../drizzle/schema/seed-version.schema";

/**
 * Seed options for CLI command
 */
export interface SeedOptions {
  /** Run all seeds from scratch */
  fresh?: boolean;
  /** Show detailed output */
  verbose?: boolean;
  /** Only show status, don't run */
  status?: boolean;
  /** Reset all seeds (rollback and clear history) */
  reset?: boolean;
  /** Run specific seed by ID */
  only?: string;
}

/**
 * Seed class constructor type
 */
export type SeedClass = new () => BaseSeed;
`;
  }

  private getUsersSeed(context: GeneratorContext): string {
    const hasBetterAuth = this.hasPlugin(context, "better-auth");
    
    if (hasBetterAuth) {
      return `import { BaseSeed, type SeedContext, type SeedResult } from "../base.seed";
import { users } from "../../drizzle/schema/user.schema";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";

/**
 * Seed initial users
 */
export class UsersSeed extends BaseSeed {
  readonly id = "001-users";
  readonly name = "Users Seed";
  readonly description = "Creates initial user accounts for development";
  readonly version = 1;
  readonly order = 100;
  readonly dependsOn: string[] = [];

  async run(context: SeedContext): Promise<SeedResult> {
    const { db, logger, verbose } = context;
    let created = 0;

    // Create admin user
    const adminEmail = "admin@example.com";
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        email: adminEmail,
        name: "Admin User",
        emailVerified: true,
        role: "admin",
      });
      created++;
      if (verbose) logger.log(\`Created admin user: \${adminEmail}\`);
    }

    // Create test users
    const testUsers = [
      { email: "user@example.com", name: "Test User", role: "user" as const },
      { email: "demo@example.com", name: "Demo User", role: "user" as const },
    ];

    for (const userData of testUsers) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(users).values({
          ...userData,
          emailVerified: true,
        });
        created++;
        if (verbose) logger.log(\`Created user: \${userData.email}\`);
      }
    }

    // Create random users for development
    if (process.env.NODE_ENV === "development") {
      const randomCount = 10;
      for (let i = 0; i < randomCount; i++) {
        const email = faker.internet.email().toLowerCase();
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(users).values({
            email,
            name: faker.person.fullName(),
            emailVerified: faker.datatype.boolean(),
            role: "user",
          });
          created++;
          if (verbose) logger.log(\`Created random user: \${email}\`);
        }
      }
    }

    return { recordsCreated: created };
  }

  async down(context: SeedContext): Promise<void> {
    const { db, logger } = context;
    // Only delete seeded users, not real users
    const seededEmails = [
      "admin@example.com",
      "user@example.com",
      "demo@example.com",
    ];

    for (const email of seededEmails) {
      await db.delete(users).where(eq(users.email, email));
    }
    logger.log("Rolled back users seed");
  }
}
`;
    }

    // Without better-auth (simpler user schema)
    return `import { BaseSeed, type SeedContext, type SeedResult } from "../base.seed";
import { users } from "../../drizzle/schema/user.schema";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";

/**
 * Seed initial users
 */
export class UsersSeed extends BaseSeed {
  readonly id = "001-users";
  readonly name = "Users Seed";
  readonly description = "Creates initial user accounts for development";
  readonly version = 1;
  readonly order = 100;
  readonly dependsOn: string[] = [];

  async run(context: SeedContext): Promise<SeedResult> {
    const { db, logger, verbose } = context;
    let created = 0;

    // Create admin user
    const adminEmail = "admin@example.com";
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        email: adminEmail,
        name: "Admin User",
      });
      created++;
      if (verbose) logger.log(\`Created admin user: \${adminEmail}\`);
    }

    // Create test users
    const testUsers = [
      { email: "user@example.com", name: "Test User" },
      { email: "demo@example.com", name: "Demo User" },
    ];

    for (const userData of testUsers) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(users).values(userData);
        created++;
        if (verbose) logger.log(\`Created user: \${userData.email}\`);
      }
    }

    // Create random users for development
    if (process.env.NODE_ENV === "development") {
      const randomCount = 10;
      for (let i = 0; i < randomCount; i++) {
        const email = faker.internet.email().toLowerCase();
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(users).values({
            email,
            name: faker.person.fullName(),
          });
          created++;
          if (verbose) logger.log(\`Created random user: \${email}\`);
        }
      }
    }

    return { recordsCreated: created };
  }

  async down(context: SeedContext): Promise<void> {
    const { db, logger } = context;
    // Only delete seeded users, not real users
    const seededEmails = [
      "admin@example.com",
      "user@example.com",
      "demo@example.com",
    ];

    for (const email of seededEmails) {
      await db.delete(users).where(eq(users.email, email));
    }
    logger.log("Rolled back users seed");
  }
}
`;
  }

  private getSeedersIndex(): string {
    return `import type { SeedClass } from "../seed.types";
import { UsersSeed } from "./001-users.seed";

/**
 * All seed classes in order of execution
 * Add new seeds here to register them
 */
export const seedClasses: SeedClass[] = [
  UsersSeed,
];

/**
 * Get all seed instances
 */
export function getAllSeeds(): SeedClass[] {
  return seedClasses;
}
`;
  }

  private getSeedsIndex(): string {
    return `export { SeederService } from "./seeder.service";
export { SeederModule } from "./seeder.module";
export { BaseSeed, type SeedContext, type SeedResult } from "./base.seed";
export type { SeedOptions, SeedClass } from "./seed.types";
export { getAllSeeds, seedClasses } from "./seeders";
`;
  }

  private getSeedCommand(): string {
    return `import { Command, CommandRunner, Option } from "nest-commander";
import { SeederService } from "../db/seeds/seeder.service";
import { Logger } from "@nestjs/common";

interface SeedCommandOptions {
  fresh?: boolean;
  verbose?: boolean;
  status?: boolean;
  reset?: boolean;
  only?: string;
}

@Command({
  name: "seed",
  description: "Run database seeds",
})
export class SeedCommand extends CommandRunner {
  private readonly logger = new Logger(SeedCommand.name);

  constructor(private readonly seeder: SeederService) {
    super();
  }

  async run(_passedParams: string[], options: SeedCommandOptions): Promise<void> {
    try {
      if (options.status) {
        await this.showStatus();
        return;
      }

      if (options.reset) {
        await this.seeder.reset();
        return;
      }

      if (options.only) {
        const seeds = this.seeder.getSeeds();
        const seed = seeds.find((s) => s.id === options.only);
        if (!seed) {
          this.logger.error(\`Seed '\${options.only}' not found\`);
          process.exit(1);
        }
        await this.seeder.runSeed(seed, {
          db: (this.seeder as any).drizzle.db,
          logger: this.logger,
          verbose: options.verbose ?? false,
        });
        return;
      }

      await this.seeder.runAll({
        fresh: options.fresh,
        verbose: options.verbose,
      });

      this.logger.log("Seeding completed successfully");
    } catch (error) {
      this.logger.error("Seeding failed:", error);
      process.exit(1);
    }
  }

  private async showStatus(): Promise<void> {
    const seeds = this.seeder.getSeeds();
    const statuses = await this.seeder.getAllStatuses();
    const statusMap = new Map(statuses.map((s) => [s.id, s]));

    console.log("\\n📊 Seed Status:\\n");
    console.log("ID".padEnd(20) + "Name".padEnd(30) + "Status".padEnd(12) + "Version".padEnd(10) + "Executed");
    console.log("-".repeat(90));

    for (const seed of seeds) {
      const status = statusMap.get(seed.id);
      const statusStr = status
        ? status.success
          ? "✅ Done"
          : "❌ Failed"
        : "⏳ Pending";
      const version = status ? \`v\${status.version}\` : "-";
      const executed = status
        ? status.executedAt.toISOString().split("T")[0]
        : "-";

      console.log(
        seed.id.padEnd(20) +
          seed.name.padEnd(30) +
          statusStr.padEnd(12) +
          version.padEnd(10) +
          executed
      );
    }
    console.log("");
  }

  @Option({
    flags: "-f, --fresh",
    description: "Clear seed history and run all seeds from scratch",
  })
  parseFresh(): boolean {
    return true;
  }

  @Option({
    flags: "-v, --verbose",
    description: "Show detailed output",
  })
  parseVerbose(): boolean {
    return true;
  }

  @Option({
    flags: "-s, --status",
    description: "Show seed status without running",
  })
  parseStatus(): boolean {
    return true;
  }

  @Option({
    flags: "-r, --reset",
    description: "Reset all seeds (rollback and clear history)",
  })
  parseReset(): boolean {
    return true;
  }

  @Option({
    flags: "-o, --only <id>",
    description: "Run only a specific seed by ID",
  })
  parseOnly(val: string): string {
    return val;
  }
}
`;
  }

  private getCommandsIndex(context: GeneratorContext): string {
    let exports = `export { SeedCommand } from "./seed.command";
`;

    // Can add more commands here based on other plugins
    if (this.hasPlugin(context, "nest-commander")) {
      exports += `// Additional commands from nest-commander plugin
`;
    }

    return exports;
  }

  private getCommandsModule(context: GeneratorContext): string {
    let imports = `import { Module } from "@nestjs/common";
import { SeedCommand } from "./seed.command";
import { SeederModule } from "../db/seeds/seeder.module";
`;

    const providers = ["SeedCommand"];
    const moduleImports = ["SeederModule"];

    // Add additional command imports based on plugins
    if (this.hasPlugin(context, "nest-commander")) {
      // Future: add more commands
    }

    return `${imports}
@Module({
  imports: [${moduleImports.join(", ")}],
  providers: [${providers.join(", ")}],
})
export class CommandsModule {}
`;
  }

  private getSeedScript(): string {
    return `#!/usr/bin/env bun
/**
 * Database seed script
 * Run with: bun run db:seed
 */
import { CommandFactory } from "nest-commander";
import { CommandsModule } from "../src/commands/commands.module";
import { DrizzleModule } from "../src/db/drizzle.module";
import { Module } from "@nestjs/common";
import { SeederModule } from "../src/db/seeds/seeder.module";

@Module({
  imports: [DrizzleModule, SeederModule, CommandsModule],
})
class SeedAppModule {}

async function bootstrap() {
  await CommandFactory.run(SeedAppModule, {
    logger: ["log", "error", "warn"],
    cliName: "seed",
  });
}

bootstrap().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
`;
  }
}
