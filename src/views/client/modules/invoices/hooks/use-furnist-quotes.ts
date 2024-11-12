import { useArticles } from "@features/articles/hooks/use-articles";
import { useClients } from "@features/clients/state/use-clients";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Invoices } from "@features/invoices/types/types";
import { useStockItems } from "@features/stock/hooks/use-stock-items";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect, useState } from "react";
import { InvoicesApiClient } from "../api-client/api-client";
import { FurnishQuotesFurnish } from "../types";

export const useFurnishQuotes = (quotes: Invoices[]) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const { data: furnishQuotes, isLoading: isLoadingFurnishQuotes } = useQuery({
    queryKey: ["furnish-quotes", quotes.join(",")],
    queryFn: async () =>
      await InvoicesApiClient.getFurnishQuotes(
        client.id,
        quotes.map((q) => q.id)
      ),
  });

  const [furnishesOverride, setFurnishesOverride] = useState<
    FurnishQuotesFurnish[]
  >([]);

  useEffect(() => {
    setFurnishesOverride(furnishQuotes?.furnishes ?? []);
  }, [furnishQuotes?.furnishes ?? []]);

  const grouppedBySuppliers = _.omit(
    _.groupBy(furnishesOverride, "supplierID"),
    ["undefined"]
  );
  const grouppedByStocks = _.omit(_.groupBy(furnishesOverride, "stockID"), [
    "undefined",
  ]);
  const grouppedByArticles = _.omit(_.groupBy(furnishesOverride, "articleID"), [
    "undefined",
  ]);

  const supplierIDs = furnishesOverride
    .map((furnish) => furnish.supplierID)
    .filter(Boolean);
  const stockIDs = furnishesOverride
    .map((furnish) => furnish.stockID)
    .filter(Boolean);
  const [lockedFurnishesRefs, setLockedFurnishesRefs] = useState<string[]>([]);
  const articleIDs = furnishesOverride
    .map((fur) => fur.articleID)
    .filter(Boolean);

  const stockFurnishes = furnishesOverride.filter(
    (furnish) => !!furnish.stockID
  );

  const { contacts: suppliers } = useContacts({
    query: [
      {
        key: "id",
        values: supplierIDs.map((id) => ({ op: "equals", value: id })),
      },
    ],
    key: "suppliers_" + supplierIDs.join("_"),
  });

  const { stock_items: stocks } = useStockItems({
    query: [
      {
        key: "id",
        values: stockIDs.map((id) => ({ op: "equals", value: id })),
      },
    ],
    key: "stock_items_" + stockIDs.join("_"),
  });

  const { articles } = useArticles({
    query: [
      {
        key: "id",
        values: articleIDs.map((id) => ({ op: "equals", value: id })),
      },
    ],
    key: "articles_" + articleIDs.join("_"),
  });

  const lockedFurnishes = furnishesOverride.filter((fur) =>
    lockedFurnishesRefs.includes(fur.ref)
  );

  return {
    furnishQuotes,
    isLoadingFurnishQuotes,
    grouppedBySuppliers,
    grouppedByStocks,
    grouppedByArticles,
    lockedFurnishes,
    articles,
    suppliers,
    stockFurnishes,
    stocks,
    lockedFurnishesRefs,
    setLockedFurnishesRefs,
    furnishesOverride,
    setFurnishesOverride,
  };
};
