import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
    masterTokenPlugin,
    loginAsPlugin,
    pushNotificationsPlugin,
    useAdmin,
    useInvite,
    useOrganization
} from "./plugins";

 
export const betterAuthFactory = <TSchema extends Record<string, unknown> = Record<string, never>>(
    database: unknown,
    env: {
        DEV_AUTH_KEY: string | undefined;
        DEFAULT_ADMIN_EMAIL: string | undefined;
        NODE_ENV: string;
        ENABLE_MASTER_TOKEN?: boolean;
        BETTER_AUTH_SECRET?: string;
        BASE_URL?: string;
        APP_URL?: string;
        NEXT_PUBLIC_APP_URL?: string;
        TRUSTED_ORIGINS?: string;
        AUTH_BASE_DOMAIN?: string;
    }
) => {
    const dbInstance = database as NodePgDatabase<TSchema>;

    const { DEV_AUTH_KEY, DEFAULT_ADMIN_EMAIL, ENABLE_MASTER_TOKEN, BETTER_AUTH_SECRET, BASE_URL, APP_URL, NEXT_PUBLIC_APP_URL, TRUSTED_ORIGINS, AUTH_BASE_DOMAIN } = env;

    // Build trusted origins: both public and private web app URLs + additional origins
    const origins: string[] = [];

    // Trust the private Docker network URL (APP_URL)
    if (APP_URL) {
        origins.push(APP_URL);
    }

    // Trust the public web app URL (NEXT_PUBLIC_APP_URL)
    if (NEXT_PUBLIC_APP_URL) {
        origins.push(NEXT_PUBLIC_APP_URL);
    }

    // Add additional trusted origins if provided
    if (TRUSTED_ORIGINS) {
        const additionalOrigins = TRUSTED_ORIGINS.split(",").map((origin) => origin.trim());
        origins.push(...additionalOrigins);
    }

    const isHttps = BASE_URL?.startsWith("https://") ?? false;

    // Use explicit AUTH_BASE_DOMAIN if provided, otherwise no domain sharing
    // AUTH_BASE_DOMAIN should be set to the parent domain (e.g., ".sebille.net")
    // This allows cookie sharing between subdomains like:
    // - api-the-gossip-club.sebille.net + the-gossip-club.sebille.net
    const cookieDomain: string | undefined = isHttps && AUTH_BASE_DOMAIN ? AUTH_BASE_DOMAIN : undefined;

    const config = {
        secret: BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
        baseURL: BASE_URL ?? process.env.NEXT_PUBLIC_API_URL,
        trustedOrigins: origins.length > 0 ? origins : undefined,
        advanced: {
            // In production with HTTPS, use secure cookies
            // CRITICAL: Must match the isSecure setting in middleware
            useSecureCookies: isHttps,
            // Set cross-origin cookie options for subdomain sharing
            // The domain should be set here, not in cookieOptions
            crossSubDomainCookies: {
                enabled: isHttps && !!cookieDomain,
                ...(cookieDomain ? { domain: cookieDomain } : {}),
            },
        },
        database: drizzleAdapter(dbInstance, {
            provider: "pg",
        }),
        emailAndPassword: {
            enabled: true,
        },
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 5 * 60, // Cache duration in seconds
            },
        },
        plugins: [
            useAdmin(),
            masterTokenPlugin({
                devAuthKey: DEV_AUTH_KEY ?? "",
                enabled: ENABLE_MASTER_TOKEN ?? (!!DEV_AUTH_KEY && !!DEFAULT_ADMIN_EMAIL),
                masterEmail: DEFAULT_ADMIN_EMAIL ?? "",
            }),
            loginAsPlugin({
                enabled: !!DEV_AUTH_KEY,
                devAuthKey: DEV_AUTH_KEY ?? "",
            }),
            openAPI(),
            useInvite({
                inviteDurationDays: 7,
            }),
            useOrganization(),
            pushNotificationsPlugin()
        ],
    };

    const auth = betterAuth(config);

    return { auth: { ...auth, config } };
};
