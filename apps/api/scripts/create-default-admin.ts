#!/usr/bin/env -S bun

/**
 * Script to create a default admin user on startup if it doesn't exist
 * This runs during production deployment to ensure there's always an admin account
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/config/drizzle/schema';
import { eq } from 'drizzle-orm';
import { admin } from 'better-auth/plugins';

interface AdminConfig {
  email: string;
  password: string;
  databaseUrl: string;
}

/**
 * Parse configuration from environment
 */
function getConfig(): AdminConfig {
  const databaseUrl = process.env.DATABASE_URL;
  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@admin.com';
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!password) {
    console.log('⚠️  DEFAULT_ADMIN_PASSWORD not set, skipping default admin creation');
    console.log('   Set DEFAULT_ADMIN_PASSWORD in your .env file to create a default admin user');
    process.exit(0);
  }

  return { email, password, databaseUrl };
}

/**
 * Check if user exists
 */
async function userExists(db: ReturnType<typeof drizzle>, email: string): Promise<boolean> {
  const existingUser = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  return existingUser.length > 0;
}

/**
 * Create admin user using Better Auth API
 */
async function createAdminUser(config: AdminConfig): Promise<void> {
  console.log('🔐 Checking for default admin user...');

  const pool = new Pool({
    connectionString: config.databaseUrl,
  });

  const db = drizzle(pool, { schema });

  try {
    // Check if admin user already exists
    if (await userExists(db, config.email)) {
      console.log(`✅ Admin user already exists: ${config.email}`);
      return;
    }

    console.log(`👤 Creating default admin user: ${config.email}`);

    // Import Better Auth dynamically to avoid initialization issues
    const { betterAuth } = await import('better-auth');
    const { drizzleAdapter } = await import('better-auth/adapters/drizzle');
    
    // Create a temporary auth instance for user creation
    const auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: 'pg',
      }),
      emailAndPassword: {
        enabled: true,
      },
      advanced: {
        disableOriginCheck: true
      },
      plugins: [admin()],
    });

    // Create the admin user
    const result = await auth.api.createUser({
      body: {
        name: 'Admin',
        email: config.email,
        password: config.password,
        data: {
          role: 'admin',
          emailVerified: true,
          image: 'https://avatars.githubusercontent.com/u/1?v=4'
        },
      },
    });

    if (result.user?.id) {
      console.log(`✅ Created default admin user successfully`);
      console.log(`   Email: ${config.email}`);
      console.log(`   ID: ${result.user.id}`);
      console.log(`   Role: admin`);
    } else {
      console.error('❌ Failed to create admin user: No user ID returned');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    const config = getConfig();
    await createAdminUser(config);
    console.log('✨ Default admin setup completed\n');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
