import { createContext } from "#src/types";
import { describe, expect, test } from "@jest/globals";
import StockItems from "../../stock/entities/stock-items";
import Invoices, { InvoiceLine } from "../entities/invoices";
import { recomputeCompletionStatus } from "./on-complete";

describe("on-complete-payments", () => {
  test("simple-case", async () => {
    const currentInvoice = {
      id: "a1",
      type: "quotes",
      content: [
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
      ] as unknown as InvoiceLine[],
    } as Invoices;
    const res = await recomputeCompletionStatus(createContext(), "", "", {
      item: currentInvoice,
      articles: {
        art1: [
          { article: "art1", state: "stock", quantity: 1 },
        ] as StockItems[],
      },
      services: {},
      dryRun: true,
    });
    console.log(res);
    expect(res.content[0].quantity_ready).toBe(1);
    expect(res.content[0].quantity_delivered).toBe(0);
  });

  test("partial-case", async () => {
    const currentInvoice = {
      id: "a1",
      type: "quotes",
      content: [
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
      ] as unknown as InvoiceLine[],
    } as Invoices;
    const res = await recomputeCompletionStatus(createContext(), "", "", {
      item: currentInvoice,
      articles: {
        art1: [
          { article: "art1", state: "stock", quantity: 1 },
        ] as StockItems[],
      },
      services: {},
      dryRun: true,
    });
    console.log(res);
    expect(res.content[0].quantity_ready).toBe(1);
    expect(res.content[0].quantity_delivered).toBe(0);
    expect(res.content[1].quantity_ready).toBe(0);
  });

  test("delivered-case", async () => {
    const currentInvoice = {
      id: "a1",
      type: "quotes",
      content: [
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
      ] as unknown as InvoiceLine[],
    } as Invoices;
    const res = await recomputeCompletionStatus(createContext(), "", "", {
      item: currentInvoice,
      articles: {
        art1: [
          { article: "art1", state: "stock", quantity: 1 },
          { article: "art1", state: "delivered", quantity: 1 },
        ] as StockItems[],
      },
      services: {},
      dryRun: true,
    });
    console.log(res);
    expect(res.content[0].quantity_ready).toBe(1);
    expect(res.content[0].quantity_delivered).toBe(0);
    expect(res.content[1].quantity_ready).toBe(1);
    expect(res.content[1].quantity_delivered).toBe(1);
  });

  test("repartition-case", async () => {
    const currentInvoice = {
      id: "a1",
      type: "quotes",
      content: [
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
      ] as unknown as InvoiceLine[],
    } as Invoices;
    const res = await recomputeCompletionStatus(createContext(), "", "", {
      item: currentInvoice,
      articles: {
        art1: [
          { id: "1", article: "art1", state: "stock", quantity: 1 },
          { id: "2", article: "art1", state: "stock", quantity: 1 },
          { id: "3", article: "art1", state: "stock", quantity: 1 },
        ] as StockItems[],
      },
      services: {},
      dryRun: true,
    });
    console.log(res);
    expect(res.content[0].quantity_ready).toBe(1);
    expect(res.content[1].quantity_ready).toBe(1);
    expect(res.content[2].quantity_ready).toBe(1);
  });

  test("repartition-case-2", async () => {
    const currentInvoice = {
      id: "a1",
      type: "quotes",
      content: [
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
      ] as unknown as InvoiceLine[],
    } as Invoices;
    const res = await recomputeCompletionStatus(createContext(), "", "", {
      item: currentInvoice,
      articles: {
        art1: [
          { id: "1", article: "art1", state: "stock", quantity: 3 },
        ] as StockItems[],
      },
      services: {},
      dryRun: true,
    });
    console.log(res);
    expect(res.content[0].quantity_ready).toBe(1);
    expect(res.content[1].quantity_ready).toBe(1);
    expect(res.content[2].quantity_ready).toBe(1);
  });

  test("repartition-case-3", async () => {
    const currentInvoice = {
      id: "a1",
      type: "quotes",
      content: [
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
        {
          article: "art1",
          type: "product",
          quantity: 1,
          quantity_ready: 0,
          quantity_delivered: 0,
        },
      ] as unknown as InvoiceLine[],
    } as Invoices;
    const res = await recomputeCompletionStatus(createContext(), "", "", {
      item: currentInvoice,
      articles: {
        art1: [
          { id: "1", article: "art1", state: "stock", quantity: 5 },
        ] as StockItems[],
      },
      services: {},
      dryRun: true,
    });
    console.log(res);
    expect(res.content[0].quantity_ready).toBe(2);
    expect(res.content[1].quantity_ready).toBe(2);
    expect(res.content[2].quantity_ready).toBe(1);
  });
});
