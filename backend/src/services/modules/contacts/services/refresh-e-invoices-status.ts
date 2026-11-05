import Framework from "#src/platform/index";
import { Context, createContext } from "#src/types";
import Contacts, { ContactsDefinition } from "../entities/contacts";
import {
  getFrenchDirectoryEntries,
  searchFrenchDirectoryCompanies,
} from "./french-directory";

type ContactEInvoicesFields = Pick<
  Contacts,
  | "id"
  | "client_id"
  | "type"
  | "address"
  | "business_registered_id"
  | "e_invoices_identifier"
  | "e_invoices_active"
>;

/**
 * The e-invoicing status of a contact is only computed when its SIREN
 * changes, so a company not active (yet) in the directory stays orange
 * forever. It is worth checking again for a French company with a SIREN /
 * SIRET whose e-invoicing is not active. Without SIREN there is nothing to
 * search, and a private individual or a company abroad is not concerned.
 */
export const needsEInvoicesStatusRefresh = (
  contact: Partial<ContactEInvoicesFields> | null | undefined
): contact is ContactEInvoicesFields => {
  if (!contact?.id || !contact.client_id) return false;
  if (contact.type === "person") return false;
  const country = (contact.address?.country || "").trim().toUpperCase();
  if (country && country !== "FR" && country !== "FRANCE") return false;
  return !!contact.business_registered_id?.trim() && !contact.e_invoices_active;
};

/**
 * Finds the e-invoicing directory entry of a company, like a user would do it:
 * - directory entries of the registration number (SIREN or SIRET),
 * - otherwise, search of the company by SIREN (the 9 first digits of a
 *   SIRET): if there is a single company, its entries are taken.
 * Returns the active entry, or else the first entry found (inactive).
 */
export const findEInvoicesEntry = async (
  ctx: Context,
  businessRegisteredId: string
) => {
  const registrationId = businessRegisteredId.replace(/\s/g, "");
  const entries = await getFrenchDirectoryEntries(ctx, registrationId);
  const active = entries.find((e) => e.is_active);
  if (active) return active;

  const siren = registrationId.replace(/\D/g, "").slice(0, 9);
  if (siren.length === 9) {
    const companies = await searchFrenchDirectoryCompanies(ctx, {
      number: siren,
      limit: 2,
    });
    if (companies.data.length === 1) {
      const companyEntries = await getFrenchDirectoryEntries(
        ctx,
        companies.data[0].number
      );
      const companyEntry =
        companyEntries.find((e) => e.is_active) || companyEntries[0];
      if (companyEntry) return companyEntry;
    }
  }

  return entries[0] || null;
};

// Do not call the directory for the same contact again and again (many
// documents created for the same customer, invoice opened several times...)
const REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
const lastRefreshes = new Map<string, number>();

const isInCooldown = (key: string) => {
  const now = Date.now();
  for (const [k, at] of lastRefreshes) {
    if (now - at > REFRESH_COOLDOWN_MS) lastRefreshes.delete(k);
  }
  return lastRefreshes.has(key);
};

/** Only for tests */
export const resetEInvoicesStatusRefreshCooldown = () => lastRefreshes.clear();

/**
 * Checks again in the directory the e-invoicing status of a contact whose
 * e-invoicing is not active, and saves it when an entry is found.
 *
 * Never throws: a directory failure (or a company not found) keeps the current
 * status, it never clears it. Returns the contact, updated or not.
 */
export const refreshContactEInvoicesStatus = async <
  T extends Partial<ContactEInvoicesFields>
>(
  ctx: Context,
  contact: T,
  options: { force?: boolean } = {}
): Promise<T> => {
  if (!needsEInvoicesStatusRefresh(contact)) return contact;

  const key = `${contact.client_id}:${contact.id}`;
  if (!options.force && isInCooldown(key)) return contact;
  lastRefreshes.set(key, Date.now());

  try {
    const entry = await findEInvoicesEntry(ctx, contact.business_registered_id);
    if (!entry) return contact;

    const changes = {
      e_invoices_identifier:
        entry.identifier || contact.e_invoices_identifier || "",
      e_invoices_active: !!entry.is_active,
    };
    if (
      changes.e_invoices_identifier === (contact.e_invoices_identifier || "") &&
      changes.e_invoices_active === !!contact.e_invoices_active
    ) {
      return contact;
    }

    const db = await Framework.Db.getService();
    await db.update<Contacts>(
      ctx,
      ContactsDefinition.name,
      { client_id: contact.client_id, id: contact.id },
      changes
    );
    return { ...contact, ...changes };
  } catch (e: any) {
    Framework.LoggerDb.get("contacts").error(
      ctx,
      `E-invoices status refresh failed for contact ${contact.id}: ${
        e?.message || e
      }`
    );
    return contact;
  }
};

/**
 * Same as refreshContactEInvoicesStatus, but outside of the current request
 * (and of its transaction): used when a document is created, so the creation
 * is never slowed down by the directory.
 */
export const refreshContactEInvoicesStatusLater = (
  client_id: string,
  contactId: string
) => {
  setTimeout(async () => {
    const ctx: Context = { ...createContext("contacts", "SYSTEM"), client_id };
    try {
      const db = await Framework.Db.getService();
      const contact = await db.selectOne<Contacts>(
        ctx,
        ContactsDefinition.name,
        { client_id, id: contactId }
      );
      await refreshContactEInvoicesStatus(ctx, contact as Contacts);
    } catch (e) {
      Framework.LoggerDb.get("contacts").error(ctx, e as any);
    }
  }, 1000);
};
