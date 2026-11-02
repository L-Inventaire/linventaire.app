import {
  ClientAccounting,
  getLineAccount,
  getVatAccount,
} from "@shared/accounting";
import {
  computePricesFromInvoice,
  getTvaValue,
  toCents,
} from "@shared/invoices";
import Articles from "../../articles/entities/articles";
import Invoices from "../../invoices/entities/invoices";

export type AccountingExportLineAmounts = {
  line: Invoices["content"][0];
  article: Articles | null;
  line_total_before_global_discount: number; // After the line discount
  line_global_discount: number; // Share of the global discount of the invoice
  line_total_ht: number; // Booked amount: after line and global discounts
  line_tva_amount: number;
  line_total_ttc: number;
  accounting: {
    number: string;
    name: string;
    standard: string;
    is_default: boolean;
  };
  vat_accounting: { number: string; name: string };
};

// Split an amount (in cents) proportionally to the weights, the last part takes
// the rounding remainder so the parts always sum exactly to the amount.
const split = (amount: number, weights: number[]): number[] => {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let remaining = amount;
  return weights.map((weight, index) => {
    const part =
      index === weights.length - 1
        ? remaining
        : total === 0
          ? 0
          : Math.round((amount * weight) / total);
    remaining -= part;
    return part;
  });
};

/**
 * Amounts and accounts of each line of an invoice for the accounting export.
 * The global discount is spread over the lines (proportionally, per VAT rate),
 * and the VAT of each rate is spread over its lines, so that the lines always
 * sum exactly to the totals of the invoice (as computed on the document).
 */
export const getAccountingExportLinesAmounts = (
  invoice: Pick<Invoices, "type" | "content" | "discount" | "total">,
  articlesMap: { [id: string]: Articles },
  accounting: Partial<ClientAccounting> | undefined | null,
): AccountingExportLineAmounts[] => {
  const side = invoice.type.startsWith("supplier") ? "buy" : "sell";

  const lines = (invoice.content || []).filter(
    (line) =>
      ["product", "service", "consumable", "correction"].includes(line.type) &&
      (!line.optional || line.optional_checked),
  );

  // Use the totals stored on the document, unless they predate the per VAT
  // rate breakdown of the global discount
  const hasGlobalDiscount = !!(
    invoice.discount?.mode && parseFloat(invoice.discount.value as any)
  );
  const totals =
    invoice.total?.vat_breakdown?.length &&
    (!hasGlobalDiscount || invoice.total?.allowances_breakdown?.length)
      ? invoice.total
      : computePricesFromInvoice(invoice);

  // Net amount of each line (after the line discount), same rounding as the document
  const netCents = lines.map((line) => {
    const price =
      (parseFloat(line.unit_price as any) || 0) *
      (parseFloat(line.quantity as any) || 0);
    let discount = 0;
    if (line.discount?.mode === "percentage") {
      discount = price * ((parseFloat(line.discount.value as any) || 0) / 100);
    } else if (line.discount?.mode === "amount") {
      discount = parseFloat(line.discount.value as any) || 0;
    }
    return toCents(price) - toCents(discount || 0);
  });

  const globalDiscountCents: number[] = lines.map(() => 0);
  const taxCents: number[] = lines.map(() => 0);

  const vats = [...new Set(lines.map((line) => line.tva || "O:VATEX-EU-O"))];
  for (const vat of vats) {
    const indexes = lines
      .map((line, index) => ((line.tva || "O:VATEX-EU-O") === vat ? index : -1))
      .filter((index) => index >= 0);

    const allowance = (totals?.allowances_breakdown || []).find(
      (a) => a.tva === vat,
    );
    split(
      hasGlobalDiscount ? toCents(allowance?.amount || 0) : 0,
      indexes.map((index) => netCents[index]),
    ).forEach((part, i) => (globalDiscountCents[indexes[i]] = part));

    const taxable = indexes.map(
      (index) => netCents[index] - globalDiscountCents[index],
    );
    const breakdown = (totals?.vat_breakdown || []).find((v) => v.tva === vat);
    const vatCents = breakdown
      ? toCents(breakdown.tax_amount)
      : toCents(
          (taxable.reduce((sum, t) => sum + t, 0) / 100) * getTvaValue(vat),
        );
    split(vatCents, taxable).forEach(
      (part, i) => (taxCents[indexes[i]] = part),
    );
  }

  return lines.map((line, index) => {
    const article = line.article ? articlesMap[line.article] || null : null;
    const account = getLineAccount(accounting, side, line, article);
    const vatAccount = taxCents[index]
      ? getVatAccount(accounting, side, line.tva || "")
      : null;
    const totalCents = netCents[index] - globalDiscountCents[index];

    return {
      line,
      article,
      line_total_before_global_discount: netCents[index] / 100,
      line_global_discount: globalDiscountCents[index] / 100,
      line_total_ht: totalCents / 100,
      line_tva_amount: taxCents[index] / 100,
      line_total_ttc: (totalCents + taxCents[index]) / 100,
      accounting: {
        number: account.standard_identifier,
        name: account.name,
        standard: account.standard,
        is_default: account.is_default,
      },
      vat_accounting: {
        number: vatAccount?.standard_identifier || "",
        name: vatAccount?.name || "",
      },
    };
  });
};
