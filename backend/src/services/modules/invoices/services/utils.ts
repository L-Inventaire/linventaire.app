import Clients from "#src/services/clients/entities/clients";
import Contacts from "../../contacts/entities/contacts";
import Invoices from "../entities/invoices";

export const getInvoiceWithFormatsOverrides = (
  invoice: Invoices,
  ...overrides: (Clients | Contacts)[]
) => {
  invoice.format = mergeObjects(
    invoice.format,
    ...overrides.map((override) => override?.invoices || ({} as any))
  );
  return invoice;
};

// Complete object 1 null and undefined values with object 2 values
const mergeObjects = <T>(...overrides: T[]) => {
  if (overrides.length === 1) return overrides[0];

  // Merge the last two ones right into left one
  const object1 = overrides[overrides.length - 2] || ({} as T);
  const object2 = overrides[overrides.length - 1] || ({} as T);
  const result = { ...object1 };

  Object.keys(object2).forEach((key) => {
    if (result[key] === null || result[key] === undefined) {
      result[key] = object2[key] || "";
    }
  });

  // If there is 3 or more, we'll have to merge this result with the others on the left
  if (overrides.length > 2)
    return mergeObjects(...overrides.slice(0, -2), result);
  return result;
};

/**
 * File name of the PDF of a document: its reference ("FA-2026-0012.pdf").
 * References may contain characters not allowed in file names (FA/2026/12).
 */
export const getInvoicePdfFileName = (invoice: Pick<Invoices, "reference">) =>
  `${
    (invoice.reference || "").replace(/[/\\:*?"<>|]+/g, "-").trim() ||
    "document"
  }.pdf`;

/**
 * Content-Disposition header with the document file name, for the browser
 * PDF viewer (inline) and for downloads (attachment). RFC 6266: plain ASCII
 * fallback plus the UTF-8 encoded name.
 */
export const getPdfContentDisposition = (
  fileName: string,
  disposition: "inline" | "attachment"
) =>
  `${disposition}; filename="${fileName.replace(
    /[^\x20-\x7e]|"/g,
    "_"
  )}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
