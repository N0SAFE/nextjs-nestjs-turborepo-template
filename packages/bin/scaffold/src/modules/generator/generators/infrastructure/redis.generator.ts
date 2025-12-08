/**
 * Redis Generator
 *
 * Sets up Redis for caching and session storage.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class RedisGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "redis",
    priority: 40,
    version: "1.0.0",
    description: "Redis caching and session storage",
    dependencies: ["docker", "nestjs"],
    contributesTo: [".env", ".env.example", "docker-compose.yml"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    if (!this.hasPlugin(context, "nestjs")) {
      return [];
    }

    return [
      this.file(".env.example", this.getEnvExample(), { mergeStrategy: "append" }),
      this.file("apps/api/src/redis/redis.module.ts", this.getRedisModule()),
      this.file("apps/api/src/redis/redis.service.ts", this.getRedisService()),
      this.file("apps/api/src/redis/redis.constants.ts", this.getRedisConstants()),
      this.file("apps/api/src/redis/index.ts", this.getRedisIndex()),
    ];
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    if (!this.hasPlugin(context, "nestjs")) {
      return [];
    }

    return [
      { name: "ioredis", version: "^5.4.0", type: "prod", target: "apps/api", pluginId: "redis" },
      { name: "@types/ioredis", version: "^5.0.0", type: "dev", target: "apps/api", pluginId: "redis" },
    ];
  }

  private getEnvExample(): string {
    return `# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379
`;
  }

  private getRedisModule(): string {
    return `import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { REDIS_CLIENT } from "./redis.constants";
import Redis from "ioredis";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const redis = new Redis({
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379", 10),
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy: (times) => {
            if (times > 3) {
              return null; // Stop retrying
            }
            return Math.min(times * 200, 1000);
          },
        });

        redis.on("error", (err) => {
          console.error("Redis connection error:", err);
        });

        redis.on("connect", () => {
          console.log("Redis connected successfully");
        });

        return redis;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
`;
  }

  private getRedisService(): string {
    return `import { Injectable, Inject, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * Get a value from Redis
   */
  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Set a value in Redis
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  /**
   * Delete keys by pattern
   */
  async delByPattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;
    return this.redis.del(...keys);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  /**
   * Set expiration on existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    return (await this.redis.expire(key, seconds)) === 1;
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    return this.redis.hget(key, field);
  }

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    return this.redis.hset(key, field, value);
  }

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  /**
   * Delete hash field
   */
  async hdel(key: string, field: string): Promise<number> {
    return this.redis.hdel(key, field);
  }

  /**
   * Add to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.redis.sadd(key, ...members);
  }

  /**
   * Get set members
   */
  async smembers(key: string): Promise<string[]> {
    return this.redis.smembers(key);
  }

  /**
   * Remove from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    return this.redis.srem(key, ...members);
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: string): Promise<number> {
    return this.redis.publish(channel, message);
  }

  /**
   * Get the underlying Redis client
   */
  getClient(): Redis {
    return this.redis;
  }

  /**
   * Check Redis connection
   */
  async ping(): Promise<string> {
    return this.redis.ping();
  }
}
`;
  }

  private getRedisConstants(): string {
    return `/**
 * Redis injection token
 */
export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

/**
 * Default cache TTL in seconds
 */
export const DEFAULT_CACHE_TTL = 60 * 5; // 5 minutes

/**
 * Session TTL in seconds
 */
export const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

/**
 * Cache key prefixes
 */
export const CACHE_PREFIX = {
  USER: "user:",
  SESSION: "session:",
  RATE_LIMIT: "ratelimit:",
  CACHE: "cache:",
} as const;
`;
  }

  private getRedisIndex(): string {
    return `/**
 * Redis module exports
 */
export { RedisModule } from "./redis.module";
export { RedisService } from "./redis.service";
export { 
  REDIS_CLIENT, 
  DEFAULT_CACHE_TTL, 
  SESSION_TTL,
  CACHE_PREFIX 
} from "./redis.constants";
`;
  }
}
