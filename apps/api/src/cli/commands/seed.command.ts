import { Command, CommandRunner } from 'nest-commander';
import { Injectable, Inject } from '@nestjs/common';
import * as schema from '../../config/drizzle/schema';
import { nanoid } from 'nanoid';
import { Roles, ORGANIZATION_ROLES, type OrganizationRole } from '@repo/auth/permissions';
import { eq } from 'drizzle-orm';
import { AuthCoreService } from '../../core/modules/auth/services/auth-core.service';
import { DatabaseService } from '@/core/modules/database/services/database.service';
import { ConfigService } from '@nestjs/config';
import { DATABASE_SERVICE, AUTH_CORE_SERVICE, CONFIG_SERVICE } from '../tokens';

// Seed version identifier - increment this when you want to re-seed
const SEED_VERSION = 'v1.2.0';

@Command({
  name: "seed",
  description: "Seed the database with initial data",
})
@Injectable()
export class SeedCommand extends CommandRunner {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly databaseService: DatabaseService,
    @Inject(AUTH_CORE_SERVICE) private readonly authCoreService: AuthCoreService,
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
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
      const totalStart = Date.now();

      // DEV_AUTH_KEY is required for all admin operations in CLI context
      const devAuthKey = this.configService.get<string>('DEV_AUTH_KEY');
      if (!devAuthKey) {
        throw new Error('DEV_AUTH_KEY is required for seeding. Please set it in your environment.');
      }

      // Create authenticated headers for admin plugin operations
      const authHeaders = new Headers({
        Authorization: `Bearer ${devAuthKey}`,
      });

      // BOOTSTRAP: Create dev auth user first (via direct DB) - needed for masterTokenPlugin
      let start = Date.now();
      await this.seedDevAuthUser();
      console.log(`   ⏱️ Bootstrap user: ${String(Date.now() - start)}ms`);

      // BOOTSTRAP: Create default admin user if not created by create-default-admin command
      // This is a fallback - if DEFAULT_ADMIN_EMAIL is set but user doesn't exist, create with random password
      start = Date.now();
      await this.seedDefaultAdminUser();
      console.log(`   ⏱️ Default admin check: ${String(Date.now() - start)}ms`);

      // Get typed plugins bound to auth headers
      // Note: These will now work because the dev auth user exists for masterTokenPlugin
      const plugins = this.authCoreService.getRegistry().getAll(authHeaders);
      const adminPlugin = plugins.admin;
      const orgPlugin = plugins.organization;

      // Dynamically get roles from permissions using type-safe Roles accessor
      const platformRoleNames = Roles.all();
      const organizationRoleNames = ORGANIZATION_ROLES;
      const usersPerRole = 2;
      const seededData = { 
        users: [] as { role: string; id: string; email: string; password: string }[],
        organizations: [] as { id: string; name: string; slug: string }[],
      };

      // Create users for each platform role using authenticated admin plugin
      // Optimized: Create all users in parallel for faster seeding
      console.log('\n📝 Creating users with platform roles...');
      start = Date.now();
      const userCreationPromises: Promise<void>[] = [];
      
      for (const role of platformRoleNames) {
        for (let i = 1; i <= usersPerRole; i++) {
          const email = `${role}${String(i)}@test.com`;
          const password = 'password123';
          
          const promise = adminPlugin.createUser({
            name: `${role.charAt(0).toUpperCase() + role.slice(1)} User ${String(i)}`,
            email,
            password,
            data: {
              role,
              emailVerified: true,
              image: `https://avatars.githubusercontent.com/u/${String(i)}?v=4`,
            },
          }).then(userResult => {
            const user = userResult.user;
            seededData.users.push({ role, id: user.id, email, password });
            console.log(`   Created ${role} user ${String(i)}: ${email} (ID: ${user.id})`);
          });
          
          userCreationPromises.push(promise);
        }
      }
      
      // Wait for all users to be created in parallel
      await Promise.all(userCreationPromises);
      console.log(`   ⏱️ Users created: ${String(Date.now() - start)}ms`);

      // Create test organizations using Better Auth API
      // Optimized: Create organizations in parallel
      console.log('\n🏢 Creating test organizations with Better Auth API...');
      start = Date.now();

      const testOrganizations = [
        { name: 'Test Organization A', slug: 'test-org-a' },
        { name: 'Test Organization B', slug: 'test-org-b' },
      ];

      const orgCreationPromises = testOrganizations.map(async (orgData) => {
        const orgResult = await orgPlugin.createOrganization({
          name: orgData.name,
          slug: orgData.slug,
        });
        
        if (!orgResult) {
          throw new Error(`Failed to create organization: ${orgData.name}`);
        }
        
        seededData.organizations.push({
          id: orgResult.id,
          name: orgResult.name,
          slug: orgResult.slug,
        });
        console.log(`   Created organization: ${orgResult.name} (ID: ${orgResult.id})`);
      });
      
      await Promise.all(orgCreationPromises);
      console.log(`   ⏱️ Organizations created: ${String(Date.now() - start)}ms`);

      // Assign users to organizations with varied organization roles
      // Strategy: Distribute users across organizations with different org roles
      // - superAdmin users → owner role (highest org privilege)
      // - admin users → admin role (middle org privilege)
      // - user users → member role (basic org privilege)
      // Optimized: Add all members in parallel
      console.log('\n👥 Assigning users to organizations with organization roles...');
      start = Date.now();
      
      // Map platform roles to organization roles
      const platformToOrgRoleMap: Record<string, OrganizationRole> = {
        'superAdmin': 'owner',
        'admin': 'admin',
        'user': 'member',
      };

      const memberAdditionPromises: Promise<void>[] = [];
      
      for (const org of seededData.organizations) {
        console.log(`\n   Organization: ${org.name}`);
        
        for (const userData of seededData.users) {
          // Get the corresponding org role for this user's platform role
          const orgRole = platformToOrgRoleMap[userData.role] ?? 'member';
          
          const promise = orgPlugin.addMember(org.id, userData.id, orgRole)
            .then(() => {
              console.log(`      Added ${userData.email} as ${orgRole}`);
            })
            .catch((error: unknown) => {
              // User might already be a member (e.g., as creator)
              console.warn(`      ⚠️ Could not add ${userData.email}: ${error instanceof Error ? error.message : String(error)}`);
            });
          
          memberAdditionPromises.push(promise);
        }
      }
      
      await Promise.all(memberAdditionPromises);
      console.log(`   ⏱️ Members added: ${String(Date.now() - start)}ms`);

      // Summary of organization roles coverage
      console.log('\n📊 Organization roles coverage:');
      for (const orgRole of organizationRoleNames) {
        const usersWithRole = seededData.users.filter(
          u => platformToOrgRoleMap[u.role] === orgRole
        );
        console.log(`   ${orgRole}: ${String(usersWithRole.length)} users (${usersWithRole.map(u => u.email).join(', ')})`);
      }

      // Record that this seed version has been applied
      await this.databaseService.db.insert(schema.seedVersion).values({
        version: SEED_VERSION,
      });

      console.log(`\n✅ Database seeded successfully with role-based users and organizations (version ${SEED_VERSION})`);
      console.log(`   ⏱️ Total seed time: ${String(Date.now() - totalStart)}ms`);
      console.log(`   Platform roles covered: ${platformRoleNames.join(', ')}`);
      console.log(`   Organization roles covered: ${organizationRoleNames.join(', ')}`);
    } catch (error) {
      console.error("❌ Seeding failed:", error);
      throw error;
    }
  }

  /**
   * Seeds the default admin user if DEFAULT_ADMIN_EMAIL is configured.
   * This user can be impersonated using the master token authentication in development.
   * 
   * IMPORTANT: This method creates the user directly in the database (not via admin plugin)
   * because it's a bootstrap operation - the masterTokenPlugin needs this user to exist
   * before any authenticated admin operations can work.
   */
  private async seedDevAuthUser(): Promise<void> {
    const devAuthEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');

    if (!devAuthEmail) {
      console.log('ℹ️  DEFAULT_ADMIN_EMAIL not configured, skipping dev auth user creation');
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

    // Generate a random password (not needed for dev auth, but required for account record)
    const randomPassword = nanoid(32);

    try {
      // Use type-safe Roles accessor
      const superAdminRole = Roles.admin;
      
      // BOOTSTRAP: Create user directly in database since admin plugin needs this user to exist first
      // This is the only place where direct DB access for auth is acceptable - it's the bootstrap user
      const userId = nanoid();
      const now = new Date();
      
      // Create user record
      await this.databaseService.db.insert(schema.user).values({
        id: userId,
        name: 'Dev Auth User',
        email: devAuthEmail,
        emailVerified: true,
        role: superAdminRole,
        image: 'https://avatars.githubusercontent.com/u/1?v=4',
        createdAt: now,
        updatedAt: now,
      });

      // Create account record for email/password auth (required by Better Auth)
      // Hash the password using Better Auth's expected format
      const { hashPassword } = await import('better-auth/crypto');
      const hashedPassword = await hashPassword(randomPassword);
      
      await this.databaseService.db.insert(schema.account).values({
        id: nanoid(),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`✅ Created dev auth user: ${devAuthEmail} (ID: ${userId})`);
      console.log(`   This user can be impersonated using DEV_AUTH_KEY in development mode`);
    } catch (error) {
      // If user creation fails, log and continue
      console.warn(`⚠️  Could not create dev auth user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Seeds a default admin user if DEFAULT_ADMIN_EMAIL is configured but user doesn't exist.
   * This is a fallback for when create-default-admin didn't run or wasn't configured.
   * 
   * Creates the user with a random password and LOGS it so the administrator can use it.
   * This is a bootstrap operation similar to seedDevAuthUser.
   */
  private async seedDefaultAdminUser(): Promise<void> {
    const defaultAdminEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');

    if (!defaultAdminEmail) {
      console.log('ℹ️  DEFAULT_ADMIN_EMAIL not configured, skipping default admin user creation');
      return;
    }

    console.log(`👤 Checking for default admin user: ${defaultAdminEmail}...`);

    // Check if user already exists using direct database query
    const existingUser = await this.databaseService.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, defaultAdminEmail))
      .limit(1);
    
    if (existingUser.length > 0 && existingUser[0]) {
      console.log(`✅ Default admin user already exists: ${defaultAdminEmail} (ID: ${existingUser[0].id})`);
      return;
    }

    // Generate a random password and LOG IT so the admin can use it
    const randomPassword = nanoid(16); // Shorter than dev auth for usability

    try {
      // Use type-safe Roles accessor - admin role for default admin
      const adminRole = Roles.admin;
      
      // Create user directly in database (bootstrap operation)
      const userId = nanoid();
      const now = new Date();
      
      // Create user record
      await this.databaseService.db.insert(schema.user).values({
        id: userId,
        name: 'Default Admin',
        email: defaultAdminEmail,
        emailVerified: true,
        role: adminRole,
        image: 'https://avatars.githubusercontent.com/u/1?v=4',
        createdAt: now,
        updatedAt: now,
      });

      // Create account record for email/password auth (required by Better Auth)
      const { hashPassword } = await import('better-auth/crypto');
      const hashedPassword = await hashPassword(randomPassword);
      
      await this.databaseService.db.insert(schema.account).values({
        id: nanoid(),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });

      const separator = '═'.repeat(60);
      console.log(`\n${separator}`);
      console.log(`🔑 DEFAULT ADMIN USER CREATED`);
      console.log(separator);
      console.log(`   Email:    ${defaultAdminEmail}`);
      console.log(`   Password: ${randomPassword}`);
      console.log(`   User ID:  ${userId}`);
      console.log(separator);
      console.log(`⚠️  SAVE THIS PASSWORD! It won't be shown again.`);
      console.log(`   You can also set DEFAULT_ADMIN_PASSWORD env var to use a specific password.`);
      console.log(`${separator}\n`);
    } catch (error) {
      console.warn(`⚠️  Could not create default admin user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
