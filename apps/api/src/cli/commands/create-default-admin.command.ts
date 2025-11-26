import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { AuthService } from '@/core/modules/auth/services/auth.service';
import { DatabaseService } from '@/core/modules/database/services/database.service';
import { EnvService } from '@/config/env/env.service';
import { eq } from 'drizzle-orm';
import * as schema from '../../config/drizzle/schema';
import { apiEnvSchema } from '@repo/env';
import zod from 'zod/v4';

// Extend the API schema with command-specific environment variables
const createDefaultAdminEnvSchema = apiEnvSchema.safeExtend({
  DEFAULT_ADMIN_EMAIL: zod.email().min(1, 'DEFAULT_ADMIN_EMAIL is required'),
  DEFAULT_ADMIN_PASSWORD: zod.string().min(1, 'DEFAULT_ADMIN_PASSWORD is required'),
});

type CreateDefaultAdminEnv = zod.infer<typeof createDefaultAdminEnvSchema>;

@Injectable()
@Command({
  name: 'create-default-admin',
  description: 'Create a default admin user if it does not exist',
})
export class CreateDefaultAdminCommand extends CommandRunner {
  private readonly commandEnvService: EnvService<CreateDefaultAdminEnv>;
  
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
    private readonly envService: EnvService,
  ) {
    super();
    this.commandEnvService = this.envService.use(createDefaultAdminEnvSchema);
  }

  async run(): Promise<void> {
    console.log('🔐 Checking for default admin user...');

    try {
      const email = this.commandEnvService.get('DEFAULT_ADMIN_EMAIL');
      const password = this.commandEnvService.get('DEFAULT_ADMIN_PASSWORD');

      // Check if admin user already exists
      const existingUser = await this.databaseService.db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`✅ Admin user already exists: ${email}`);
        return;
      }

      console.log(`👤 Creating default admin user: ${email}`);

      // Create the admin user
      const result = await this.authService.api.createUser({
        body: {
          name: 'Admin',
          email: email,
          password: password,
          data: {
            role: 'admin',
            emailVerified: true,
            image: 'https://avatars.githubusercontent.com/u/1?v=4',
          },
        },
      });

      if (result.user.id) {
        console.log(`✅ Created default admin user successfully`);
        console.log(`   Email: ${email}`);
        console.log(`   ID: ${result.user.id}`);
        console.log(`   Role: admin`);
      } else {
        console.error('❌ Failed to create admin user: No user ID returned');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to create admin user:', error);
      throw error;
    }
  }
}
