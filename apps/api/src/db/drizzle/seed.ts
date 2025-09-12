import { db } from './index';
import { user, apiKey } from './schema';
import { nanoid } from 'nanoid';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create admin user
    const adminUser = {
      id: nanoid(),
      name: 'Admin User',
      email: 'admin@admin.com',
      emailVerified: true,
      image: 'https://avatars.githubusercontent.com/u/0?v=4',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create sample users
    const sampleUsers = [
      adminUser,
      {
        id: nanoid(),
        name: 'John Doe',
        email: 'john@example.com',
        emailVerified: true,
        image: 'https://avatars.githubusercontent.com/u/1?v=4',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(),
        name: 'Jane Smith',
        email: 'jane@example.com',
        emailVerified: true,
        image: 'https://avatars.githubusercontent.com/u/2?v=4',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(user).values(sampleUsers);

    // Create API key for admin user
    const adminApiKey = {
      id: nanoid(),
      name: 'Development API Key',
      key: 'dev_admin_api_key_' + nanoid(32),
      userId: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: null, // Never expires for development
      isActive: true,
    };

    await db.insert(apiKey).values([adminApiKey]);

    console.log('✅ Database seeded successfully');
    console.log(`🔑 Admin API Key: ${adminApiKey.key}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();