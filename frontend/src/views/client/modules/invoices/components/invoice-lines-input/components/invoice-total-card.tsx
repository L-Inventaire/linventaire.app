import { Base, SectionSmall } from "@atoms/text";
import { useArticles } from "@features/articles/hooks/use-articles";
import { getCostEstimate } from "@features/articles/utils";
import { Invoices } from "@features/invoices/types/types";
import { formatAmount } from "@features/utils/format/strings";
import { useMemo } from "react";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";

interface InvoiceTotalCardProps {
  invoice: Invoices;
  className?: string;
}

export const InvoiceTotalCard = ({
  invoice,
  className,
}: InvoiceTotalCardProps) => {
  // Get all articles used in the invoice
  const articleIds = useMemo(() => {
    return Array.from(
      new Set(
        (invoice.content || [])
          .filter((line) => line.article && line.type !== "separation")
          .map((line) => line.article!)
      )
    );
  }, [invoice.content]);

  const { articles } = useArticles({
    query: buildQueryFromMap({ id: articleIds }),
    limit: 100,
  });

  // Calculate margin for each line
  const marginCalculation = useMemo(() => {
    let totalMinCost = 0;
    let totalMaxCost = 0;
    let hasCostData = false;

    if (!articles.data?.list)
      return {
        minMargin: 0,
        maxMargin: 0,
        hasCostData: false,
        totalMinCost: 0,
        totalMaxCost: 0,
      };

    (invoice.content || []).forEach((line) => {
      if (line.type === "separation") return;

      const article = articles.data!.list.find((a) => a.id === line.article);
      if (!article) return;

      const quantity = line.quantity || 1;
      const costEstimate = getCostEstimate(article, false, quantity, "");

      if (costEstimate && costEstimate !== "-") {
        hasCostData = true;
        // Parse the cost estimate string using same method as getGainEstimate
        const costs = costEstimate
          .split("-")
          .map((cost) => parseFloat(cost.replace(/[^0-9.,-]/gm, "")));

        if (costs.length === 1) {
          totalMinCost += costs[0];
          totalMaxCost += costs[0];
        } else if (costs.length === 2) {
          totalMinCost += costs[0];
          totalMaxCost += costs[1];
        }
      }
    });

    const totalSellPrice = invoice.total?.total || 0;
    const minMargin = totalSellPrice - totalMaxCost;
    const maxMargin = totalSellPrice - totalMinCost;

    return {
      minMargin,
      maxMargin,
      hasCostData,
      totalMinCost,
      totalMaxCost,
    };
  }, [invoice.content, invoice.total?.total, articles.data?.list]);

  return (
    <div className={`flex justify-end ${className || ""}`}>
      <div className="flex border border-slate-50 dark:border-slate-800 w-max p-2 rounded-md inline-block">
        <div className="grow" />
        <Base>
          <div className="space-y-2 min-w-64 block">
            <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
              <span>Total HT</span>
              {formatAmount(invoice.total?.initial || 0)}
            </div>
            {!!(invoice.total?.discount || 0) && (
              <>
                <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                  <span>Remise</span>
                  <span>{formatAmount(invoice.total?.discount || 0)}</span>
                </div>
                <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                  <span>Total HT après remise</span>
                  <span>{formatAmount(invoice.total?.total || 0)}</span>
                </div>
              </>
            )}
            <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
              <span>TVA</span>
              {formatAmount(invoice.total?.taxes || 0)}
            </div>
            <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
              <SectionSmall className="inline">Total TTC</SectionSmall>
              <SectionSmall className="inline">
                {formatAmount(invoice.total?.total_with_taxes || 0)}
              </SectionSmall>
            </div>
          </div>

          {/* Margin calculation section */}
          {marginCalculation.hasCostData && (
            <>
              <div className="border-t border-slate-100 dark:border-slate-700 pt-2 mt-3 text-gray-500">
                <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                  <span>Coût estimé HT</span>
                  <span>
                    {marginCalculation.totalMinCost ===
                    marginCalculation.totalMaxCost
                      ? formatAmount(marginCalculation.totalMinCost)
                      : `${formatAmount(
                          marginCalculation.totalMinCost
                        )} - ${formatAmount(marginCalculation.totalMaxCost)}`}
                  </span>
                </div>
                <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                  <SectionSmall className="inline text-gray-500">
                    Marge estimée HT
                  </SectionSmall>
                  <SectionSmall className="inline text-gray-500">
                    {marginCalculation.minMargin === marginCalculation.maxMargin
                      ? formatAmount(marginCalculation.minMargin)
                      : `${formatAmount(
                          marginCalculation.minMargin
                        )} - ${formatAmount(marginCalculation.maxMargin)}`}
                  </SectionSmall>
                </div>
              </div>
            </>
          )}
        </Base>
      </div>
    </div>
  );
};
