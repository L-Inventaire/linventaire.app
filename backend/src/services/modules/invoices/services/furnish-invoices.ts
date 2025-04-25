import Framework from "#src/platform/index";
import { Context } from "#src/types";
import _, { max, min } from "lodash";
import Articles, {
  ArticlesDefinition,
  SuppliersDetails,
} from "../../articles/entities/articles";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import StockItems, {
  StockItemsDefinition,
} from "../../stock/entities/stock-items";
import Invoices, {
  InvoiceLine,
  InvoicesDefinition,
} from "../entities/invoices";
import { search } from "#src/services/rest/services/rest";
import { buildQueryFromMap } from "#src/services/rest/services/utils";

export type FurnishInvoicesProps = {
  overrideFurnishes?: FurnishInvoiceFurnish[];
  quotes: Invoices[];
};

export type FurnishInvoicesResult = {
  actions: FurnishInvoiceAction[];
  furnishes: FurnishInvoiceFurnish[];
  articles: {
    id: string;
    remainingQuantity: number;
    totalToFurnish: number;
    alreadyFurnishedQuantity: number;
  }[];
};

export type FurnishInvoiceAction = {
  ref: string;
  action: "withdraw-stock" | "order-items";
  quote: Invoices;

  supplier?: Contacts;
  stockItem?: StockItems;
  furnishes: FurnishInvoiceFurnish[];
  content?: InvoiceLine[];
  quantity?: number;
};

export type FurnishInvoiceFurnish = {
  ref: string;
  invoiceLines?: InvoiceLine[];
  maxAvailable?: number;
  quantity: number;
  totalToFurnish: number;
  articleID: string;

  supplierID?: string;
  stockID?: string;
};

export const calcValuesToFurnishInvoice = (
  article: Articles,
  invoiceLines: InvoiceLine[],
  furnishes: FurnishInvoiceFurnish[],
  supplierQuotesAlreadySent: Invoices[] = [],
  stockItems: StockItems[] = []
) => {
  const articleInvoiceLines = invoiceLines.filter(
    (line) => line.article === article.id
  );
  const articleFurnishes = furnishes.filter(
    (furnish) => furnish.articleID === article.id
  );
  const articleStockItems = stockItems.filter(
    (item) => item.article === article.id
  );

  const totalOrdered = supplierQuotesAlreadySent
    .map(
      (quote) =>
        quote.content
          .filter((line) => line.article === article.id)
          .reduce((acc, line) => acc + line.quantity, 0) ?? 0
    )
    .reduce((acc, quantity) => acc + quantity, 0);

  const totalReserved = articleStockItems
    .map((item) => item.quantity)
    .reduce((acc, q) => acc + q, 0);

  const totalToFurnish = max([
    articleInvoiceLines.reduce((acc, line) => acc + line.quantity, 0) -
      (articleInvoiceLines.reduce(
        (acc, line) => acc + (line?.quantity_ready ?? 0),
        0
      ) ?? 0) -
      totalOrdered -
      totalReserved,
    0,
  ]);

  const alreadyFurnishedQuantity = articleFurnishes.reduce(
    (acc, furnish) => acc + furnish.quantity,
    0
  );
  const remainingQuantity = totalToFurnish - alreadyFurnishedQuantity;

  return {
    remainingQuantity,
    totalToFurnish,
    alreadyFurnishedQuantity,
  };
};

export const furnishInvoices = async (
  ctx: Context,
  { quotes, overrideFurnishes }: FurnishInvoicesProps
): Promise<FurnishInvoicesResult> => {
  const db = await Framework.Db.getService();

  const invoiceLines = quotes.flatMap((invoice) => invoice.content);
  const articleIDs = _.uniq(invoiceLines.flatMap((line) => line.article));

  const articles = (
    await db.select<Articles>(ctx, ArticlesDefinition.name, {
      id: articleIDs,
    })
  ).filter((article) => article.type !== "service");

  const stockItems = (
    await db.select<StockItems>(ctx, StockItemsDefinition.name, {
      article: articleIDs,
      for_rel_quote: quotes.map((quote) => quote.id),
    })
  ).filter((item) => item.state !== "depleted");

  const supplierIDs = _.uniq(articles.flatMap((article) => article.suppliers));
  const suppliers = await db.select<Contacts>(ctx, ContactsDefinition.name, {
    id: supplierIDs,
  });

  const linesToFurnish = invoiceLines.filter(
    (line) =>
      ((line.optional && line.optional_checked) || !line.optional) &&
      line.quantity > 0
  );
  let furnishes: FurnishInvoiceFurnish[] = [];

  let supplierQuotesAlreadySent: Invoices[] = [];

  for (const quote of quotes) {
    const relatedSupplierQuotes = (
      await search<Invoices>(
        ctx,
        InvoicesDefinition.name,
        buildQueryFromMap({
          from_rel_quote: quote.id,
          type: ["supplier_quotes"],
        })
      )
    )?.list;

    supplierQuotesAlreadySent = [
      ...supplierQuotesAlreadySent,
      ...relatedSupplierQuotes,
    ];
  }

  // Setup the available furnishes, to know what we can use to furnish the invoices
  for (const article of articles) {
    const invoiceLines = linesToFurnish.filter(
      (line) => line.article === article.id
    );

    for (const supplierID of article?.suppliers ?? []) {
      const supplier = suppliers.find((supplier) => supplier.id === supplierID);

      if (!supplier) continue;

      const { totalToFurnish } = calcValuesToFurnishInvoice(
        article,
        invoiceLines,
        furnishes,
        supplierQuotesAlreadySent,
        stockItems
      );

      furnishes.push({
        ref: article.id + "@supplier@" + supplier.id,
        supplierID: supplier.id,
        quantity: 0,
        totalToFurnish,
        articleID: article.id,
        invoiceLines,
      });
    }

    const articleStockItems = (
      await db.select<StockItems>(
        ctx,
        StockItemsDefinition.name,
        {
          article: article.id,
          state: "stock",
          for_rel_quote: "",
        },
        { limit: 1000 }
      )
    ).filter((item) => item.quantity > 0);

    for (const stockItem of articleStockItems) {
      const { totalToFurnish } = calcValuesToFurnishInvoice(
        article,
        invoiceLines,
        furnishes,
        supplierQuotesAlreadySent,
        stockItems
      );

      furnishes.push({
        ref: article.id + "@stock@" + stockItem.id,
        quantity: 0,
        totalToFurnish,
        maxAvailable: stockItem.quantity,
        articleID: article.id,
        invoiceLines,
        stockID: stockItem.id,
      });
    }
  }

  // Override the available furnishes with the ones provided by the user
  furnishes = furnishes.map((furnish) => {
    const override = (overrideFurnishes ?? []).find(
      (f) => f.ref === furnish.ref
    );
    if (override) return override;

    return furnish;
  });

  // Correct the furnish values, in case the User provided the wrong ones
  furnishes = furnishes.map((furnish) => {
    const articleInvoiceLines = invoiceLines.filter(
      (line) => line.article === furnish.articleID
    );

    const { totalToFurnish } = calcValuesToFurnishInvoice(
      articles.find((article) => article.id === furnish.articleID),
      articleInvoiceLines,
      furnishes,
      supplierQuotesAlreadySent,
      stockItems
    );

    return { ...furnish, totalToFurnish };
  });

  // Now we can juggle the values
  for (const article of articles) {
    const { remainingQuantity } = calcValuesToFurnishInvoice(
      article,
      invoiceLines,
      furnishes,
      supplierQuotesAlreadySent,
      stockItems
    );
    let remaining = remainingQuantity;
    let counter = 0;

    const orderedSuppliers = (article?.suppliers ?? [])
      .map((suppID) => {
        const supplier = suppliers.find((supp) => supp.id === suppID);
        const supplierDetails = article?.suppliers_details?.[suppID];
        return { ...supplier, ...supplierDetails };
      })
      .sort(
        (a: Contacts & SuppliersDetails, b: Contacts & SuppliersDetails) => {
          // Priority to the favorite supplier
          if (a.favorite) return -1;
          if (b.favorite) return 1;
          // Priority to the supplier with the lower price
          if (a.price && b.price) return a.price > b.price ? 1 : -1;
        }
      ) as (Contacts & SuppliersDetails)[];

    const suppliersIterator = orderedSuppliers[Symbol.iterator]();

    const articleStockItems = (
      await db.select<StockItems>(
        ctx,
        StockItemsDefinition.name,
        {
          article: article.id,
          state: "stock",
        },
        { limit: 1000 }
      )
    ).filter((item) => item.quantity > 0);

    const stockIterator = articleStockItems[Symbol.iterator]();

    while (remaining > 0 && counter < 100) {
      counter = counter + 1;
      const { remainingQuantity } = calcValuesToFurnishInvoice(
        article,
        invoiceLines,
        furnishes,
        supplierQuotesAlreadySent,
        stockItems
      );

      const stock = stockIterator.next().value as StockItems;
      remaining = remainingQuantity;

      // Stocks are not available, so we try to use the suppliers
      if (!stock) {
        const supplier = suppliersIterator.next().value as Contacts;

        const supplierFurnish = furnishes.find(
          (fur) => fur.ref === article?.id + "@supplier@" + supplier?.id
        );

        // Furnish modified by user, so we try to keep the value
        if (
          !supplierFurnish ||
          (overrideFurnishes ?? []).find(
            (fur) => fur?.ref === supplierFurnish?.ref
          )
        )
          continue;

        supplierFurnish.quantity = min([
          remainingQuantity,
          supplierFurnish.maxAvailable,
        ]);
        furnishes = furnishes.map((fur) => {
          if (fur.ref === supplierFurnish.ref) return supplierFurnish;
          return fur;
        });
      }
      // Use the stock
      else {
        const stockFurnish = furnishes.find(
          (fur) => fur.ref === article.id + "@stock@" + stock.id
        );

        // Furnish modified by user, so we try to keep the value
        if (
          !stockFurnish ||
          (overrideFurnishes ?? []).find(
            (fur) => fur?.ref === stockFurnish?.ref
          )
        )
          continue;

        stockFurnish.quantity = min([remainingQuantity, stock.quantity]);
        furnishes = furnishes.map((fur) => {
          if (fur.ref === stockFurnish.ref) return stockFurnish;
          return fur;
        });
      }
    }
  }

  // Compute the actions to do
  const actions: FurnishInvoiceAction[] = [];
  const grouppedBySuppliers = _.omit(_.groupBy(furnishes, "supplierID"), [
    "undefined",
  ]);
  for (const supplier of suppliers) {
    const supplierFurnishes = grouppedBySuppliers[supplier.id];
    if (!supplierFurnishes) continue;

    const quote = quotes.find((quote) =>
      quote.content.find(
        (line) => line.article === supplierFurnishes[0].articleID
      )
    );

    if (!quote) continue;

    const grouppedByArticles = _.omit(
      _.groupBy(supplierFurnishes, "articleID"),
      ["undefined"]
    );

    const content = Object.entries(grouppedByArticles)
      .map(([articleID, furnishes]) => {
        const article = articles.find((article) => article.id === articleID);
        if (!article) return null;

        const supplierDetails = article.suppliers_details?.[
          supplier.id
        ] as SuppliersDetails;

        const quantity = furnishes.reduce((acc, fur) => acc + fur.quantity, 0);
        if (quantity === 0) return null;

        return {
          article: articleID,
          type: "product",
          name: article.name,
          description: article.description,
          unit: article.unit,
          unit_price: supplierDetails.price,
          quantity: quantity,
          tva: article.tva,
          discount: { mode: "amount", value: 0 },
        } as InvoiceLine;
      })
      .filter(Boolean);

    if (content.length === 0) continue;
    if (!content.some((line) => line.quantity > 0)) continue;

    if (content.reduce((acc, line) => acc + line.quantity, 0) === 0) continue;

    actions.push({
      ref: "supplier@" + supplier.id,
      action: "order-items",
      quote,
      furnishes: supplierFurnishes,
      content,
      supplier: supplier,
    });
  }

  const furnishesStock = furnishes
    .filter((fur) => fur.stockID)
    .filter((fur) => fur.quantity > 0);

  for (const furnish of furnishesStock) {
    actions.push({
      ref: "stock@" + furnish.stockID,
      action: "withdraw-stock",
      quote: null,
      furnishes: [furnish],
      stockItem: furnish.stockID
        ? await db.selectOne<StockItems>(
            ctx,
            StockItemsDefinition.name,
            { id: furnish.stockID },
            {}
          )
        : null,
      quantity: furnish.quantity,
    });
  }

  const articlesData = articles.map((article) => {
    const { remainingQuantity, totalToFurnish, alreadyFurnishedQuantity } =
      calcValuesToFurnishInvoice(
        article,
        invoiceLines,
        furnishes,
        supplierQuotesAlreadySent,
        stockItems
      );

    return {
      id: article.id,
      remainingQuantity,
      totalToFurnish,
      alreadyFurnishedQuantity,
    };
  });

  return { actions, furnishes, articles: articlesData };
};
