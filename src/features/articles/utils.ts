import { formatAmount } from "@features/utils/format/strings";
import { getTvaValue } from "@views/client/modules/invoices/utils";
import { Articles } from "./types/types";

export const getCostEstimate = (
  article: Articles,
  withTva = true,
  quantity = 1
) => {
  return (
    Object.values(article?.suppliers_details || {})
      .filter((a) => a.price)
      .map((a) =>
        formatAmount(
          quantity * a.price * (withTva ? 1 + getTvaValue(article.tva) : 1)
        )
      )
      // Keep only min and max
      .sort()
      .filter((_, i, arr) => i === 0 || i === arr.length - 1)
      .reverse()
      .map((a, i) => (i === 0 ? a : a.replace(/[^0-9.,-]/gm, "")))
      .reverse()
      .join("-") || "-"
  );
};

export const getGainEstimate = (
  sellPrice: number,
  article: Articles,
  withTva = true,
  quantity = 1
) => {
  const cost = getCostEstimate(article, withTva, quantity);
  if (cost === "-") {
    return "-";
  }
  const vals = cost.split("-").map((a) => parseFloat(a));
  return vals
    .map((a) => formatAmount(sellPrice - a))
    .reverse()
    .map((a, i) => (i === 0 ? a : a.replace(/[^0-9.,-]/gm, "")))
    .reverse()
    .join("-");
};
