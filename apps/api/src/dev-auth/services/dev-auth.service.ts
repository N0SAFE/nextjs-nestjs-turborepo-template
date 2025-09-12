import { Injectable } from '@nestjs/common';
import { db } from '@/db/drizzle';
import { user, apiKey } from '@/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { SeededUser, ApiKeyLoginRequest, ApiKeyLoginResponse } from '@repo/api-contracts';

@Injectable()
export class DevAuthService {
  
  async getSeededUsers(): Promise<SeededUser[]> {
    try {
      // Get users with API keys
      const usersWithApiKeys = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          apiKey: apiKey.key,
        })
        .from(user)
        .innerJoin(apiKey, eq(user.id, apiKey.userId))
        .where(eq(apiKey.isActive, true));

      return usersWithApiKeys;
    } catch (error) {
      console.error('Error fetching seeded users:', error);
      return [];
    }
  }

  async loginWithApiKey(input: ApiKeyLoginRequest): Promise<ApiKeyLoginResponse> {
    try {
      // Find user by API key
      const result = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(user)
        .innerJoin(apiKey, eq(user.id, apiKey.userId))
        .where(
          and(
            eq(apiKey.key, input.apiKey),
            eq(apiKey.isActive, true)
          )
        )
        .limit(1);

      if (result.length === 0) {
        return {
          success: false,
          error: 'Invalid API key',
        };
      }

      const userData = result[0];

      // For now, we return success with user data
      // In a real implementation, you would generate a session token
      return {
        success: true,
        user: userData,
        token: 'dev_session_token_' + userData.id, // Mock token for development
      };
    } catch (error) {
      console.error('Error during API key login:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }
}