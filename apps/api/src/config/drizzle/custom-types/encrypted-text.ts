import { customType } from "drizzle-orm/pg-core";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { validateApiEnvPath } from "@repo/env";

// @ts-expect-error process.env.AUTH_SECRET may be undefined but is checked in this function so its not a problem
const AUTH_SECRET = validateApiEnvPath(process.env.AUTH_SECRET, "AUTH_SECRET");

/**
 * Encryption configuration
 * ENCRYPTION_KEY must be exactly 32 bytes (256 bits) for AES-256
 * If not provided, we'll generate one (NOT RECOMMENDED for production)
 */
const ENCRYPTION_KEY = AUTH_SECRET
    ? Buffer.from(AUTH_SECRET, "hex")
    : (() => {
          console.warn(
              "⚠️  WARNING: ENCRYPTION_KEY not found in environment variables. " +
                  "Using a temporary key. This is NOT secure for production! " +
                  "Generate a key with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
          );
          return scryptSync("temporary-fallback-key", "salt", 32);
      })();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // AES block size
const SALT_LENGTH = 32; // Salt for key derivation

/**
 * Encrypts text using AES-256-GCM
 * Format: salt:iv:authTag:encryptedData (all hex encoded)
 */
function encrypt(text: string): string {
    try {
        // Generate a random salt for this encryption
        const salt = randomBytes(SALT_LENGTH);

        // Derive a unique key for this encryption using the salt
        const key = scryptSync(ENCRYPTION_KEY, salt, 32);

        // Generate random IV
        const iv = randomBytes(IV_LENGTH);

        // Create cipher
        const cipher = createCipheriv(ALGORITHM, key, iv);

        // Encrypt the text
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");

        // Get authentication tag
        const authTag = cipher.getAuthTag();

        // Combine salt, iv, authTag, and encrypted data
        return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt data");
    }
}

/**
 * Decrypts text encrypted with encrypt()
 * Expects format: salt:iv:authTag:encryptedData
 */
function decrypt(encryptedText: string): string {
    try {
        // Split the encrypted text into components
        const parts = encryptedText.split(":");
        if (parts.length !== 4) {
            throw new Error("Invalid encrypted data format");
        }

        const [saltHex, ivHex, authTagHex, encryptedData] = parts;

        // Convert from hex
        const salt = Buffer.from(saltHex, "hex");
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");

        // Derive the same key using the stored salt
        const key = scryptSync(ENCRYPTION_KEY, salt, 32);

        // Create decipher
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        // Decrypt the text
        let decrypted = decipher.update(encryptedData, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Failed to decrypt data");
    }
}

/**
 * Custom Drizzle column type that automatically encrypts/decrypts data
 *
 * Usage in schema:
 * ```typescript
 * import { encryptedText } from './custom-types/encrypted-text';
 *
 * export const myTable = pgTable('my_table', {
 *   secretField: encryptedText('secret_field'),
 *   optionalSecret: encryptedText('optional_secret').nullable(),
 * });
 * ```
 *
 * The encryption/decryption happens automatically:
 * - When inserting/updating: plain text → encrypted text stored in DB
 * - When selecting: encrypted text from DB → plain text returned to app
 */
export const encryptedText = customType<{
    data: string;
    driverData: string;
    notNull: boolean;
    default: false;
}>({
    dataType() {
        return "text";
    },

    // Convert from database to application (decrypt)
    fromDriver(value: string): string {
        if (!value) return value;
        return decrypt(value);
    },

    // Convert from application to database (encrypt)
    toDriver(value: string): string {
        if (!value) return value;
        return encrypt(value);
    },
});

/**
 * Utility function to generate a secure encryption key
 * Run this once and store the result in your ENCRYPTION_KEY env variable
 * 
 * Usage:
 * ```bash
 * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * ```
 * 
 * Or from this file:
 * ```typescript
 * import { generateEncryptionKey } from './encrypted-text';
import { validateEnv } from '#/env';
 * console.log(generateEncryptionKey());
 * ```
 */
export function generateEncryptionKey(): string {
    return randomBytes(32).toString("hex");
}
