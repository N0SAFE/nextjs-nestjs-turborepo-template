import * as Joi from 'joi';

export interface AppConfig {
  // Database
  databaseUrl: string;
  
  // API
  apiPort: number;
  
  // Authentication
  authSecret: string;
  jwtSecret: string;
  devAuthKey?: string;
  
  // Passkey
  passkeyRpId: string;
  passkeyRpName: string;
  passkeyOrigin: string;
  
  // Environment
  nodeEnv: string;
}

export const configValidationSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),
  
  // API
  API_PORT: Joi.number().default(3001),
  
  // Authentication
  AUTH_SECRET: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  DEV_AUTH_KEY: Joi.string().optional(),
  
  // Passkey
  PASSKEY_RPID: Joi.string().default('localhost'),
  PASSKEY_RPNAME: Joi.string().default('NestJS Directus Turborepo Template'),
  PASSKEY_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  
  // Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});

export const configuration = (): AppConfig => {
  return {
    databaseUrl: process.env.DATABASE_URL!,
    apiPort: parseInt(process.env.API_PORT!, 10) || 3001,
    authSecret: process.env.AUTH_SECRET!,
    jwtSecret: process.env.JWT_SECRET!,
    devAuthKey: process.env.DEV_AUTH_KEY,
    passkeyRpId: process.env.PASSKEY_RPID || 'localhost',
    passkeyRpName: process.env.PASSKEY_RPNAME || 'NestJS Directus Turborepo Template',
    passkeyOrigin: process.env.PASSKEY_ORIGIN || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
  };
};