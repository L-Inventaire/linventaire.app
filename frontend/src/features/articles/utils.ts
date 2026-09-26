import { formatAmount } from "@features/utils/format/strings";
import { getTvaValue } from "@views/client/modules/invoices/utils";
import { Articles } from "./types/types";

export const getCostEstimate = (
  article?: Articles,
  withTva = true,
  quantity = 1,
  fallback = "-"
) => {
  return (
    Object.values(article?.suppliers_details || {})
      .filter((a) => a.price)
      .map(
        (a) =>
          quantity *
          a.price *
          (withTva ? 1 + getTvaValue(article?.tva || "0") : 1)
      )
      // Keep only min and max
      .sort()
      .filter((_, i, arr) => i === 0 || i === arr.length - 1)
      .reverse()
      .map((a) => formatAmount(a))
      .map((a, i) => (i === 0 ? a : a.replace(/[^0-9.,-]/gm, "")))
      .reverse()
      .join("-") || fallback
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

/** Highest known purchase price (HT) of an article, or null if no cost is known */
export const getArticleMaxCost = (article?: Articles | null): number | null => {
  const prices = Object.values(article?.suppliers_details || {})
    .map((a) => parseFloat(a?.price as any))
    .filter((a) => !isNaN(a) && a > 0);
  return prices.length ? Math.max(...prices) : null;
};

/**
 * How the margin percentage is computed:
 * - "cost": markup on the cost, (price - cost) / cost
 * - "price": margin on the sell price, (price - cost) / price
 */
export type MarginBase = "cost" | "price";

/** Margin in percent, rounded to one decimal */
export const getMarginFromPrice = (
  price: number | string,
  cost: number | null,
  base: MarginBase = "cost"
): number | null => {
  const p = parseFloat(price as any);
  if (!cost || isNaN(p)) return null;
  const divider = base === "price" ? p : cost;
  if (!divider) return null;
  return Math.round(((p - cost) / divider) * 1000) / 10;
};

/** Price computed from a margin in percent, rounded to the cent */
export const getPriceFromMargin = (
  margin: number | string,
  cost: number | null,
  base: MarginBase = "cost"
): number | null => {
  const m = parseFloat(margin as any);
  if (!cost || isNaN(m)) return null;
  // A margin on the sell price can't reach 100%
  if (base === "price" && m >= 100) return null;
  const price = base === "price" ? cost / (1 - m / 100) : cost * (1 + m / 100);
  return Math.round(price * 100) / 100;
};

export const formatMargin = (margin: number | null) =>
  margin === null ? "" : margin.toFixed(1).replace(".", ",") + " %";
