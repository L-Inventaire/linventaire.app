import crypto from "crypto";
import config from "config";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

const deriveKey = (keyString: string) =>
  crypto.createHash("sha256").update(keyString).digest();

/**
 * Encrypt a string using AES-256-CBC with an explicit key string.
 */
export function encryptWithKey(text: string, keyString: string): string {
  if (!text) return "";

  const key = deriveKey(keyString);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt a string using AES-256-CBC with an explicit key string.
 * Throws on any failure (wrong key, bad padding, malformed input) so callers
 * that need to distinguish "wrong key" from "empty" can catch it. Prefer
 * `decrypt` for the everyday case where a failure should degrade to "".
 */
export function decryptWithKey(encryptedText: string, keyString: string): string {
  if (!encryptedText) return "";

  const key = deriveKey(keyString);

  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypt a string using AES-256-CBC with the encryption key from config
 */
export function encrypt(text: string): string {
  return encryptWithKey(text, config.get<string>("db.encryption_key"));
}

/**
 * Decrypt a string using AES-256-CBC with the encryption key from config
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  try {
    return decryptWithKey(encryptedText, config.get<string>("db.encryption_key"));
  } catch (error: any) {
    console.error("Decryption error:", error);
    return "";
  }
}
