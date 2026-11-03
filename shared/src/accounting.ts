import { getVatCode, standardCodeToVatValue } from "./consts";

// ---------------------------------------------------------------------------
// Accounting accounts used by the accounting export: the account of the article
// first, then the default account of the company for this kind of line.
// Shared by the backend (export) and the frontend (settings page, placeholders).
// ---------------------------------------------------------------------------

export class AccountingAccountRef {
  standard_identifier = "string"; // Numéro sur le plan comptable
  standard: "pcg" | "ifrs" = "pcg"; // Plan Comptable Général
  name = "string";
}

// Default sell / buy accounts per kind of line
export class AccountingLineDefaults {
  product = new AccountingAccountRef();
  service = new AccountingAccountRef();
  consumable = new AccountingAccountRef();
}

// VAT accounts: one default account, optionally overridden per VAT code (S:20, S:10...)
export class AccountingVatDefaults {
  default = new AccountingAccountRef();
  rates: { [vat: string]: AccountingAccountRef } = {};
}

// Every invoice and credit note is also sent by email (Factur-X PDF) to an
// address of the accountant (or of its software): one for the sales, one for
// the purchases. Only the documents after the activation date are sent.
export class AccountingEmailExport {
  sales_email = "string"; // Sent when the document is sent
  sales_enabled_at = 0; // Set by the backend when the address is set
  purchases_email = "string"; // Sent when the document is booked ("Comptabiliser")
  purchases_enabled_at = 0;
}

export class ClientAccounting {
  sell = new AccountingLineDefaults();
  buy = new AccountingLineDefaults();
  vat_collected = new AccountingVatDefaults(); // Sales (44571)
  vat_deductible = new AccountingVatDefaults(); // Purchases (44566)
  email_export?: AccountingEmailExport = new AccountingEmailExport();
}

export type AccountingLineKind = keyof AccountingLineDefaults;
export type AccountingAccount = Pick<
  AccountingAccountRef,
  "standard_identifier" | "standard" | "name"
>;

const pcg = (standard_identifier: string, name: string): AccountingAccount => ({
  standard_identifier,
  standard: "pcg",
  name,
});

// Used when the company did not configure its own default accounts
export const DEFAULT_CLIENT_ACCOUNTING = {
  sell: {
    product: pcg("707", "Ventes de marchandises"),
    service: pcg("706", "Prestations de services"),
    consumable: pcg("707", "Ventes de marchandises"),
  },
  buy: {
    product: pcg("607", "Achats de marchandises"),
    service: pcg("604", "Achats d'études et prestations de services"),
    consumable: pcg("6022", "Fournitures consommables"),
  },
  vat_collected: pcg("44571", "TVA collectée"),
  vat_deductible: pcg("44566", "TVA sur autres biens et services"),
};

const isSet = (account?: Partial<AccountingAccount> | null) =>
  !!account?.standard_identifier;

// Correction lines have no kind of their own, they are booked as services
export const getAccountingLineKind = (lineType?: string): AccountingLineKind =>
  lineType === "product" || lineType === "consumable" ? lineType : "service";

/** Default account of the company for a kind of line (company settings, then PCG) */
export const getDefaultLineAccount = (
  accounting: Partial<ClientAccounting> | undefined | null,
  side: "sell" | "buy",
  kind: AccountingLineKind,
): AccountingAccount => {
  const configured = accounting?.[side]?.[kind];
  return isSet(configured)
    ? (configured as AccountingAccount)
    : DEFAULT_CLIENT_ACCOUNTING[side][kind];
};

/** Account of an invoice line: article account, then company default */
export const getLineAccount = (
  accounting: Partial<ClientAccounting> | undefined | null,
  side: "sell" | "buy",
  line: { type?: string },
  article?: {
    type?: string;
    accounting?: {
      sell?: Partial<AccountingAccount>;
      buy?: Partial<AccountingAccount>;
    };
  } | null,
): AccountingAccount & { is_default: boolean } => {
  const fromArticle = article?.accounting?.[side];
  if (isSet(fromArticle)) {
    return {
      standard_identifier: fromArticle!.standard_identifier!,
      standard: fromArticle!.standard || "pcg",
      name: fromArticle!.name || "",
      is_default: false,
    };
  }
  const kind = getAccountingLineKind(article?.type || line.type);
  return { ...getDefaultLineAccount(accounting, side, kind), is_default: true };
};

/** VAT account for a VAT code, empty for codes without VAT (exports, intra-EU...) */
export const getVatAccount = (
  accounting: Partial<ClientAccounting> | undefined | null,
  side: "sell" | "buy",
  vat: string,
): AccountingAccount | null => {
  const code = getVatCode(vat || "") || "";
  if (!standardCodeToVatValue[code]) return null;

  const key = side === "sell" ? "vat_collected" : "vat_deductible";
  const configured = accounting?.[key];
  const forRate = configured?.rates?.[code];
  if (isSet(forRate)) return forRate as AccountingAccount;
  if (isSet(configured?.default)) return configured!.default;
  return DEFAULT_CLIENT_ACCOUNTING[key];
};
