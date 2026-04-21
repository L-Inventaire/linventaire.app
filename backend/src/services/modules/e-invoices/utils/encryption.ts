import crypto from "crypto";
import config from "config";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Encrypt a string using AES-256-CBC with the encryption key from config
 */
export function encrypt(text: string): string {
  if (!text) return "";

  const encryptionKey = config.get<string>("db.encryption_key");
  // Create a 32-byte key from the config string
  const key = crypto.createHash("sha256").update(encryptionKey).digest();

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt a string using AES-256-CBC with the encryption key from config
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  try {
    const encryptionKey = config.get<string>("db.encryption_key");
    const key = crypto.createHash("sha256").update(encryptionKey).digest();

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
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}
