import config from "config";

/**
 * Fail fast on startup if the application is running in production with
 * insecure default secrets. These defaults live in config/default.json for
 * local development only and are committed to a public repository, so they
 * MUST be overridden via environment variables in any real deployment.
 *
 * The corresponding env vars are declared in
 * config/custom-environment-variables.json:
 *   - JWT_SECRET           -> jwt.secret
 *   - SIGNATURES_SECRET    -> signatures.secret
 *   - DB_ENCRYPTION_KEY    -> db.encryption_key
 *   - SIGNATURE_DOCUMENSO_KEY -> signature.documenso.key (only if adapter=documenso)
 */
export const assertSecureConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) return;

  const errors: string[] = [];

  const requireSecret = (path: string, envVar: string) => {
    const value = config.has(path) ? config.get<string>(path) : "";
    if (!value || value.trim() === "" || /change-me|dev-only/i.test(value)) {
      errors.push(
        `Missing or insecure "${path}" in production. Set the ${envVar} environment variable to a strong secret.`
      );
    }
  };

  requireSecret("jwt.secret", "JWT_SECRET");
  requireSecret("signatures.secret", "SIGNATURES_SECRET");
  requireSecret("db.encryption_key", "DB_ENCRYPTION_KEY");

  const signatureAdapter = config.has("signature.adapter")
    ? config.get<string>("signature.adapter")
    : "internal";
  if (signatureAdapter === "documenso") {
    requireSecret("signature.documenso.key", "SIGNATURE_DOCUMENSO_KEY");
  }

  if (errors.length > 0) {
    throw new Error(
      "Insecure configuration detected, refusing to start:\n - " +
        errors.join("\n - ")
    );
  }
};
