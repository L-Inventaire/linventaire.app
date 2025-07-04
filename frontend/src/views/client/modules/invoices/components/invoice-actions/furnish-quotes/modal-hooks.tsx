import { Articles } from "@features/articles/types/types";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { useFurnishQuotes } from "@features/invoices/hooks/use-furnish-quotes";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { StockItems } from "@features/stock/types/types";
import { debounce } from "@features/utils/debounce";
import { useCallback } from "react";
import { atom } from "recoil";
import { FurnishQuotesArticle, FurnishQuotesFurnish } from "../../../types";

export type FurnishQuotesModalType = {
  open: boolean;
  id: string;
  article: (Articles & FurnishQuotesArticle) | null;
};

export const FurnishQuotesModalAtom = atom<FurnishQuotesModalType>({
  key: "FurnishQuotesModalAtom",
  default: {
    open: false,
    id: "",
    article: null,
  },
});

// Custom hook to handle article furnish logic
export const useFurnishArticle = (
  quoteId: string,
  article: Articles & FurnishQuotesArticle
) => {
  const { invoice: quote } = useInvoice(quoteId || "");
  const edit = useEditFromCtrlK();

  const {
    furnishQuotes,
    suppliers,
    stocks,
    modifiedFurnishes,
    setFurnishesOverride,
    furnishesTextValues,
    setFurnishesTextValues,
    refetchFurnishQuotes,
  } = useFurnishQuotes(quote ? [quote] : []);

  const addSupplier = async (articleID: string) => {
    edit<Articles>("articles", articleID, {}, async () => {
      await refetchFurnishQuotes(false);
    });
  };

  const addStock = async (articleID: string) => {
    edit<StockItems>(
      "stock_items",
      "",
      {
        article: articleID,
        for_rel_quote: quote?.id,
        quantity: 1,
      },
      async () => {
        await refetchFurnishQuotes(false);
      }
    );
  };

  const setArticleQuantity = useCallback(
    (fur: FurnishQuotesFurnish, value: number) => {
      if (value < 0) return;

      setFurnishesTextValues((data) =>
        data.map((f) =>
          f.ref === fur.ref ? { ref: fur.ref, value: value.toString() } : f
        )
      );

      debounce(
        () => {
          setFurnishesOverride((data) => {
            const found = data.find((f) => f.ref === fur.ref);
            if (found) {
              return data.map((f) =>
                f.ref === fur.ref ? { ...f, quantity: value } : f
              );
            }
            return [...data, { ...fur, quantity: value }];
          });
        },
        {
          key: "furnish:quotes:set",
          timeout: 1000,
          doInitialCall: true,
        }
      );
    },
    [furnishesTextValues, furnishQuotes]
  );

  const articleFurnishes = modifiedFurnishes.filter(
    (fur) => fur.articleID === article.id && fur.supplierID !== null
  );

  const totalMax = article.totalToFurnish ?? 0;

  return {
    quote,
    articleFurnishes,
    addSupplier,
    addStock,
    setArticleQuantity,
    refetchFurnishQuotes,
    getLineDetails: (fur: FurnishQuotesFurnish) => {
      const supplier = (suppliers?.data?.list ?? []).find(
        (supp) => supp.id === fur?.supplierID
      );
      const supplierDetails =
        article.suppliers_details?.[supplier?.id ?? ""] ?? {};

      const stock = (stocks?.data?.list ?? []).find(
        (stock) => stock.id === fur?.stockID
      );

      const furnishText = furnishesTextValues.find((v) => v.ref === fur.ref);

      const maxFurnishable =
        (fur.maxAvailable
          ? fur.maxAvailable
          : supplier
          ? totalMax
          : stock?.quantity) ?? 0;

      const totalValueText = (articleFurnishes ?? []).reduce((acc, fur) => {
        const text = furnishesTextValues.find((v) => v.ref === fur.ref);
        return acc + parseInt(text?.value ?? "0");
      }, 0);

      return {
        supplier,
        supplierDetails,
        stock,
        furnishText,
        maxFurnishable,
        totalValueText,
      };
    },
  };
};
