import { Alert } from "@atoms/alert";
import { Unit } from "@atoms/input/input-unit";
import { DelayedLoader } from "@atoms/loader";
import { Base, BaseSmall, Info, Section } from "@atoms/text";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { RestTable } from "@components/table-rest";
import { getContactName } from "@features/contacts/types/types";
import { InvoicesColumns } from "@features/invoices/configuration";
import { useFurnishQuotes } from "@features/invoices/hooks/use-furnish-quotes";
import { useInvoice, useInvoices } from "@features/invoices/hooks/use-invoices";
import { getRoute, ROUTES } from "@features/routes";
import { useStockItems } from "@features/stock/hooks/use-stock-items";
import { formatAmount } from "@features/utils/format/strings";
import { CubeTransparentIcon } from "@heroicons/react/24/outline";
import { Table } from "@molecules/table";
import { Card } from "@radix-ui/themes";
import _, { max } from "lodash";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { FurnishQuotesModalAtom } from "./modal-hooks";

export const FurnishQuotesDetails = ({ id }: { id?: string }) => {
  const quote = useInvoice(id || "");

  const setModal = useSetRecoilState(FurnishQuotesModalAtom);

  const {
    groupedByArticles,
    articles,
    modifiedFurnishes,
    suppliers,
    isLoadingFurnishQuotes,
  } = useFurnishQuotes(quote.invoice ? [quote.invoice] : []);

  const { invoices: existingSupplierQuotes } = useInvoices({
    query: [
      ...generateQueryFromMap({
        from_rel_quote: [id ?? "_"],
        type: "supplier_quotes",
      }),
    ],
  });

  const { stock_items: reservedStocks } = useStockItems({
    query: [
      ...generateQueryFromMap({
        for_rel_quote: id ?? "_",
      }),
    ],
  });

  const navigate = useNavigate();

  if (!modifiedFurnishes || isLoadingFurnishQuotes)
    return (
      <Card>
        <DelayedLoader />
      </Card>
    );

  return (
    <div className="p-6">
      <Info className="block mb-4">
        Définissez les articles que vous souhaitez retirer du stock ou de
        commander chez vos fournisseurs
      </Info>
      {articles.some((article) => {
        if (!groupedByArticles[article.id]) return false;

        return (
          (groupedByArticles[article.id] ?? []).reduce((acc, fur) => {
            return acc + fur.quantity;
          }, 0) >
          (_.first(groupedByArticles[article.id] ?? [])?.totalToFurnish ?? 0)
        );
      }) && (
        <Alert
          title="Vous allez fournir des articles en trop"
          theme="warning"
          icon="CheckCircleIcon"
          className="mb-6 max-w-max p-3 pr-5"
        >
          {articles.map((article) => {
            const quantity = (groupedByArticles[article.id] ?? []).reduce(
              (acc, fur) => {
                return acc + fur.quantity;
              },
              0
            );
            const max =
              _.first(groupedByArticles[article.id] ?? [])?.totalToFurnish ?? 0;

            if (quantity > max)
              return (
                <Info className="block text-white">
                  {article.name} - {quantity - max} articles en trop
                </Info>
              );
            return <></>;
          })}
        </Alert>
      )}

      <div className="w-full">
        <Section className="mb-6">Articles à fournir</Section>
        <div className="grid grid-cols-1 mb-6">
          <Table
            data={articles}
            columns={[
              {
                title: "Article",
                render: (article) => (
                  <div className="max-w-md">{article.name}</div>
                ),
              },
              {
                title: "Déjà commandé",
                render: (article) => {
                  const articleOrders = (
                    existingSupplierQuotes.data?.list ?? []
                  ).filter((quote) =>
                    (quote.content ?? []).some(
                      (line) => line.article === article.id
                    )
                  );
                  const quantity = articleOrders.reduce(
                    (acc, order) =>
                      acc +
                      (order.content ?? [])
                        .filter((line) => line.article === article.id)
                        .reduce((acc, line) => acc + (line.quantity ?? 0), 0),
                    0
                  );
                  return (
                    <div key={article.id} className="mb-1 flex justify-between">
                      <BaseSmall>
                        {quantity} <Unit unit={article.unit} />
                      </BaseSmall>
                    </div>
                  );
                },
              },
              {
                title: "Stock reservé ou livré",
                render: (article) => {
                  const articleStocks = (
                    reservedStocks.data?.list ?? []
                  ).filter((stock) => stock.article === article.id);
                  const quantity = articleStocks.reduce(
                    (acc, stock) => acc + stock.quantity,
                    0
                  );

                  return (
                    <div key={article.id} className="mb-1 flex justify-between">
                      <BaseSmall>
                        {quantity} <Unit unit={article.unit} />
                      </BaseSmall>
                    </div>
                  );
                },
              },
              {
                title: "Fournir",
                render: (article) => {
                  const furnishes = groupedByArticles[article.id];
                  const stocksQuantity = (furnishes ?? [])
                    .filter((fur) => fur.quantity > 0 && fur.stockID)
                    .reduce((acc, fur) => acc + fur.quantity, 0);

                  return (
                    <Card
                      onClick={() =>
                        setModal((data) => ({
                          ...data,
                          open: true,
                          article,
                          id: id ?? "",
                        }))
                      }
                      className={twMerge(
                        "flex items-center justify-between w-2/3",
                        "hover:bg-slate-500 hover:bg-opacity-15 hover:border-slate-500 bg-opacity-0 transition-all cursor-pointer"
                      )}
                      data-tooltip={
                        "Répartir les articles à commander entre les fournisseurs et les stocks"
                      }
                    >
                      <div className="w-full h-full grid grid-cols-[1fr_70px] gap-3">
                        {(furnishes ?? []).filter((fur) => fur.quantity > 0)
                          .length === 0 && <Info>Cliquer pour modifier</Info>}
                        {(furnishes ?? [])
                          .filter((fur) => fur.quantity > 0 && fur.supplierID)
                          .map((fur) => {
                            const supplier = (suppliers?.data?.list ?? []).find(
                              (supp) => supp.id === fur.supplierID
                            );

                            return (
                              <>
                                {!!supplier && (
                                  <>
                                    <Base>{getContactName(supplier)}</Base>
                                    <Base>
                                      {fur.quantity}{" "}
                                      <Unit unit={article.unit} />
                                    </Base>
                                  </>
                                )}
                              </>
                            );
                          })}

                        {stocksQuantity > 0 && (
                          <>
                            <Base>Stock</Base>
                            <Base>
                              {stocksQuantity} <Unit unit={article.unit} />
                            </Base>
                          </>
                        )}
                      </div>

                      <CubeTransparentIcon className="w-6" />
                    </Card>
                  );
                },
              },
              {
                title: "Status après l'opération",
                render: (article) => {
                  const articleFurnishes = modifiedFurnishes.filter(
                    (fur) => fur.articleID === article.id
                  );
                  const totalValue = (articleFurnishes ?? []).reduce(
                    (acc, fur) => acc + fur.quantity,
                    0
                  );

                  return (
                    <div key={article.id} className="mb-1 flex justify-between">
                      <BaseSmall
                        className={twMerge(
                          (article.totalToFurnish ?? 0) - totalValue > 0
                            ? "text-red-500"
                            : (article.totalToFurnish ?? 0) - totalValue < 0
                            ? "text-purple-500"
                            : "text-green-500",
                          "whitespace-nowrap"
                        )}
                      >
                        {totalValue} / {article.totalToFurnish ?? 0}{" "}
                        <Unit unit={article.unit} />
                      </BaseSmall>
                    </div>
                  );
                },
              },
              {
                title: "Achat total HT",
                thClassName: "text-right justify-end",
                headClassName: "text-right justify-end",
                render: (article) => {
                  const furnishes = modifiedFurnishes.filter(
                    (fur) => fur.articleID === article.id && fur.supplierID
                  );

                  const totalValue = (furnishes ?? []).reduce((acc, fur) => {
                    const supplierDetails =
                      article.suppliers_details?.[fur.supplierID ?? ""];

                    return acc + fur.quantity * supplierDetails.price;
                  }, 0);

                  return (
                    <div
                      key={article.id}
                      className="mb-1 w-full flex justify-end"
                    >
                      <BaseSmall className="block ml-2">
                        {formatAmount(totalValue)}
                      </BaseSmall>
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
      </div>

      {(existingSupplierQuotes?.data?.list ?? []).length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          <Section className="mt-2 mb-4">Commandes existantes</Section>
          {(existingSupplierQuotes?.data?.list ?? []) && (
            <RestTable
              onClick={({ id }) =>
                navigate(getRoute(ROUTES.InvoicesView, { id }))
              }
              data={existingSupplierQuotes}
              entity="invoices"
              columns={InvoicesColumns.filter((a) => !a.id?.includes("client"))}
            />
          )}
        </div>
      )}
    </div>
  );
};
