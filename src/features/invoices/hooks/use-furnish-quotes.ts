import { useArticles } from "@features/articles/hooks/use-articles";
import { useClients } from "@features/clients/state/use-clients";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Invoices } from "@features/invoices/types/types";
import { useStockItems } from "@features/stock/hooks/use-stock-items";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { SetStateAction, useEffect } from "react";
import { atom, useRecoilState } from "recoil";
import { FurnishQuotesFurnish } from "@views/client/modules/invoices/types";
import { InvoicesApiClient } from "../api-client/invoices-api-client";

export const FurnishQuotesAtom = atom<{
  furnishesOverride: FurnishQuotesFurnish[];
  furnishesTextValues: { ref: string; value: string }[];
}>({
  key: "furnish-quotes",
  default: {
    furnishesOverride: [],
    furnishesTextValues: [],
  },
});

export const useFurnishQuotes = (quotes: Invoices[]) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;
  const [state, setState] = useRecoilState(FurnishQuotesAtom);

  const furnishesOverride = state.furnishesOverride;
  const furnishesTextValues = state.furnishesTextValues;

  const {
    data: furnishQuotes,
    isLoading: isLoadingFurnishQuotes,
    isFetching: isFetchingFurnishQuotes,
    refetch: refetchFurnishQuotesQuery,
  } = useQuery({
    queryKey: [
      "furnish-quotes",
      client.id,
      quotes.map((q) => q.id).join(","),
      JSON.stringify(furnishesOverride),
    ],
    placeholderData: (prev) => prev,
    queryFn: async () =>
      await InvoicesApiClient.getFurnishQuotes(
        client.id,
        quotes.map((q) => q.id),
        furnishesOverride
      ),
  });

  async function actionFurnishQuotes() {
    await InvoicesApiClient.actionFurnishQuotes(
      client.id,
      quotes.map((quote) => quote.id),
      furnishesOverride
    );
    setFurnishesOverride([]);

    await setTimeout(() => {
      refetchFurnishQuotes();
    }, 1000);

    // const result = await InvoicesApiClient.getFurnishQuotes(
    //   client.id,
    //   quotes.map((quote) => quote.id),
    //   []
    // );

    // return result;
  }

  const furnishes = furnishQuotes?.furnishes;

  const setFurnishesOverride = (
    action: SetStateAction<FurnishQuotesFurnish[]>
  ) => {
    let value: FurnishQuotesFurnish[] | null = null;
    if (_.isFunction(action)) {
      value = action(furnishesOverride);
    } else {
      value = action;
    }

    const modifiedFurnishes =
      furnishes?.map((fur) => {
        const override = (value ?? []).find((f) => f.ref === fur.ref);
        if (override) return override;
        return fur;
      }) ?? [];

    const textOverride = modifiedFurnishes.map((fur) => ({
      ref: fur.ref,
      value: fur.quantity.toString(),
    }));

    setState((state) => ({
      ...state,
      furnishesOverride: value ?? [],
      furnishesTextValues: textOverride,
    }));
  };

  const setFurnishesTextValues = (
    action: SetStateAction<{ ref: string; value: string }[]>
  ) => {
    let value: { ref: string; value: string }[] | null = null;
    if (_.isFunction(action)) {
      value = action(furnishesTextValues);
    } else {
      value = action;
    }

    setState((state) => ({ ...state, furnishesTextValues: value ?? [] }));
  };

  const modifiedFurnishes =
    furnishes?.map((fur) => {
      const override = state.furnishesOverride.find((f) => f.ref === fur.ref);
      if (override) return override;
      return fur;
    }) ?? [];

  useEffect(() => {
    setState((state) => {
      const override = state.furnishesOverride.map((fur) => {
        const furnishFound = furnishes?.find((f) => f.ref === fur.ref);
        return furnishFound ? { ...furnishFound, quantity: fur.quantity } : fur;
      });
      const modifiedFurnishes =
        furnishes?.map((fur) => {
          const override = state.furnishesOverride.find(
            (f) => f.ref === fur.ref
          );
          if (override) return override;
          return fur;
        }) ?? [];

      const textOverride = modifiedFurnishes.map((fur) => ({
        ref: fur.ref,
        value: fur.quantity.toString(),
      }));

      return {
        ...state,
        furnishesOverride: override,
        furnishesTextValues: textOverride,
      };
    });
  }, [furnishes]);

  const grouppedBySuppliers = _.omit(
    _.groupBy(modifiedFurnishes, "supplierID"),
    ["undefined"]
  );
  const grouppedByStocks = _.omit(_.groupBy(modifiedFurnishes, "stockID"), [
    "undefined",
  ]);
  const grouppedByArticles = _.omit(_.groupBy(modifiedFurnishes, "articleID"), [
    "undefined",
  ]);

  const supplierIDs = modifiedFurnishes
    .map((furnish) => furnish.supplierID)
    .filter(Boolean);
  const stockIDs = modifiedFurnishes
    .map((furnish) => furnish.stockID)
    .filter(Boolean);

  const articleIDs = modifiedFurnishes
    .map((fur) => fur.articleID)
    .filter(Boolean);

  const stockFurnishes = modifiedFurnishes.filter(
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
        values:
          (furnishQuotes?.articles ?? []).map((a) => ({
            op: "equals",
            value: a.id,
          })) ?? [],
      },
    ],
    key: "articles_" + articleIDs.join("_"),
  });

  async function refetchFurnishQuotes() {
    await refetchFurnishQuotesQuery();
    setFurnishesOverride([]);
  }

  return {
    furnishQuotes,
    isLoadingFurnishQuotes,
    isFetchingFurnishQuotes,
    refetchFurnishQuotes,
    grouppedBySuppliers,
    grouppedByStocks,
    grouppedByArticles,
    articles: (articles?.data?.list ?? []).map((a) => {
      const articleData = furnishQuotes?.articles.find((ad) => ad.id === a.id);
      return { ...a, ...articleData };
    }),
    articlesData: furnishQuotes?.articles,
    suppliers,
    stockFurnishes,
    stocks,
    furnishesOverride,
    setFurnishesOverride,
    furnishes: furnishes,
    modifiedFurnishes,
    furnishesTextValues,
    setFurnishesTextValues,
    actions: furnishQuotes?.actions,
    actionFurnishQuotes,
  };
};
