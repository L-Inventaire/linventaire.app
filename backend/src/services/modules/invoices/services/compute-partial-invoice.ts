import _ from "lodash";
import Invoices, { InvoiceDiscount, InvoiceLine } from "../entities/invoices";
import { computePricesFromInvoice } from "../utils";

type PartialInvoiceOutType = {
  invoiced: Pick<Invoices, "content" | "discount" | "total">;
  partial_invoice: Pick<Invoices, "content" | "discount" | "type" | "total">;
  remaining: Pick<Invoices, "content" | "discount" | "total">;
  remaining_credit_note?: Pick<Invoices, "content" | "total" | "type">;
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
  // If amount is less than 0 then we'll fill the credit_notes output
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

  const remainingInvoiceItems = diffContent(
    quoteRemainingItems,
    thisPartialInvoiceItems
  );
  const remainingInvoiceAmount = computePricesFromInvoice({
    content: remainingInvoiceItems as Invoices["content"],
    discount: {
      mode: "amount",
      value: 0,
    },
  });

  console.log("alreadyInvoicedAmount", alreadyInvoicedAmount);
  console.log("quoteRemainingAmount", quoteRemainingAmount);
  console.log("thisPartialInvoiceItems", thisPartialInvoiceItems);
  console.log(
    "computePricesFromInvoice(quote)",
    computePricesFromInvoice(quote)
  );
  console.log("thisPartialInvoiceAmount", thisPartialInvoiceAmount);
  console.log("remainingInvoiceAmount", remainingInvoiceAmount);

  // All is computed, we only have to fix the amounts and/or create credit_notes if needed

  // Gap from quote
  const gapFromQuote =
    quoteRemainingAmount.total_with_taxes -
    (remainingInvoiceAmount.total_with_taxes +
      thisPartialInvoiceAmount.total_with_taxes);
  const isFinalInvoice = remainingInvoiceItems.length === 0;
  let remainingCreditNoteValue = 0;

  console.log("gapFromQuote", gapFromQuote);
  console.log("isFinalInvoice", isFinalInvoice);

  if (gapFromQuote !== 0) {
    if (gapFromQuote > 0) {
      console.log("Gap from quote is positive:", gapFromQuote);
      // Meaning we need to pay more than expected
      // isFinalInvoice=true then we put everything to the partial invoice, else we put it to the remaining invoice
      if (isFinalInvoice) {
        thisPartialInvoiceItems.push({
          type: "correction",
          article: "correction_final_invoice",
          name: "Correction du solde",
          quantity: 1,
          unit_price: gapFromQuote - thisPartialInvoiceDiscount.value,
          discount: { mode: "amount", value: 0 },
        });
        thisPartialInvoiceDiscount.value = 0;
      } else {
        remainingInvoiceItems.push({
          type: "correction",
          article: "correction_final_invoice",
          name: "Correction du solde",
          quantity: 1,
          unit_price: gapFromQuote - remainingInvoiceAmount.discount,
          discount: { mode: "amount", value: 0 },
        });
        remainingInvoiceAmount.discount = 0;
      }
    } else {
      const stillToPay =
        thisPartialInvoiceAmount.total_with_taxes +
        remainingInvoiceAmount.total_with_taxes;
      console.log(
        "Gap from quote is negative:",
        gapFromQuote,
        "stillToPay in invoices:",
        stillToPay
      );
      if (!isFinalInvoice) {
        if (remainingInvoiceAmount.total_with_taxes > -gapFromQuote) {
          //No need for a credit note
          remainingInvoiceItems.push({
            type: "correction",
            article: "correction_remaining_only",
            name: "Correction du solde",
            quantity: 1,
            unit_price: gapFromQuote - remainingInvoiceAmount.discount,
            discount: { mode: "amount", value: 0 },
          });
          remainingInvoiceAmount.discount = 0;
        } else {
          // Needs a credit note
          remainingInvoiceItems.push({
            type: "correction",
            article: "correction_remaining_only",
            name: "Correction du solde",
            quantity: 1,
            unit_price: -(
              remainingInvoiceAmount.total_with_taxes -
              remainingInvoiceAmount.discount
            ),
            discount: { mode: "amount", value: 0 },
          });
          remainingInvoiceAmount.discount = 0;

          remainingCreditNoteValue = -gapFromQuote - stillToPay;
        }
      } else {
        // Cases: if it is more than what we can invoice to the current or remaining invoice, then a credit note will be created
        if (stillToPay > -gapFromQuote) {
          // In this case we'll just edit the next invoices as much as we can
          const coveredByThisInvoice = Math.min(
            -gapFromQuote,
            thisPartialInvoiceAmount.total_with_taxes
          );
          thisPartialInvoiceItems.push({
            type: "correction",
            article: "correction",
            name: "Correction du solde",
            quantity: 1,
            unit_price:
              -coveredByThisInvoice - thisPartialInvoiceDiscount.value,
            discount: { mode: "amount", value: 0 },
          });
          thisPartialInvoiceDiscount.value = 0;
          if (coveredByThisInvoice < -gapFromQuote) {
            remainingInvoiceItems.push({
              type: "correction",
              article: "correction",
              name: "Correction du solde",
              quantity: 1,
              unit_price:
                gapFromQuote +
                coveredByThisInvoice -
                remainingInvoiceAmount.discount,
              discount: { mode: "amount", value: 0 },
            });
            remainingInvoiceAmount.discount = 0;
          }
        } else {
          // In this case we'll have to create a credit note after setting every remaining invoices to 0
          thisPartialInvoiceItems.push({
            type: "correction",
            article: "correction_credit_note",
            name: "Correction du solde",
            quantity: 1,
            unit_price:
              -thisPartialInvoiceAmount.total_with_taxes -
              thisPartialInvoiceDiscount.value,
            discount: { mode: "amount", value: 0 },
          });
          thisPartialInvoiceDiscount.value = 0;
          remainingInvoiceItems.push({
            type: "correction",
            article: "correction_credit_note",
            name: "Correction du solde",
            quantity: 1,
            unit_price:
              -remainingInvoiceAmount.total_with_taxes -
              remainingInvoiceAmount.discount,
            discount: { mode: "amount", value: 0 },
          });
          remainingInvoiceAmount.discount = 0;
          remainingCreditNoteValue = -gapFromQuote - stillToPay;
        }
      }
    }
  }

  const remainingCreditNote: Invoices =
    remainingCreditNoteValue > 0
      ? ({
          type: creditNotesType,
          content: [
            {
              type: "correction",
              article: "correction_credit_note",
              name: "Correction du solde",
              quantity: 1,
              unit_price: remainingCreditNoteValue,
              discount: { mode: "amount", value: 0 },
            } as InvoiceLine,
          ],
        } as Invoices)
      : undefined;
  if (remainingCreditNote)
    remainingCreditNote.total = computePricesFromInvoice(remainingCreditNote);

  console.log("Next partial invoice items:", remainingInvoiceItems);
  console.log("Next partial invoice amount:", remainingInvoiceAmount);
  console.log("quoteRemainingItems:", remainingInvoiceItems.length);

  return {
    invoiced: {
      content: alreadyInvoiced as Invoices["content"],
      discount: {
        mode: "amount",
        value: alreadyInvoicedAmount.discount,
      } as InvoiceDiscount,
      total: computePricesFromInvoice({
        content: alreadyInvoiced as Invoices["content"],
        discount: {
          mode: "amount",
          value: alreadyInvoicedAmount.discount,
        },
      }),
    } as Invoices,
    partial_invoice: {
      type: invoicesType,
      content: thisPartialInvoiceItems as Invoices["content"],
      discount: {
        mode: "amount",
        value: thisPartialInvoiceDiscount.value,
      } as InvoiceDiscount,
      total: computePricesFromInvoice({
        content: thisPartialInvoiceItems as Invoices["content"],
        discount: thisPartialInvoiceDiscount,
      }),
    } as Invoices,
    remaining: {
      content: remainingInvoiceItems as Invoices["content"],
      discount: {
        mode: "amount",
        value: remainingInvoiceAmount.discount,
      } as InvoiceDiscount,
      total: computePricesFromInvoice({
        content: remainingInvoiceItems as Invoices["content"],
        discount: {
          mode: "amount",
          value: remainingInvoiceAmount.discount,
        },
      }),
    } as Invoices,
    remaining_credit_note: remainingCreditNote,
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
