import Framework from "#src/platform/index";
import Contacts, {
  ContactsDefinition,
} from "#src/services/modules/contacts/entities/contacts";
import { Context } from "#src/types";

/**
 * Normalizes country codes in contact addresses from "FR-FR" to "FR"
 * and logs warnings for invalid country codes
 */
export const normalizeContactCountryCodes = async (ctx: Context) => {
  const db = await Framework.Db.getService();
  const logger = Framework.LoggerDb.get("migrations");

  const normalizeCountryCode = (country: string | undefined): string => {
    if (!country) return "";
    // Take first 2 characters and convert to uppercase
    const normalized = country.substring(0, 2).toUpperCase();
    return normalized;
  };

  const isValidCountryCode = (country: string): boolean => {
    // Valid country code is exactly 2 uppercase letters
    return /^[A-Z]{2}$/.test(country);
  };

  // Process contacts
  let contactItems = [];
  let offset = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let invalidCountries = new Set<string>();

  do {
    contactItems = await db.select<Contacts>(
      ctx,
      ContactsDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of contactItems) {
      let hasChanges = false;
      const updates: Partial<Contacts> = {};

      // Process main address
      if (entity.address && entity.address.country) {
        const originalCountry = entity.address.country;
        const normalizedCountry = normalizeCountryCode(originalCountry);

        if (normalizedCountry !== originalCountry) {
          hasChanges = true;
          updates.address = {
            ...entity.address,
            country: normalizedCountry,
          };

          if (!isValidCountryCode(normalizedCountry)) {
            invalidCountries.add(
              `${normalizedCountry} (from: ${originalCountry})`
            );
            logger.warn(
              ctx,
              `[migration] Contact ${entity.id}: Invalid country code in main address: "${normalizedCountry}" (original: "${originalCountry}")`
            );
          }
        }
      }

      // Process other addresses
      if (entity.other_addresses) {
        const updatedOtherAddresses = { ...entity.other_addresses };
        let otherAddressesChanged = false;

        for (const addressType of ["delivery", "billing", "other"] as const) {
          const address = entity.other_addresses[addressType];
          if (address && address.country) {
            const originalCountry = address.country;
            const normalizedCountry = normalizeCountryCode(originalCountry);

            if (normalizedCountry !== originalCountry) {
              otherAddressesChanged = true;
              updatedOtherAddresses[addressType] = {
                ...address,
                country: normalizedCountry,
              };

              if (!isValidCountryCode(normalizedCountry)) {
                invalidCountries.add(
                  `${normalizedCountry} (from: ${originalCountry})`
                );
                logger.warn(
                  ctx,
                  `[migration] Contact ${entity.id}: Invalid country code in ${addressType} address: "${normalizedCountry}" (original: "${originalCountry}")`
                );
              }
            }
          }
        }

        if (otherAddressesChanged) {
          hasChanges = true;
          updates.other_addresses = updatedOtherAddresses;
        }
      }

      if (hasChanges) {
        await db.update<Contacts>(
          ctx,
          ContactsDefinition.name,
          { id: entity.id, client_id: entity.client_id },
          updates,
          { triggers: false }
        );
        totalUpdated++;
      }

      totalProcessed++;
    }

    offset += contactItems.length;
  } while (contactItems.length > 0);

  logger.info(
    ctx,
    `[migration] Processed ${totalProcessed} contacts, updated ${totalUpdated} contacts`
  );

  if (invalidCountries.size > 0) {
    logger.warn(
      ctx,
      `[migration] Found ${
        invalidCountries.size
      } invalid country codes: ${Array.from(invalidCountries).join(", ")}`
    );
  }
};
