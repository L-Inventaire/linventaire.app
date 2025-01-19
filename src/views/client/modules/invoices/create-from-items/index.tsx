import { DocumentBar } from "@components/document-bar";
import { RestDocumentsInput } from "@components/input-rest";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useArticles } from "@features/articles/hooks/use-articles";
import { useCtrlKAsSelect } from "@features/ctrlk/use-ctrlk-as-select";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useServiceItems } from "@features/service/hooks/use-service-items";
import { Button, Callout, Heading } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InvoiceLinesInput } from "../components/invoice-lines-input";
import { computePricesFromInvoice } from "../utils";
import { useClients } from "@features/clients/state/use-clients";

export const QuoteFromItems = (_props: { readonly?: boolean }) => {
  const { ids } = useParams();
  const navigate = useNavigate();

  const select = useCtrlKAsSelect();

  const { service_items: items, upsert: upsertServiceItems } = useServiceItems({
    query: buildQueryFromMap({ id: ids?.split(",") }),
    limit: 100,
  });

  const { upsert } = useInvoices();

  const [loading, setLoading] = useState(false);

  const [lines, setLines] = useState<Invoices>([] as any);

  const usedItems = items?.data?.list;
  const usedItemsClients = _.uniq(usedItems?.map((item) => item.client));

  const { client } = useClients();

  const { articles } = useArticles({
    query: buildQueryFromMap({
      id: [
        ...(items?.data?.list.map((item) => item.article) ?? []),
        ...(lines.content?.map((line) => line.article) ?? []),
        client?.client.service_items?.default_article,
      ],
    }),
    limit: 100,
  });

  useEffect(() => {
    if (articles?.data?.list?.length) {
      const grouped = _.groupBy(usedItems, "article");
      const invoice = {
        ...lines,
        client: lines.client || usedItems?.[0]?.client || "",
        content:
          lines.content ||
          Object.values(grouped).map((item) => {
            const article = (articles.data?.list || []).find(
              (article) => article.id === item[0].article
            );
            const defaultArticle = (articles.data?.list || []).find(
              (article) =>
                article.id === client?.client.service_items?.default_article
            );
            const usedArticle = article || defaultArticle;

            return {
              _id: article?.id,
              article: usedArticle?.id || "",
              name: usedArticle?.name || "(pas d'article)",
              description:
                usedArticle?.description ||
                `(${item
                  .map((a) => a.title)
                  .filter(Boolean)
                  .join(", ")})`,
              type: usedArticle?.type ?? "service",
              quantity:
                item.reduce(
                  (acc, a) => acc + (a.quantity_spent || a.quantity_expected),
                  0
                ) || 0,
              unit_price: usedArticle?.price || 0,
              unit: usedArticle?.unit,
              tva: usedArticle?.tva || 0,
            } as InvoiceLine;
          }),
      };

      invoice.total = computePricesFromInvoice(invoice);

      setLines(invoice);
    }
  }, [lines.client, usedItems?.length, JSON.stringify(articles?.data?.list)]);

  useEffect(() => {
    setLines((lines) => ({ ...lines, total: computePricesFromInvoice(lines) }));
  }, [lines.content]);

  if (items.isLoading) return <></>;

  const missingArticles = lines.content?.some(
    (a) => !a.article && (a.quantity || 0) > 0
  );

  return (
    <Page
      title={[
        { label: "Stock", to: getRoute(ROUTES.Stock) },
        { label: "Créer" },
      ]}
      bar={
        <DocumentBar
          entity={"stock_items"}
          document={{}}
          mode={"write"}
          backRoute={getRoute(ROUTES.StockEdit, { id: "new" })}
        />
      }
    >
      <div className="w-full max-w-4xl mx-auto space-y-6 mt-4">
        <div className="space-y-2">
          {usedItemsClients.length > 1 && (
            <Callout.Root color="orange">
              Les services sur sites sélectionnés appartiennent à plusieurs
              clients.
            </Callout.Root>
          )}
          <Heading size="4">Créer le devis pour</Heading>
          <RestDocumentsInput
            entity="contacts"
            onChange={(e) => {
              setLines({
                ...lines,
                client: e,
              });
            }}
            value={lines.client}
            size="xl"
            label="Client"
            placeholder="Rechercher un client"
            filter={
              {
                id: items?.data?.list?.map((item) => item.client),
              } as any
            }
          />
        </div>

        {!!lines.client && !!usedItems?.length && (
          <>
            <div className="space-y-2">
              <Heading size="4">Lignes à créer</Heading>

              <InvoiceLinesInput
                onChange={setLines}
                value={lines}
                hideAttachments
                hideDiscount
              />
            </div>

            <div className="space-y-2">
              <Callout.Root>
                {usedItems?.length} instance(s) de service suivantes seront
                associées au devis:{" "}
                {(usedItems || []).map((item) => item.title).join(", ")}
              </Callout.Root>

              {missingArticles && (
                <Callout.Root color="orange">
                  Certaines lignes n'ont pas d'article associé.
                </Callout.Root>
              )}
            </div>

            <div className="flex items-center space-x-2 float-right">
              <Button
                loading={loading}
                variant="outline"
                className="mr-2"
                disabled={missingArticles || !lines.client}
                onClick={async () =>
                  select(
                    "invoices",
                    {
                      type: "quotes",
                      state: [
                        "draft",
                        "recurring",
                        "completed",
                        "purchase_order",
                      ],
                      client: lines.client,
                    },
                    async (quotes: Invoices[]) => {
                      if (quotes.length === 0) return;
                      const quote = quotes[0];
                      setLoading(true);
                      try {
                        // Now affect the lines to the quote
                        for (const item of usedItems || []) {
                          await upsertServiceItems.mutateAsync({
                            id: item.id,
                            client: item.client || quote.client,
                            for_rel_quote: quote.id,
                          });
                        }

                        navigate(
                          getRoute(ROUTES.InvoicesView, { id: quote.id })
                        );
                      } finally {
                        setLoading(false);
                      }
                    }
                  )
                }
              >
                Associer à un devis (non facturé)
              </Button>
              <Button
                loading={loading}
                variant="outline"
                className="mr-2"
                disabled={missingArticles || !lines.client}
                onClick={async () =>
                  select(
                    "invoices",
                    {
                      type: "quotes",
                      state: ["draft"],
                      client: lines.client,
                    },
                    async (quotes: Invoices[]) => {
                      if (quotes.length === 0) return;
                      const quote = quotes[0];
                      setLoading(true);
                      try {
                        await upsert.mutateAsync({
                          content: [
                            ...(quote.content || []),
                            ...(lines.content || []),
                          ],
                          id: quote.id,
                        });

                        // Now affect the lines to the quote
                        for (const item of usedItems || []) {
                          await upsertServiceItems.mutateAsync({
                            id: item.id,
                            client: item.client || quote.client,
                            for_rel_quote: quote.id,
                          });
                        }

                        navigate(
                          getRoute(ROUTES.InvoicesView, { id: quote.id })
                        );
                      } finally {
                        setLoading(false);
                      }
                    }
                  )
                }
              >
                Ajouter à un devis existant
              </Button>

              <Button
                loading={loading}
                className="float-right"
                disabled={missingArticles || !lines.client}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const quote = await upsert.mutateAsync({
                      ...lines,
                      type: "quotes",
                      state: "draft",
                    });

                    // Now affect the lines to the quote
                    for (const item of usedItems || []) {
                      await upsertServiceItems.mutateAsync({
                        ...item,
                        client: item.client || quote.client,
                        for_rel_quote: quote.id,
                      });
                    }

                    navigate(getRoute(ROUTES.InvoicesView, { id: quote.id }));
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Créer le devis
              </Button>
            </div>
          </>
        )}
      </div>
    </Page>
  );
};
