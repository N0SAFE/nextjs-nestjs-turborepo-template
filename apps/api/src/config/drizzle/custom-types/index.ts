/**
 * Custom Drizzle column types
 * 
 * This module provides custom column types that extend Drizzle's built-in types
 * with additional functionality like automatic encryption/decryption.
 */

export { encryptedText, generateEncryptionKey } from "./encrypted-text";
