import { Command, CommandRunner } from 'nest-commander';
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../core/modules/database/database-connection';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../config/drizzle/schema';
import { AUTH_INSTANCE_KEY } from '@/core/modules/auth/types/symbols';
import { Auth } from '@/auth';

@Injectable()
@Command({
  name: "seed",
  description: "Seed the database with initial data",
})
export class SeedCommand extends CommandRunner {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    @Inject(AUTH_INSTANCE_KEY)
    private readonly auth: Auth,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log("🌱 Seeding database...");

    try {
      // Note: You can use this.authService.api to create users with proper authentication
      // Example: await this.authService.api.signUpEmail({ email, password, name })
      // For now, we're creating users directly in the database for seeding purposes

      // Create sample users
      const sampleUsersData: Parameters<
        typeof this.auth.api.createUser
      >[0][] = [
        {
          body: {
            name: "Admin User",
            email: "admin@admin.com",
            password: "adminadmin",
            data: {
              image: "https://avatars.githubusercontent.com/u/0?v=4",
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
        {
          body: {
            name: "John Doe",
            email: "john@example.com",
            password: "johndoe123",
            data: {
              image: "https://avatars.githubusercontent.com/u/1?v=4",
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
        {
          body: {
            name: "Jane Smith",
            email: "jane@example.com",
            password: "janesmith123",
            data: {
              image: "https://avatars.githubusercontent.com/u/2?v=4",
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
      ] as const;

      const [adminUser] = await Promise.all(
        sampleUsersData.map((userData) =>
          this.auth.api.createUser(userData)
        )
      ).then((results) => results.map((res) => res.user));

    //   // Create API key for admin user
    //   const adminApiKey = this.authService.api.createApiKey({
    //     body: {
    //       userId: adminUser.id,
    //       name: "Admin Key",
    //       key: nanoid(32),
    //       expiresAt: null, // Never expires
    //       abilities: ["*"], // Full access
    //     },
    //   });

    //   await this.db.insert(apiKey).values([adminApiKey]);

      console.log("✅ Database seeded successfully");
    //   console.log(`🔑 Admin API Key: ${adminApiKey.key}`);
      console.log(`👤 Admin User ID: ${adminUser.id}`);
      console.log(`📧 Admin Email: ${adminUser.email}`);
    } catch (error) {
      console.error("❌ Seeding failed:", error);
      throw error;
    }
  }
}
