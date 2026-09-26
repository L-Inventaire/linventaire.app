import Framework from "#src/platform/index";
import { Context } from "#src/types";
import config from "config";
import {
  EInvoicingConfig,
  EInvoicingConfigDefinition,
} from "#src/services/modules/e-invoices/entities/e-invoicing-config";
import {
  decryptWithKey,
  encryptWithKey,
} from "#src/services/modules/e-invoices/utils/encryption";

// Fields on e_invoicing_config that hold AES-encrypted SuperPDP credentials.
const ENCRYPTED_FIELDS: (keyof EInvoicingConfig)[] = [
  "integration_client_secret_encrypted",
  "access_token_encrypted",
  "refresh_token_encrypted",
];

const tryDecrypt = (value: string, key: string): string | null => {
  try {
    return decryptWithKey(value, key);
  } catch {
    return null;
  }
};

/**
 * Re-encrypt the SuperPDP e-invoicing credentials that were encrypted with the
 * old, committed default `db.encryption_key` ("abcdef") so they can be read
 * with the new key configured via the DB_ENCRYPTION_KEY environment variable.
 *
 * Background: the encryption key used to be hardcoded in config/default.json
 * and had no env override, so any existing deployment encrypted credentials
 * with SHA256("abcdef"). Now that the key must be provided (and rotated) via
 * DB_ENCRYPTION_KEY, previously-stored credentials would otherwise become
 * undecryptable.
 *
 * The legacy key defaults to "abcdef" and can be overridden with the
 * LEGACY_DB_ENCRYPTION_KEY environment variable (for deployments that used a
 * different key).
 *
 * Idempotent and non-destructive:
 *  - if the current key already decrypts a field, it is left untouched;
 *  - a field that decrypts with neither key is left untouched and only logged
 *    (we never overwrite a value we cannot read);
 *  - a no-op when the legacy and current keys are identical.
 */
export const reencryptEInvoicingCredentials = async (ctx: Context) => {
  const legacyKey =
    process.env.LEGACY_DB_ENCRYPTION_KEY || "abcdef";
  const currentKey = config.get<string>("db.encryption_key");

  if (!currentKey) {
    console.log(
      "[migrations] 020: no db.encryption_key configured, skipping re-encryption"
    );
    return;
  }

  if (legacyKey === currentKey) {
    console.log(
      "[migrations] 020: legacy and current encryption keys are identical, nothing to rotate"
    );
    return;
  }

  const db = await Framework.Db.getService();

  let rows: EInvoicingConfig[] = [];
  let offset = 0;
  let migratedFields = 0;
  let unreadableFields = 0;

  do {
    try {
      rows = await db.select<EInvoicingConfig>(
        ctx,
        EInvoicingConfigDefinition.name,
        {} as Partial<EInvoicingConfig>,
        { offset, limit: 500, index: "id" }
      );
    } catch (e: any) {
      // Table does not exist yet (no e-invoicing configured): nothing to do.
      console.log(
        "[migrations] 020: e_invoicing_config not readable, skipping",
        e?.message
      );
      return;
    }

    for (const row of rows) {
      const patch: Partial<EInvoicingConfig> = {};

      for (const field of ENCRYPTED_FIELDS) {
        const value = (row as any)[field] as string;
        if (!value) continue;

        // Already readable with the current key -> already migrated.
        if (tryDecrypt(value, currentKey) !== null) continue;

        // Try the legacy key; only rewrite if we could actually read it.
        const plain = tryDecrypt(value, legacyKey);
        if (plain === null) {
          unreadableFields++;
          console.warn(
            `[migrations] 020: field ${field} of config ${row.id} could not be decrypted with either key, leaving as-is`
          );
          continue;
        }

        (patch as any)[field] = encryptWithKey(plain, currentKey);
        migratedFields++;
      }

      if (Object.keys(patch).length > 0) {
        await db.update<EInvoicingConfig>(
          ctx,
          EInvoicingConfigDefinition.name,
          { id: row.id, client_id: row.client_id },
          patch,
          { triggers: false }
        );
      }
    }

    console.log(
      "[migrations] 020: re-encrypting e-invoicing credentials... offset=",
      offset,
      "length=",
      rows.length
    );

    offset += rows.length;
  } while (rows.length > 0);

  console.log(
    `[migrations] 020: done. Re-encrypted ${migratedFields} field(s); ${unreadableFields} left untouched (undecryptable).`
  );
};
