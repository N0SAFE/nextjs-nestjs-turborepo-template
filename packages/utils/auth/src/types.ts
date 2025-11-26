import { betterAuthFactory } from './server/auth';
/**
 * Interface for environment service to be implemented by the API
 * This allows the auth package to remain decoupled from the API implementation
 */
export interface IEnvService {
  get(key: string): string | undefined
  get<T = string>(key: string, defaultValue: T): T
}

export type Auth = Awaited<ReturnType<typeof betterAuthFactory>>['auth'];

export type Session = Auth['$Infer']['Session']
export type User = Session['user']