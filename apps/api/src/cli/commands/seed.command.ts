import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import * as schema from '../../config/drizzle/schema';
import { nanoid } from 'nanoid';
import { Roles } from '@repo/auth/permissions';
import { eq } from 'drizzle-orm';
import { AuthService } from '@/core/modules/auth/services/auth.service';
import { DatabaseService } from '@/core/modules/database/services/database.service';
import { ConfigService } from '@nestjs/config';

// Seed version identifier - increment this when you want to re-seed
const SEED_VERSION = 'v1.0.0';

@Injectable()
@Command({
  name: "seed",
  description: "Seed the database with initial data",
})
export class SeedCommand extends CommandRunner {
  constructor(
    private readonly databaseService: DatabaseService,
		private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log("🌱 Seeding database...");

    try {
      // Check if this seed version has already been applied
      const existingSeed = await this.databaseService.db
        .select()
        .from(schema.seedVersion)
        .where(eq(schema.seedVersion.version, SEED_VERSION))
        .limit(1);

      if (existingSeed.length > 0 && existingSeed[0]) {
        console.log(`✅ Seed version ${SEED_VERSION} already applied at ${existingSeed[0].appliedAt.toISOString()}`);
        console.log('   Skipping seeding. To re-seed, increment SEED_VERSION in seed.command.ts');
        return;
      }

      console.log(`📦 Applying seed version ${SEED_VERSION}...`);

      // Create dev auth user if DEV_AUTH_KEY and DEV_AUTH_EMAIL are configured
      await this.seedDevAuthUser();

      // Dynamically get roles from permissions using type-safe Roles accessor
      const roleNames = Roles.all();
      const usersPerRole = 2;
      const seededData = { users: [] as { role: string; id: string; email: string; password: string }[] };

      for (const role of roleNames) {
        for (let i = 1; i <= usersPerRole; i++) {
          const email = `${role}${String(i)}@test.com`;
          const password = 'password123';
          const userResult = await this.authService.api.createUser({
            body: {
              name: `${role.charAt(0).toUpperCase() + role.slice(1)} User ${String(i)}`,
              email,
              password,
              data: { 
                role, 
                emailVerified: true, 
                image: `https://avatars.githubusercontent.com/u/${String(i)}?v=4`
              },
            },
          });
          const user = userResult.user;

          seededData.users.push({ role, id: user.id, email, password });

          console.log(`Created ${role} user ${String(i)}: ${email} (ID: ${user.id})`);
        }
      }

      // Record that this seed version has been applied
      await this.databaseService.db.insert(schema.seedVersion).values({
        version: SEED_VERSION,
      });

      console.log(`✅ Database seeded successfully with role-based users and API keys (version ${SEED_VERSION})`);
    } catch (error) {
      console.error("❌ Seeding failed:", error);
      throw error;
    }
  }

  /**
   * Seeds a dev auth user if DEV_AUTH_KEY and DEV_AUTH_EMAIL are configured.
   * This user can be impersonated using the master token authentication in development.
   */
  private async seedDevAuthUser(): Promise<void> {
    const devAuthKey = this.configService.get<string>('DEV_AUTH_KEY');
    const devAuthEmail = this.configService.get<string>('DEV_AUTH_EMAIL');

    if (!devAuthKey || !devAuthEmail) {
      console.log('ℹ️  DEV_AUTH_KEY or DEV_AUTH_EMAIL not configured, skipping dev auth user creation');
      return;
    }

    console.log(`🔐 Creating dev auth user for email: ${devAuthEmail}...`);

    // Check if user already exists using direct database query
    const existingUser = await this.databaseService.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, devAuthEmail))
      .limit(1);
    
    if (existingUser.length > 0 && existingUser[0]) {
      console.log(`✅ Dev auth user already exists: ${devAuthEmail} (ID: ${existingUser[0].id})`);
      return;
    }

    // Generate a random password (not needed for dev auth, but required by Better Auth)
    const randomPassword = nanoid(32);

    try {
      // Use type-safe Roles accessor - throws InvalidRoleError if role doesn't exist
      const superAdminRole = Roles.admin;
      
      const userResult = await this.authService.api.createUser({
        body: {
          name: 'Dev Auth User',
          email: devAuthEmail,
          password: randomPassword,
          data: {
            role: superAdminRole,
            emailVerified: true,
            image: 'https://avatars.githubusercontent.com/u/1?v=4',
          },
        },
      });

      console.log(`✅ Created dev auth user: ${devAuthEmail} (ID: ${userResult.user.id})`);
      console.log(`   This user can be impersonated using DEV_AUTH_KEY in development mode`);
    } catch (error) {
      // If user creation fails (e.g., user already exists), log and continue
      console.warn(`⚠️  Could not create dev auth user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
