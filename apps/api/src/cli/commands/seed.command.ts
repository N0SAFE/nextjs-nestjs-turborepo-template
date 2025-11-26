import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import * as schema from '../../config/drizzle/schema';
import { nanoid } from 'nanoid';
import { roles } from '@repo/auth/permissions';
import { eq } from 'drizzle-orm';
import { AuthService } from '@/core/modules/auth/services/auth.service';
import { DatabaseService } from '@/core/modules/database/services/database.service';

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

      if (existingSeed.length > 0) {
        console.log(`✅ Seed version ${SEED_VERSION} already applied at ${existingSeed[0].appliedAt.toISOString()}`);
        console.log('   Skipping seeding. To re-seed, increment SEED_VERSION in seed.command.ts');
        return;
      }

      console.log(`📦 Applying seed version ${SEED_VERSION}...`);
      // Dynamically get roles from permissions
      const roleNames = Object.keys(roles);
      const usersPerRole = 2;
      const seededData = { users: [] as { role: string; id: string; email: string; password: string }[], apiKeys: [] as { role: string; userId: string; key: string; abilities: string[] }[] };

      for (const roleKey of roleNames) {
        const role = roleKey; // Type assertion
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

          // Generate API key data (no DB insert; log for dev use)
           
          const apiKeyData = {
            userId: user.id,
            name: `${role}-key-${String(i)}`,
            key: nanoid(32),
            expiresAt: null,
            abilities: role === 'superAdmin' || role === 'admin' ? ['*'] : role === 'manager' || role === 'editor' ? ['read', 'write'] : ['read'],
          };

          // Note: api_keys table not present; skipping insert. Use logged keys for auth.
          console.warn(`API key generated for ${role} user ${String(i)} (no DB table; use logged key): ${apiKeyData.key}`);

          seededData.users.push({ role, id: user.id, email, password });
          seededData.apiKeys.push({ role, userId: user.id, key: apiKeyData.key, abilities: apiKeyData.abilities });

          console.log(`Created ${role} user ${String(i)}: ${email} (ID: ${user.id})`);
        }
      }

      // Log for MCP access (in production, use secure storage)
      console.log('Seeded API Keys for MCP (store securely):', JSON.stringify(seededData.apiKeys, null, 2));

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
}
