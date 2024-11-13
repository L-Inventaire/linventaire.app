import { DocumentBar } from "@components/document-bar";
import { RestDocumentsInput } from "@components/input-rest";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useArticles } from "@features/articles/hooks/use-articles";
import { useContact } from "@features/contacts/hooks/use-contacts";
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

export const QuoteFromItems = (_props: { readonly?: boolean }) => {
  const { ids } = useParams();
  const navigate = useNavigate();

  const select = useCtrlKAsSelect();

  const { service_items: items, upsert: upsertServiceItems } = useServiceItems({
    query: buildQueryFromMap({ id: ids?.split(",") }),
    limit: 100,
  });
  const { articles } = useArticles({
    query: buildQueryFromMap({
      id: items?.data?.list.map((item) => item.article),
    }),
    limit: 100,
  });

  const { upsert } = useInvoices();

  const [loading, setLoading] = useState(false);

  const [lines, setLines] = useState<Invoices>([] as any);
  const { contact: client } = useContact(lines.client);
  const clientItems = items?.data?.list?.filter(
    (item) =>
      [client?.id, ...(client?.parents || [])].includes(item.client) ||
      !lines.client
  );

  useEffect(() => {
    if (articles?.data?.list?.length) {
      const grouped = _.groupBy(clientItems, "article");
      setLines({
        ...lines,
        client: lines.client || clientItems?.[0]?.client || "",
        content: Object.values(grouped).map((item) => {
          const article = (articles.data?.list || []).find(
            (article) => article.id === item[0].article
          );
          return {
            _id: article?.id,
            article: article?.id || "",
            name: article?.name || "(pas d'article)",
            description: article?.description || "",
            type: article?.type,
            quantity:
              item.reduce(
                (acc, a) => acc + (a.quantity_spent || a.quantity_expected),
                1
              ) || 0,
            unit_price: article?.price || 0,
            unit: article?.unit,
            tva: article?.tva || 0,
          } as InvoiceLine;
        }),
      });
    }
  }, [lines.client, clientItems?.length, articles?.data?.list?.length]);

  if (items.isLoading) return <></>;

  const keptServices = clientItems?.filter((a) =>
    lines.content?.map((a) => a.article)?.includes(a.article)
  );

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
      <div className="w-full max-w-3xl mx-auto space-y-6 mt-4">
        <div className="space-y-2">
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

        {!!lines.client && !!clientItems?.length && (
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
                {keptServices?.length} instance(s) de service suivantes seront
                associées au devis:{" "}
                {(keptServices || []).map((item) => item.title).join(", ")}
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
                      state: "draft",
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
                        for (const item of keptServices || []) {
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
                    for (const item of keptServices || []) {
                      await upsertServiceItems.mutateAsync({
                        id: item.id,
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
