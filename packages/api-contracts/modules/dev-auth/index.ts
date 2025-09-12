import { oc } from '@orpc/contract';
import { z } from 'zod';

// Schema for seeded user with API key
export const seededUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  apiKey: z.string(),
  image: z.string().nullable(),
});

// Schema for API key login request
export const apiKeyLoginSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

// Schema for API key login response
export const apiKeyLoginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string().optional(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
  }).optional(),
  error: z.string().optional(),
});

// Individual contracts
export const getSeededUsersContract = oc
  .route({
    method: "GET",
    path: "/seeded-users",
    summary: "Get seeded users",
    description: "Get list of seeded users with API keys for development",
  })
  .output(z.array(seededUserSchema));

export const loginWithApiKeyContract = oc
  .route({
    method: "POST",
    path: "/login-with-api-key",
    summary: "Login with API key",
    description: "Authenticate using API key for development",
  })
  .input(apiKeyLoginSchema)
  .output(apiKeyLoginResponseSchema);

export const devAuthContract = oc.tag("DevAuth").prefix("/dev-auth").router({
  getSeededUsers: getSeededUsersContract,
  loginWithApiKey: loginWithApiKeyContract,
});

export type DevAuthContract = typeof devAuthContract;
export type SeededUser = z.infer<typeof seededUserSchema>;
export type ApiKeyLoginRequest = z.infer<typeof apiKeyLoginSchema>;
export type ApiKeyLoginResponse = z.infer<typeof apiKeyLoginResponseSchema>;