import _ from "lodash";
import Invoices, { InvoiceDiscount, InvoiceLine } from "../entities/invoices";
import { computePricesFromInvoice } from "../utils";

type PartialInvoiceOutType = {
  invoiced: Pick<Invoices, "content" | "discount" | "total">;
  partial_invoice: Pick<Invoices, "content" | "discount" | "type" | "total">;
  remaining: Pick<Invoices, "content" | "discount" | "total">;
};

export const computePartialInvoice = (
  quote: Pick<Invoices, "content" | "discount" | "type">,
  invoicesAndCreditNotes: Pick<
    Invoices,
    "content" | "type" | "discount" | "state"
  >[],
  requestedItems: Partial<InvoiceLine>[] = []
): PartialInvoiceOutType => {
  // This function must takes existing invoices, and credit notes,
  // and try to generate the correct partial invoice
  // It must includes computation for:
  // - invoiced items with potential discounts and partial quantities
  // - discounts
  // - potentially abnormal invoices not fully matching the quote but still related to the quote
  // - keep track of escomptes and acomptes
  // If amount is less than 0 we'll generate a credit note instead of an invoice
  // If all is already invoiced we return an empty object

  // Here's the steps:
  // 1. Check all invoiced items
  // 2. Remove credit notes items
  // 3. From the remaining still active invoiced items, match them with the quote
  // 4. Remove from the quote the invoiced items
  // --
  // 5. Compute the total amount in the credit notes
  // 6. Compute the total amount in the invoices
  // 7. If we have zero items remaining for next invoice, we apply an additional discount or special invoice to match the quote total

  const invoicesType =
    quote.type === "quotes" ? "invoices" : "supplier_invoices";
  const creditNotesType =
    quote.type === "quotes" ? "credit_notes" : "supplier_credit_notes";

  // 1. Check all invoiced items
  const alreadyInvoicedWoCreditNotes: Invoices["content"] =
    invoicesAndCreditNotes
      .filter((a) => a.type === invoicesType)
      .reduce((acc, i) => [...acc, ...(i.content || [])], []);
  const alreadyInvoicedWoCreditNotesAmount: Invoices["total"] =
    invoicesAndCreditNotes
      .filter((a) => a.type === invoicesType)
      .reduce(
        (acc, i) => sumTotals(acc, computePricesFromInvoice(i)),
        {}
      ) as Invoices["total"];

  // 2. Remove credit notes items
  const creditNotes = invoicesAndCreditNotes
    .filter((a) => a.type === creditNotesType)
    .reduce((acc, i) => [...acc, ...(i.content || [])], []);
  const creditNotesAmount = invoicesAndCreditNotes
    .filter((a) => a.type === creditNotesType)
    .reduce(
      (acc, i) => sumTotals(acc, computePricesFromInvoice(i)),
      {}
    ) as Invoices["total"];

  const alreadyInvoiced = diffContent(
    alreadyInvoicedWoCreditNotes,
    creditNotes
  );
  const alreadyInvoicedAmount = sumTotals(
    alreadyInvoicedWoCreditNotesAmount,
    creditNotesAmount,
    -1
  );

  // 3. From the remaining still active invoiced items, match them with the quote
  // 4. Remove from the quote the invoiced items
  const quoteRemainingItems = diffContent(quote.content, alreadyInvoiced);
  const quoteRemainingAmount = sumTotals(
    computePricesFromInvoice(quote),
    alreadyInvoicedAmount,
    -1
  );

  if (requestedItems.length === 0) {
    requestedItems = quoteRemainingItems;
  }

  // Complete requestedItems if needed
  requestedItems = requestedItems.map((a) => ({
    ...a,
    unit_price: parseFloat(
      (a.unit_price ||
        quote.content.find((b) => b.article === a.article)?.unit_price ||
        0) as any
    ),
  }));

  let thisPartialInvoiceItems = requestedItems;
  const thisPartialInvoiceDiscount: InvoiceDiscount =
    quote?.discount?.mode === "amount"
      ? {
          mode: "amount",
          value:
            (quoteRemainingAmount.discount *
              requestedItems.reduce((acc, i) => acc + i.quantity, 0)) /
            quoteRemainingItems.reduce((acc, i) => acc + i.quantity, 0),
        }
      : {
          mode: "amount",
          value:
            ((quote?.discount?.value || 0) / 100) *
            computePricesFromInvoice({
              content: requestedItems as Invoices["content"],
              discount: { mode: "amount", value: 0 },
            }).total,
        };
  const thisPartialInvoiceAmount = computePricesFromInvoice({
    content: thisPartialInvoiceItems as Invoices["content"],
    discount: thisPartialInvoiceDiscount,
  });

  const nextPartialInvoiceItems = diffContent(
    quoteRemainingItems,
    thisPartialInvoiceItems
  );
  const nextPartialInvoiceAmount = sumTotals(
    quoteRemainingAmount,
    thisPartialInvoiceAmount,
    -1
  ) as Invoices["total"];

  let thisPartialInvoiceType: Invoices["type"] = invoicesType;

  if (
    nextPartialInvoiceItems.length === 0 &&
    nextPartialInvoiceAmount.total !== 0
  ) {
    // If we invoiced too much according to invoice then we'll apply a discount automatically (if possible)
    if (nextPartialInvoiceAmount.total < 0) {
      if (-nextPartialInvoiceAmount.total <= thisPartialInvoiceAmount.total) {
        thisPartialInvoiceDiscount.value += -nextPartialInvoiceAmount.total;
      } else {
        // If not possible, then we must create a credit note somehow
        thisPartialInvoiceType = creditNotesType;
        // Remove all articles and just add a correction line
        thisPartialInvoiceItems = [
          {
            type: "correction",
            article: "correction",
            quantity: 1,
            unit_price: -nextPartialInvoiceAmount.total,
            discount: { mode: "amount", value: 0 },
          },
        ];
        thisPartialInvoiceDiscount.value = 0;
      }
    } else {
      // We'll add a product line to fix the issue
      thisPartialInvoiceItems.push({
        type: "correction",
        article: "correction",
        quantity: 1,
        unit_price:
          computePricesFromInvoice(quote).total -
          alreadyInvoicedAmount.total -
          thisPartialInvoiceAmount.total_with_taxes,
        discount: { mode: "amount", value: 0 },
      });
    }
    nextPartialInvoiceAmount.discount = 0;
  }

  const nextPartialInvoiceContentTotal = computePricesFromInvoice({
    content: nextPartialInvoiceItems as Invoices["content"],
    discount: {
      mode: "amount",
      value: nextPartialInvoiceAmount.discount,
    } as InvoiceDiscount,
  } as Invoices);

  console.log("Next partial invoice items:", nextPartialInvoiceItems);
  console.log("Next partial invoice amount:", nextPartialInvoiceAmount);
  console.log(
    "Next partial invoice content total:",
    nextPartialInvoiceContentTotal
  );
  console.log("quoteRemainingItems:", nextPartialInvoiceItems.length);

  if (
    nextPartialInvoiceAmount.total_with_taxes !==
    nextPartialInvoiceContentTotal.total_with_taxes
  ) {
    // If the next partial invoice amount does not match the computed amount, we need to adjust it by adding a correction line
    const correctionAmount =
      nextPartialInvoiceAmount.total_with_taxes -
      nextPartialInvoiceContentTotal.total_with_taxes;

    if (nextPartialInvoiceItems.length === 0) {
      console.log(
        "Is final invoice, adding correction line diff amount:",
        correctionAmount
      );
      thisPartialInvoiceItems.push({
        type: "correction",
        article: "correction",
        name:
          correctionAmount > 0 ? "Correction du solde" : "Acomptes prélevés",
        quantity: 1,
        unit_price: correctionAmount,
        discount: { mode: "amount", value: 0 },
      });
      thisPartialInvoiceAmount.discount = 0;
      thisPartialInvoiceDiscount.value = 0;
    } else {
      nextPartialInvoiceItems.push({
        type: "correction",
        article: "correction",
        name: "Correction du solde",
        quantity: 1,
        unit_price: correctionAmount,
        discount: { mode: "amount", value: 0 },
      });
      nextPartialInvoiceAmount.discount = 0;
    }
  }

  const tmp = {
    invoiced: {
      content: alreadyInvoiced as Invoices["content"],
      discount: {
        mode: "amount",
        value: alreadyInvoicedAmount.discount,
      } as InvoiceDiscount,
    },
    partial_invoice: {
      type: thisPartialInvoiceType,
      content: thisPartialInvoiceItems as Invoices["content"],
      discount: {
        mode: "amount",
        value: thisPartialInvoiceDiscount.value,
      } as InvoiceDiscount,
    },
    remaining: {
      content: nextPartialInvoiceItems as Invoices["content"],
      discount: {
        mode: "amount",
        value: nextPartialInvoiceAmount.discount,
      } as InvoiceDiscount,
    },
  };

  return {
    invoiced: {
      ...tmp.invoiced,
      total: computePricesFromInvoice(tmp.invoiced),
    },
    partial_invoice: {
      ...tmp.partial_invoice,
      total: computePricesFromInvoice(tmp.partial_invoice),
    },
    remaining: {
      ...tmp.remaining,
      total: computePricesFromInvoice(tmp.remaining),
    },
  };
};

const sumTotals = (
  a: Partial<Invoices["total"]>,
  b: Partial<Invoices["total"]>,
  factor = 1
) => {
  const newTotal = {};
  b = _.cloneDeep(b);

  // Diff mode
  if (factor !== 1) {
    for (const key of Object.keys(b)) {
      b[key] = (b[key] || 0) * factor;
    }
  }

  for (const key of Object.keys(a)) {
    newTotal[key] = (a[key] || 0) + (b[key] || 0);
  }

  return {
    ...b,
    ...newTotal,
  } as Partial<Invoices["total"]>;
};

const diffContent = (
  list: Partial<InvoiceLine>[],
  toRemove: Partial<InvoiceLine>[]
): Partial<InvoiceLine>[] => {
  list = _.cloneDeep(list).filter(
    (a) => a.quantity > 0 && a.type !== "separation" && a.article
  );
  toRemove = _.cloneDeep(toRemove).filter(
    (a) => a.quantity > 0 && a.type !== "separation" && a.article
  );

  for (const matchPricing of [true, false]) {
    // The first pass we match the pricing
    // Then we complete however we can
    for (const toRem of toRemove) {
      toRem.quantity = toRem.quantity || 0;
      toRem.article = toRem.article || "";
      toRem.unit_price = toRem.unit_price || 0;
      toRem.discount = toRem.discount || { mode: "amount", value: 0 };

      const cond = (a: Invoices["content"][0]) =>
        a.article === toRem.article &&
        a.quantity > 0 &&
        (!matchPricing || (a.unit_price || 0) === toRem.unit_price);

      while (list.some(cond) && toRem.quantity > 0) {
        const line = list.find(cond);
        line.quantity = line.quantity || 0;
        if (line) {
          const movement = Math.min(line.quantity || 0, toRem.quantity || 0);
          line.quantity -= movement;
          toRem.quantity -= movement;

          // Apply discount at pro rata
          if (line.discount?.mode === "amount") {
            line.discount.value -=
              (movement * (line.discount?.value || 0)) / line.quantity;
            line.discount.value = Math.max(0, line.discount.value);
          }
        }
      }
    }
  }

  return list.filter((a) => a.quantity > 0);
};
