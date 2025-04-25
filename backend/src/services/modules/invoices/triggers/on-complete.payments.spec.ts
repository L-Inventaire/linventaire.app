import { describe, test, expect } from "@jest/globals";
import { fillInvoicePayments } from "./on-complete";
import Invoices from "../entities/invoices";
import _ from "lodash";

describe("on-complete-payments", () => {
  test("simple-case", () => {
    const currentInvoice = {
      id: "a1",
      transactions: {} as Invoices["transactions"],
      reference: "FAC-2025-1",
      total: { total_with_taxes: 50 } as Invoices["total"],
    };
    fillInvoicePayments(currentInvoice, [], []);
    expect(currentInvoice.transactions.total).toBe(0);
    expect(currentInvoice.transactions.percentage).toBe(0);
    expect(currentInvoice.transactions.ids?.length).toBe(0);

    const allPayments = [
      {
        id: "p1",
        rel_invoices: ["a1"],
        amount: 50,
        transaction_date: new Date(1),
      },
      {
        // Unrelated payment
        id: "p2",
        rel_invoices: ["b1"],
        amount: 50,
        transaction_date: new Date(2),
      },
    ];
    fillInvoicePayments(currentInvoice, [], allPayments);
    expect(currentInvoice.transactions.total).toBe(50);
    expect(currentInvoice.transactions.percentage).toBe(100);
    expect(currentInvoice.transactions.ids?.length).toBe(1);
  });

  test("two-payments-one-invoice", () => {
    const currentInvoice = {
      id: "a1",
      transactions: {} as Invoices["transactions"],
      reference: "FAC-2025-1",
      total: { total_with_taxes: 50 } as Invoices["total"],
    };
    const allPayments = [
      {
        id: "p1",
        rel_invoices: ["a1"],
        amount: 20,
        transaction_date: new Date(1),
      },
      {
        id: "p2",
        rel_invoices: ["a1"],
        amount: 30,
        transaction_date: new Date(2),
      },
    ];
    fillInvoicePayments(currentInvoice, [], allPayments);
    expect(currentInvoice.transactions.total).toBe(50);
    expect(currentInvoice.transactions.percentage).toBe(100);
    expect(currentInvoice.transactions.ids?.length).toBe(2);
  });

  test("one-payment-two-invoices", () => {
    const invoice1 = {
      id: "a1",
      transactions: {} as Invoices["transactions"],
      reference: "FAC-2025-1",
      total: { total_with_taxes: 50 } as Invoices["total"],
    };
    const invoice2 = {
      id: "a2",
      transactions: {} as Invoices["transactions"],
      reference: "FAC-2025-2",
      total: { total_with_taxes: 75 } as Invoices["total"],
    };
    const allPayments = [
      {
        id: "p1",
        rel_invoices: ["a1", "a2"],
        amount: 125,
        transaction_date: new Date(1),
      },
    ];
    const res1 = fillInvoicePayments(
      _.cloneDeep(invoice1),
      [_.cloneDeep(invoice2)],
      _.cloneDeep(allPayments)
    );
    const res2 = fillInvoicePayments(
      _.cloneDeep(invoice2),
      [_.cloneDeep(invoice1)],
      _.cloneDeep(allPayments)
    );
    console.log("2-1", res1.transactions);
    console.log("2-1", res2.transactions);
    expect(res1.transactions.total).toBe(50);
    expect(res1.transactions.percentage).toBe(100);
    expect(res1.transactions.ids?.length).toBe(1);
    expect(res2.transactions.total).toBe(75);
    expect(res2.transactions.percentage).toBe(100);
    expect(res2.transactions.ids?.length).toBe(1);
  });

  test("one-payment-two-invoices-partial", () => {
    const invoice1 = {
      id: "a1",
      transactions: {} as Invoices["transactions"],
      reference: "FAC-2025-1",
      total: { total_with_taxes: 50 } as Invoices["total"],
    };
    const invoice2 = {
      id: "a2",
      transactions: {} as Invoices["transactions"],
      reference: "FAC-2025-2",
      total: { total_with_taxes: 100 } as Invoices["total"],
    };
    const allPayments = [
      {
        id: "p1",
        rel_invoices: ["a1", "a2"],
        amount: 100,
        transaction_date: new Date(1),
      },
    ];
    const res1 = fillInvoicePayments(
      _.cloneDeep(invoice1),
      [_.cloneDeep(invoice2)],
      _.cloneDeep(allPayments)
    );
    const res2 = fillInvoicePayments(
      _.cloneDeep(invoice2),
      [_.cloneDeep(invoice1)],
      _.cloneDeep(allPayments)
    );
    console.log("2-1 partial", res1.transactions);
    console.log("2-1 partial", res2.transactions);
    expect(res1.transactions.total).toBe(50);
    expect(res1.transactions.percentage).toBe(100);
    expect(res1.transactions.ids?.length).toBe(1);
    expect(res2.transactions.total).toBe(50);
    expect(res2.transactions.percentage).toBe(50);
    expect(res2.transactions.ids?.length).toBe(1);
  });

  test("multiple-payments-multiple-invoices-partial", () => {
    const allInvoices = [
      {
        id: "a1",
        transactions: {} as Invoices["transactions"],
        reference: "FAC-2025-1",
        total: { total_with_taxes: 50 } as Invoices["total"],
      },
      {
        id: "a2",
        transactions: {} as Invoices["transactions"],
        reference: "FAC-2025-2",
        total: { total_with_taxes: 75 } as Invoices["total"],
      },
      {
        id: "a3",
        transactions: {} as Invoices["transactions"],
        reference: "FAC-2025-3",
        total: { total_with_taxes: 100 } as Invoices["total"],
      },
    ];
    const allPayments = [
      {
        id: "p1",
        rel_invoices: ["a1", "a2", "a3"],
        amount: 100,
        transaction_date: new Date(1),
      },
      {
        id: "p2",
        rel_invoices: ["a2", "a3"],
        amount: 50,
        transaction_date: new Date(2),
      },
    ];

    let res = fillInvoicePayments(
      _.cloneDeep(allInvoices[0]),
      _.cloneDeep(allInvoices),
      _.cloneDeep(allPayments)
    );
    console.log("test0", res.transactions);
    expect(res.transactions.total).toBe(50);
    expect(res.transactions.percentage).toBe(100);
    expect(res.transactions.ids?.length).toBe(1);

    res = fillInvoicePayments(
      _.cloneDeep(allInvoices[1]),
      _.cloneDeep(allInvoices),
      _.cloneDeep(allPayments)
    );
    console.log("test1", res.transactions);
    expect(res.transactions.total).toBe(75);
    expect(res.transactions.percentage).toBe(100);
    expect(res.transactions.ids?.length).toBe(2);

    res = fillInvoicePayments(
      _.cloneDeep(allInvoices[2]),
      _.cloneDeep(allInvoices),
      _.cloneDeep(allPayments)
    );
    console.log("test2", res.transactions);
    expect(res.transactions.total).toBe(25);
    expect(res.transactions.percentage).toBe(25);
    expect(res.transactions.ids?.length).toBe(2);
  });

  test("multiple-payments-multiple-invoices-partial-wrong-order", () => {
    const allInvoices = [
      {
        id: "a1",
        transactions: {} as Invoices["transactions"],
        reference: "FAC-2025-1",
        total: { total_with_taxes: 50 } as Invoices["total"],
      },
      {
        id: "a2",
        transactions: {} as Invoices["transactions"],
        reference: "FAC-2025-2",
        total: { total_with_taxes: 75 } as Invoices["total"],
      },
      {
        id: "a3",
        transactions: {} as Invoices["transactions"],
        reference: "FAC-2025-3",
        total: { total_with_taxes: 100 } as Invoices["total"],
      },
    ];
    const allPayments = [
      {
        id: "p1",
        rel_invoices: ["a1", "a2", "a3"],
        amount: 100,
        transaction_date: new Date(1),
      },
      {
        id: "p2",
        rel_invoices: ["a1", "a2"], // Wrong order happens here, at this time invoices a1 and a2 are full, so it doesn't make sense to register an operation for them
        amount: 50,
        transaction_date: new Date(2),
      },
    ];

    // Here one of the invoices must be overfull (it'll be the first one each time)

    let res = fillInvoicePayments(
      _.cloneDeep(allInvoices[0]),
      _.cloneDeep(allInvoices),
      _.cloneDeep(allPayments)
    );
    console.log("test0", res.transactions);
    expect(res.transactions.total).toBe(75);
    expect(res.transactions.percentage).toBe(150);
    expect(res.transactions.ids?.length).toBe(2);

    res = fillInvoicePayments(
      _.cloneDeep(allInvoices[1]),
      _.cloneDeep(allInvoices),
      _.cloneDeep(allPayments)
    );
    console.log("test1", res.transactions);
    expect(res.transactions.total).toBe(75);
    expect(res.transactions.percentage).toBe(100);
    expect(res.transactions.ids?.length).toBe(2);

    res = fillInvoicePayments(
      _.cloneDeep(allInvoices[2]),
      _.cloneDeep(allInvoices),
      _.cloneDeep(allPayments)
    );
    console.log("test2", res.transactions);
    expect(res.transactions.total).toBe(0);
    expect(res.transactions.percentage).toBe(0);
    expect(res.transactions.ids?.length).toBe(1);
  });
});
