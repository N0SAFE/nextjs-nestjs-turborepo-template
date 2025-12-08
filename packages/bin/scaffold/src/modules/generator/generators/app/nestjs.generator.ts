/**
 * NestJS Generator
 *
 * Sets up a NestJS application with ORPC, Better Auth, and Drizzle integration.
 * Includes Repository Pattern by default for clean architecture.
 * Uses CLI commands for module generation.
 *
 * @version 2.0.0 - Added Repository Pattern support
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
export class NestJSGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "nestjs",
    priority: 20,
    version: "2.0.0",
    description: "NestJS backend application with modular architecture and repository pattern",
    contributesTo: ["apps/api/**", "package.json"],
    dependsOn: ["tsconfig.json"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];
    const { projectConfig } = context;

    // Main entry point
    files.push(
      this.file("apps/api/src/main.ts", this.getMainFile(context), {
        mergeStrategy: "replace",
        priority: 20,
      }),
    );

    // App module
    files.push(
      this.file("apps/api/src/app.module.ts", this.getAppModule(context), {
        mergeStrategy: "replace",
        priority: 20,
      }),
    );

    // App controller
    files.push(
      this.file("apps/api/src/app.controller.ts", this.getAppController(), {
        mergeStrategy: "replace",
        priority: 20,
      }),
    );

    // App service
    files.push(
      this.file("apps/api/src/app.service.ts", this.getAppService(), {
        mergeStrategy: "replace",
        priority: 20,
      }),
    );

    // =========================================
    // Repository Pattern Files (NEW in v2.0.0)
    // =========================================

    // Base Repository Interface
    files.push(
      this.file(
        "apps/api/src/core/database/interfaces/repository.interface.ts",
        this.getRepositoryInterface(),
        { mergeStrategy: "replace", priority: 20 }
      ),
    );

    // Base Repository Implementation
    files.push(
      this.file(
        "apps/api/src/core/database/base/base.repository.ts",
        this.getBaseRepository(context),
        { mergeStrategy: "replace", priority: 20 }
      ),
    );

    // Pagination Types
    files.push(
      this.file(
        "apps/api/src/core/database/types/pagination.types.ts",
        this.getPaginationTypes(),
        { mergeStrategy: "replace", priority: 20 }
      ),
    );

    // Transaction Utilities
    files.push(
      this.file(
        "apps/api/src/core/database/utils/transaction.utils.ts",
        this.getTransactionUtils(context),
        { mergeStrategy: "replace", priority: 20 }
      ),
    );

    // Database Module
    files.push(
      this.file(
        "apps/api/src/core/database/database.module.ts",
        this.getDatabaseModule(context),
        { mergeStrategy: "replace", priority: 20 }
      ),
    );

    // Core Module Index
    files.push(
      this.file(
        "apps/api/src/core/database/index.ts",
        this.getDatabaseIndex(),
        { mergeStrategy: "replace", priority: 20 }
      ),
    );

    // Example Repository (User)
    if (this.hasPlugin(context, "drizzle") || this.hasPlugin(context, "better-auth")) {
      files.push(
        this.file(
          "apps/api/src/modules/user/user.repository.ts",
          this.getExampleUserRepository(context),
          { mergeStrategy: "replace", priority: 20 }
        ),
      );
    }

    // Package.json for api app
    files.push(
      this.file("apps/api/package.json", this.getApiPackageJson(projectConfig.name), {
        mergeStrategy: "json-merge-deep",
        priority: 20,
      }),
    );

    // TSConfig for api app
    files.push(
      this.file("apps/api/tsconfig.json", this.getApiTsConfig(projectConfig.name), {
        mergeStrategy: "json-merge-deep",
        priority: 20,
      }),
    );

    // Nest CLI config
    files.push(
      this.file("apps/api/nest-cli.json", this.getNestCliConfig(), {
        mergeStrategy: "replace",
        priority: 20,
      }),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      // Core NestJS
      { name: "@nestjs/core", version: "^10.4.15", type: "prod", target: "apps/api", pluginId: "nestjs" },
      { name: "@nestjs/common", version: "^10.4.15", type: "prod", target: "apps/api", pluginId: "nestjs" },
      { name: "@nestjs/platform-express", version: "^10.4.15", type: "prod", target: "apps/api", pluginId: "nestjs" },
      { name: "@nestjs/config", version: "^3.3.0", type: "prod", target: "apps/api", pluginId: "nestjs" },
      { name: "reflect-metadata", version: "^0.2.2", type: "prod", target: "apps/api", pluginId: "nestjs" },
      { name: "rxjs", version: "^7.8.1", type: "prod", target: "apps/api", pluginId: "nestjs" },
      
      // Dev dependencies
      { name: "@nestjs/cli", version: "^10.4.9", type: "dev", target: "apps/api", pluginId: "nestjs" },
      { name: "@nestjs/testing", version: "^10.4.15", type: "dev", target: "apps/api", pluginId: "nestjs" },
      { name: "@types/express", version: "^5.0.0", type: "dev", target: "apps/api", pluginId: "nestjs" },
    ];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      { name: "dev", command: "nest start --watch", target: "apps/api", description: "Start NestJS in watch mode", pluginId: "nestjs" },
      { name: "build", command: "nest build", target: "apps/api", description: "Build NestJS application", pluginId: "nestjs" },
      { name: "start", command: "node dist/main.js", target: "apps/api", description: "Start production server", pluginId: "nestjs" },
      { name: "start:prod", command: "node dist/main.js", target: "apps/api", description: "Start in production mode", pluginId: "nestjs" },
    ];
  }

  private getMainFile(context: GeneratorContext): string {
    const port = context.projectConfig.ports.api || 3001;
    
    return `import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  });

  const port = process.env.PORT || ${port};
  await app.listen(port);
  console.log(\`🚀 API running on http://localhost:\${port}\`);
}

bootstrap();
`;
  }

  private getAppModule(context: GeneratorContext): string {
    const imports: string[] = [`import { Module } from "@nestjs/common";`];
    const moduleImports: string[] = [];
    const controllers: string[] = ["AppController"];
    const providers: string[] = ["AppService"];

    imports.push(`import { ConfigModule } from "@nestjs/config";`);
    moduleImports.push("ConfigModule.forRoot({ isGlobal: true })");

    imports.push(`import { AppController } from "./app.controller";`);
    imports.push(`import { AppService } from "./app.service";`);

    // Add database module if drizzle is enabled
    if (this.hasPlugin(context, "drizzle")) {
      imports.push(`import { DrizzleModule } from "./db/drizzle.module";`);
      moduleImports.push("DrizzleModule");
    }

    // Add auth module if better-auth is enabled
    if (this.hasPlugin(context, "better-auth")) {
      imports.push(`import { AuthModule } from "./auth/auth.module";`);
      moduleImports.push("AuthModule");
    }

    return `${imports.join("\n")}

@Module({
  imports: [
    ${moduleImports.join(",\n    ")},
  ],
  controllers: [${controllers.join(", ")}],
  providers: [${providers.join(", ")}],
})
export class AppModule {}
`;
  }

  private getAppController(): string {
    return `import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
`;
  }

  private getAppService(): string {
    return `import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Hello from NestJS API!";
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
`;
  }

  private getApiPackageJson(projectName: string): string {
    return JSON.stringify(
      {
        name: `@${projectName}/api`,
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "nest start --watch",
          build: "nest build",
          start: "node dist/main.js",
          "start:prod": "node dist/main.js",
          "type-check": "tsc --noEmit",
        },
      },
      null,
      2,
    );
  }

  private getApiTsConfig(projectName: string): string {
    return JSON.stringify(
      {
        extends: "../../tsconfig.base.json",
        compilerOptions: {
          module: "CommonJS",
          outDir: "./dist",
          rootDir: "./src",
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          paths: {
            [`@${projectName}/*`]: ["../../packages/*/src"],
          },
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"],
      },
      null,
      2,
    );
  }

  private getNestCliConfig(): string {
    return JSON.stringify(
      {
        $schema: "https://json.schemastore.org/nest-cli",
        collection: "@nestjs/schematics",
        sourceRoot: "src",
        compilerOptions: {
          deleteOutDir: true,
          assets: [],
          watchAssets: false,
        },
      },
      null,
      2,
    );
  }

  // =========================================
  // Repository Pattern Methods (NEW in v2.0.0)
  // =========================================

  private getRepositoryInterface(): string {
    return `/**
 * Base Repository Interface
 * 
 * Defines the contract for all repository implementations.
 * Follows the Repository Pattern for clean separation between
 * business logic and data access.
 */
import type { PaginationOptions, PaginatedResult } from "../types/pagination.types";

/**
 * Find options for querying entities
 */
export interface FindOptions<T = unknown> {
  /** Filter conditions */
  where?: Partial<T>;
  /** Sort order */
  orderBy?: { field: keyof T; direction: "asc" | "desc" }[];
  /** Number of records to skip */
  skip?: number;
  /** Number of records to take */
  take?: number;
  /** Relations to include */
  include?: string[];
}

/**
 * Create input type - all fields except auto-generated ones
 */
export type CreateInput<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

/**
 * Update input type - partial fields except id
 */
export type UpdateInput<T> = Partial<Omit<T, "id" | "createdAt" | "updatedAt">>;

/**
 * Base Repository Interface
 * 
 * @template T - Entity type
 * @template ID - ID type (default: string)
 */
export interface IRepository<T, ID = string> {
  /**
   * Find entity by ID
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Find single entity matching criteria
   */
  findOne(options: FindOptions<T>): Promise<T | null>;

  /**
   * Find all entities matching criteria
   */
  findAll(options?: FindOptions<T>): Promise<T[]>;

  /**
   * Find entities with pagination
   */
  findPaginated(
    options: PaginationOptions,
    where?: Partial<T>
  ): Promise<PaginatedResult<T>>;

  /**
   * Count entities matching criteria
   */
  count(where?: Partial<T>): Promise<number>;

  /**
   * Check if entity exists
   */
  exists(id: ID): Promise<boolean>;

  /**
   * Create new entity
   */
  create(data: CreateInput<T>): Promise<T>;

  /**
   * Create multiple entities
   */
  createMany(data: CreateInput<T>[]): Promise<T[]>;

  /**
   * Update entity by ID
   */
  update(id: ID, data: UpdateInput<T>): Promise<T>;

  /**
   * Update multiple entities matching criteria
   */
  updateMany(where: Partial<T>, data: UpdateInput<T>): Promise<number>;

  /**
   * Delete entity by ID
   */
  delete(id: ID): Promise<void>;

  /**
   * Delete multiple entities matching criteria
   */
  deleteMany(where: Partial<T>): Promise<number>;

  /**
   * Soft delete entity (if supported)
   */
  softDelete?(id: ID): Promise<void>;

  /**
   * Restore soft deleted entity (if supported)
   */
  restore?(id: ID): Promise<void>;
}

/**
 * Repository with transaction support
 */
export interface ITransactionalRepository<T, ID = string> extends IRepository<T, ID> {
  /**
   * Execute operations within a transaction
   */
  withTransaction<R>(
    callback: (repo: IRepository<T, ID>) => Promise<R>
  ): Promise<R>;
}
`;
  }

  private getBaseRepository(context: GeneratorContext): string {
    const hasDrizzle = this.hasPlugin(context, "drizzle");
    
    if (hasDrizzle) {
      return this.getDrizzleBaseRepository();
    }
    
    // Generic base repository without ORM
    return `/**
 * Base Repository Implementation
 * 
 * Abstract base class providing common repository functionality.
 * Extend this class for specific entity repositories.
 */
import { Injectable } from "@nestjs/common";
import type {
  IRepository,
  FindOptions,
  CreateInput,
  UpdateInput,
} from "../interfaces/repository.interface";
import type { PaginationOptions, PaginatedResult } from "../types/pagination.types";

/**
 * Abstract Base Repository
 * 
 * Provides common CRUD operations. Override methods in concrete
 * implementations to connect with your data source.
 * 
 * @template T - Entity type
 * @template ID - ID type (default: string)
 */
@Injectable()
export abstract class BaseRepository<T, ID = string> implements IRepository<T, ID> {
  /**
   * Get the entity name for error messages
   */
  protected abstract readonly entityName: string;

  /**
   * Find entity by ID
   */
  abstract findById(id: ID): Promise<T | null>;

  /**
   * Find single entity matching criteria
   */
  abstract findOne(options: FindOptions<T>): Promise<T | null>;

  /**
   * Find all entities matching criteria
   */
  abstract findAll(options?: FindOptions<T>): Promise<T[]>;

  /**
   * Find entities with pagination
   */
  async findPaginated(
    options: PaginationOptions,
    where?: Partial<T>
  ): Promise<PaginatedResult<T>> {
    const { page = 1, pageSize = 10 } = options;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.findAll({ where, skip, take: pageSize }),
      this.count(where),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
    };
  }

  /**
   * Count entities matching criteria
   */
  abstract count(where?: Partial<T>): Promise<number>;

  /**
   * Check if entity exists
   */
  async exists(id: ID): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }

  /**
   * Create new entity
   */
  abstract create(data: CreateInput<T>): Promise<T>;

  /**
   * Create multiple entities
   */
  async createMany(data: CreateInput<T>[]): Promise<T[]> {
    return Promise.all(data.map((item) => this.create(item)));
  }

  /**
   * Update entity by ID
   */
  abstract update(id: ID, data: UpdateInput<T>): Promise<T>;

  /**
   * Update multiple entities matching criteria
   */
  abstract updateMany(where: Partial<T>, data: UpdateInput<T>): Promise<number>;

  /**
   * Delete entity by ID
   */
  abstract delete(id: ID): Promise<void>;

  /**
   * Delete multiple entities matching criteria
   */
  abstract deleteMany(where: Partial<T>): Promise<number>;

  /**
   * Throw not found error
   */
  protected notFound(id: ID): never {
    throw new Error(\`\${this.entityName} with id \${id} not found\`);
  }
}
`;
  }

  private getDrizzleBaseRepository(): string {
    return `/**
 * Base Repository Implementation (Drizzle ORM)
 * 
 * Abstract base class providing common repository functionality
 * using Drizzle ORM for database operations.
 */
import { Injectable, Inject } from "@nestjs/common";
import { eq, and, sql, type SQL } from "drizzle-orm";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";
import type {
  IRepository,
  FindOptions,
  CreateInput,
  UpdateInput,
} from "../interfaces/repository.interface";
import type { PaginationOptions, PaginatedResult } from "../types/pagination.types";

/**
 * Drizzle Database injection token
 */
export const DRIZZLE_DB = Symbol("DRIZZLE_DB");

/**
 * Abstract Base Repository for Drizzle ORM
 * 
 * Provides type-safe CRUD operations using Drizzle ORM.
 * 
 * @template TTable - Drizzle table type
 * @template TEntity - Entity type (inferred from table)
 * @template ID - ID type (default: string)
 */
@Injectable()
export abstract class DrizzleBaseRepository<
  TTable extends PgTable,
  TEntity extends Record<string, unknown>,
  ID = string
> implements IRepository<TEntity, ID> {
  /**
   * The Drizzle table schema
   */
  protected abstract readonly table: TTable;

  /**
   * The ID column for the table
   */
  protected abstract readonly idColumn: PgColumn;

  /**
   * Entity name for error messages
   */
  protected abstract readonly entityName: string;

  constructor(
    @Inject(DRIZZLE_DB)
    protected readonly db: ReturnType<typeof import("drizzle-orm/node-postgres").drizzle>
  ) {}

  /**
   * Find entity by ID
   */
  async findById(id: ID): Promise<TEntity | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.idColumn, id as unknown as SQL))
      .limit(1);

    return (results[0] as TEntity) ?? null;
  }

  /**
   * Find single entity matching criteria
   */
  async findOne(options: FindOptions<TEntity>): Promise<TEntity | null> {
    const query = this.buildQuery(options);
    const results = await query.limit(1);
    return (results[0] as TEntity) ?? null;
  }

  /**
   * Find all entities matching criteria
   */
  async findAll(options?: FindOptions<TEntity>): Promise<TEntity[]> {
    const query = this.buildQuery(options);
    return query as unknown as Promise<TEntity[]>;
  }

  /**
   * Find entities with pagination
   */
  async findPaginated(
    options: PaginationOptions,
    where?: Partial<TEntity>
  ): Promise<PaginatedResult<TEntity>> {
    const { page = 1, pageSize = 10 } = options;
    const offset = (page - 1) * pageSize;

    const [items, countResult] = await Promise.all([
      this.findAll({ where, skip: offset, take: pageSize }),
      this.count(where),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total: countResult,
        totalPages: Math.ceil(countResult / pageSize),
        hasMore: page * pageSize < countResult,
      },
    };
  }

  /**
   * Count entities matching criteria
   */
  async count(where?: Partial<TEntity>): Promise<number> {
    const conditions = this.buildWhereConditions(where);
    
    const result = await this.db
      .select({ count: sql<number>\`count(*)\` })
      .from(this.table)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return Number(result[0]?.count ?? 0);
  }

  /**
   * Check if entity exists
   */
  async exists(id: ID): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }

  /**
   * Create new entity
   */
  async create(data: CreateInput<TEntity>): Promise<TEntity> {
    const results = await this.db
      .insert(this.table)
      .values(data as TTable["$inferInsert"])
      .returning();

    return results[0] as TEntity;
  }

  /**
   * Create multiple entities
   */
  async createMany(data: CreateInput<TEntity>[]): Promise<TEntity[]> {
    const results = await this.db
      .insert(this.table)
      .values(data as TTable["$inferInsert"][])
      .returning();

    return results as TEntity[];
  }

  /**
   * Update entity by ID
   */
  async update(id: ID, data: UpdateInput<TEntity>): Promise<TEntity> {
    const results = await this.db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() } as Partial<TTable["$inferInsert"]>)
      .where(eq(this.idColumn, id as unknown as SQL))
      .returning();

    if (!results[0]) {
      throw new Error(\`\${this.entityName} with id \${id} not found\`);
    }

    return results[0] as TEntity;
  }

  /**
   * Update multiple entities matching criteria
   */
  async updateMany(where: Partial<TEntity>, data: UpdateInput<TEntity>): Promise<number> {
    const conditions = this.buildWhereConditions(where);
    
    const result = await this.db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() } as Partial<TTable["$inferInsert"]>)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result.rowCount ?? 0;
  }

  /**
   * Delete entity by ID
   */
  async delete(id: ID): Promise<void> {
    await this.db
      .delete(this.table)
      .where(eq(this.idColumn, id as unknown as SQL));
  }

  /**
   * Delete multiple entities matching criteria
   */
  async deleteMany(where: Partial<TEntity>): Promise<number> {
    const conditions = this.buildWhereConditions(where);
    
    const result = await this.db
      .delete(this.table)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result.rowCount ?? 0;
  }

  /**
   * Build query with options
   */
  private buildQuery(options?: FindOptions<TEntity>) {
    let query = this.db.select().from(this.table);

    if (options?.where) {
      const conditions = this.buildWhereConditions(options.where);
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }
    }

    if (options?.take) {
      query = query.limit(options.take) as typeof query;
    }

    if (options?.skip) {
      query = query.offset(options.skip) as typeof query;
    }

    return query;
  }

  /**
   * Build where conditions from partial entity
   */
  protected buildWhereConditions(where?: Partial<TEntity>): SQL[] {
    if (!where) return [];

    const conditions: SQL[] = [];
    const tableColumns = (this.table as unknown as { _: { columns: Record<string, PgColumn> } })._.columns;

    for (const [key, value] of Object.entries(where)) {
      if (value !== undefined && key in tableColumns) {
        conditions.push(eq(tableColumns[key], value as unknown as SQL));
      }
    }

    return conditions;
  }

  /**
   * Throw not found error
   */
  protected notFound(id: ID): never {
    throw new Error(\`\${this.entityName} with id \${id} not found\`);
  }
}
`;
  }

  private getPaginationTypes(): string {
    return `/**
 * Pagination Types
 * 
 * Common types for paginated queries and responses.
 */

/**
 * Pagination request options
 */
export interface PaginationOptions {
  /** Current page number (1-indexed) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page number */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /** Items for the current page */
  items: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Cursor-based pagination options
 */
export interface CursorPaginationOptions {
  /** Cursor for the next page */
  cursor?: string;
  /** Number of items to fetch */
  limit?: number;
  /** Direction of pagination */
  direction?: "forward" | "backward";
}

/**
 * Cursor-based pagination result
 */
export interface CursorPaginatedResult<T> {
  /** Items for the current page */
  items: T[];
  /** Cursor for the next page */
  nextCursor: string | null;
  /** Cursor for the previous page */
  prevCursor: string | null;
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Create default pagination options
 */
export function defaultPagination(
  options?: Partial<PaginationOptions>
): Required<PaginationOptions> {
  return {
    page: options?.page ?? 1,
    pageSize: options?.pageSize ?? 10,
    sortBy: options?.sortBy ?? "createdAt",
    sortOrder: options?.sortOrder ?? "desc",
  };
}

/**
 * Calculate offset from page and pageSize
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}
`;
  }

  private getTransactionUtils(context: GeneratorContext): string {
    const hasDrizzle = this.hasPlugin(context, "drizzle");

    if (hasDrizzle) {
      return `/**
 * Transaction Utilities (Drizzle ORM)
 * 
 * Utilities for managing database transactions with Drizzle ORM.
 */
import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE_DB } from "../base/base.repository";

/**
 * Transaction callback type
 */
export type TransactionCallback<T> = (
  tx: ReturnType<typeof import("drizzle-orm/node-postgres").drizzle>
) => Promise<T>;

/**
 * Transaction Service
 * 
 * Provides transaction management for database operations.
 */
@Injectable()
export class TransactionService {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: ReturnType<typeof import("drizzle-orm/node-postgres").drizzle>
  ) {}

  /**
   * Execute operations within a transaction
   * 
   * @example
   * \`\`\`typescript
   * const result = await this.transactionService.execute(async (tx) => {
   *   const user = await tx.insert(users).values({ name: "John" }).returning();
   *   const profile = await tx.insert(profiles).values({ userId: user.id }).returning();
   *   return { user, profile };
   * });
   * \`\`\`
   */
  async execute<T>(callback: TransactionCallback<T>): Promise<T> {
    return await this.db.transaction(callback);
  }

  /**
   * Execute operations with retry on deadlock
   * 
   * @param callback - Transaction callback
   * @param maxRetries - Maximum retry attempts (default: 3)
   */
  async executeWithRetry<T>(
    callback: TransactionCallback<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(callback);
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is a deadlock
        const isDeadlock = 
          lastError.message.includes("deadlock") ||
          lastError.message.includes("40P01");

        if (!isDeadlock || attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) => 
          setTimeout(resolve, Math.pow(2, attempt) * 100)
        );
      }
    }

    throw lastError;
  }
}

/**
 * Transaction decorator for NestJS services
 * 
 * @example
 * \`\`\`typescript
 * @Transactional()
 * async createUserWithProfile(data: CreateUserData) {
 *   // This method runs in a transaction
 * }
 * \`\`\`
 */
export function Transactional(): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: { transactionService?: TransactionService }, ...args: unknown[]) {
      if (!this.transactionService) {
        throw new Error("TransactionService not injected. Add TransactionService to constructor.");
      }

      return this.transactionService.execute(async () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
`;
    }

    // Generic transaction utilities without Drizzle
    return `/**
 * Transaction Utilities
 * 
 * Utilities for managing database transactions.
 */
import { Injectable } from "@nestjs/common";

/**
 * Transaction callback type
 */
export type TransactionCallback<T, TContext = unknown> = (
  context: TContext
) => Promise<T>;

/**
 * Abstract Transaction Service
 * 
 * Provides transaction management for database operations.
 * Implement this for your specific database driver.
 */
@Injectable()
export abstract class TransactionService<TContext = unknown> {
  /**
   * Execute operations within a transaction
   */
  abstract execute<T>(callback: TransactionCallback<T, TContext>): Promise<T>;

  /**
   * Execute operations with retry on deadlock
   */
  async executeWithRetry<T>(
    callback: TransactionCallback<T, TContext>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(callback);
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is a deadlock
        const isDeadlock = 
          lastError.message.includes("deadlock") ||
          lastError.message.includes("serialization failure");

        if (!isDeadlock || attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) => 
          setTimeout(resolve, Math.pow(2, attempt) * 100)
        );
      }
    }

    throw lastError;
  }
}

/**
 * Unit of Work pattern interface
 * 
 * Coordinates changes across multiple repositories
 * within a single transaction.
 */
export interface IUnitOfWork {
  /**
   * Begin a new transaction
   */
  begin(): Promise<void>;

  /**
   * Commit the current transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction
   */
  rollback(): Promise<void>;

  /**
   * Execute callback within transaction
   */
  execute<T>(callback: () => Promise<T>): Promise<T>;
}
`;
  }

  private getDatabaseModule(context: GeneratorContext): string {
    const hasDrizzle = this.hasPlugin(context, "drizzle");

    return `/**
 * Database Module
 * 
 * Provides database-related services and utilities.
 */
import { Module, Global } from "@nestjs/common";
${hasDrizzle ? `import { TransactionService } from "./utils/transaction.utils";` : ""}

/**
 * Database Module
 * 
 * Import this module to access:
 * - Base repository classes
 * - Transaction utilities
 * - Pagination helpers
 */
@Global()
@Module({
  providers: [
    ${hasDrizzle ? "TransactionService," : "// Add your transaction service here"}
  ],
  exports: [
    ${hasDrizzle ? "TransactionService," : "// Export your transaction service here"}
  ],
})
export class DatabaseModule {}
`;
  }

  private getDatabaseIndex(): string {
    return `/**
 * Database Module Exports
 * 
 * Re-exports all database-related types, interfaces, and utilities.
 */

// Interfaces
export * from "./interfaces/repository.interface";

// Types
export * from "./types/pagination.types";

// Base classes
export * from "./base/base.repository";

// Utilities
export * from "./utils/transaction.utils";

// Module
export * from "./database.module";
`;
  }

  private getExampleUserRepository(context: GeneratorContext): string {
    const hasDrizzle = this.hasPlugin(context, "drizzle");

    if (hasDrizzle) {
      return `/**
 * User Repository
 * 
 * Example repository implementation using the base repository pattern.
 */
import { Injectable } from "@nestjs/common";
import { DrizzleBaseRepository } from "../../core/database/base/base.repository";
import { users } from "../../db/drizzle/schema";
import type { InferSelectModel } from "drizzle-orm";

/**
 * User entity type (inferred from schema)
 */
export type User = InferSelectModel<typeof users>;

/**
 * User Repository
 * 
 * Provides data access for User entities.
 * Extends DrizzleBaseRepository for common CRUD operations.
 * 
 * @example
 * \`\`\`typescript
 * // Find user by ID
 * const user = await userRepository.findById("user-123");
 * 
 * // Find users with pagination
 * const result = await userRepository.findPaginated({ page: 1, pageSize: 10 });
 * 
 * // Create user
 * const newUser = await userRepository.create({ email: "test@example.com" });
 * 
 * // Custom query
 * const userByEmail = await userRepository.findByEmail("test@example.com");
 * \`\`\`
 */
@Injectable()
export class UserRepository extends DrizzleBaseRepository<typeof users, User, string> {
  protected readonly table = users;
  protected readonly idColumn = users.id;
  protected readonly entityName = "User";

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } as Partial<User> });
  }

  /**
   * Find users by role
   */
  async findByRole(role: string): Promise<User[]> {
    return this.findAll({ where: { role } as Partial<User> });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.count({ email } as Partial<User>);
    return count > 0;
  }
}
`;
    }

    // Generic example without Drizzle
    return `/**
 * User Repository
 * 
 * Example repository implementation using the base repository pattern.
 */
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "../../core/database/base/base.repository";
import type { FindOptions, CreateInput, UpdateInput } from "../../core/database/interfaces/repository.interface";

/**
 * User entity type
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * In-memory storage for example purposes
 * Replace with your actual database implementation
 */
const storage = new Map<string, User>();

/**
 * User Repository
 * 
 * Example repository implementation. Replace the in-memory
 * storage with your actual database client.
 */
@Injectable()
export class UserRepository extends BaseRepository<User, string> {
  protected readonly entityName = "User";

  async findById(id: string): Promise<User | null> {
    return storage.get(id) ?? null;
  }

  async findOne(options: FindOptions<User>): Promise<User | null> {
    const users = await this.findAll(options);
    return users[0] ?? null;
  }

  async findAll(options?: FindOptions<User>): Promise<User[]> {
    let users = Array.from(storage.values());

    if (options?.where) {
      users = users.filter((user) =>
        Object.entries(options.where!).every(
          ([key, value]) => user[key as keyof User] === value
        )
      );
    }

    if (options?.skip) {
      users = users.slice(options.skip);
    }

    if (options?.take) {
      users = users.slice(0, options.take);
    }

    return users;
  }

  async count(where?: Partial<User>): Promise<number> {
    if (!where) return storage.size;
    const users = await this.findAll({ where });
    return users.length;
  }

  async create(data: CreateInput<User>): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      ...data,
      name: data.name ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    storage.set(user.id, user);
    return user;
  }

  async update(id: string, data: UpdateInput<User>): Promise<User> {
    const existing = await this.findById(id);
    if (!existing) this.notFound(id);

    const updated: User = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    storage.set(id, updated);
    return updated;
  }

  async updateMany(where: Partial<User>, data: UpdateInput<User>): Promise<number> {
    const users = await this.findAll({ where });
    for (const user of users) {
      await this.update(user.id, data);
    }
    return users.length;
  }

  async delete(id: string): Promise<void> {
    storage.delete(id);
  }

  async deleteMany(where: Partial<User>): Promise<number> {
    const users = await this.findAll({ where });
    for (const user of users) {
      storage.delete(user.id);
    }
    return users.length;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.count({ email });
    return count > 0;
  }
}
`;
  }
}
