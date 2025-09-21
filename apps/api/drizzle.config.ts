import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './src/config/drizzle/schema/index.ts',
    out: './src/config/drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || '',
    }
})