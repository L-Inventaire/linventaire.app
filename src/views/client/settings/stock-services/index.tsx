import { Button } from "@atoms/button/button";
import { Section } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { useHasAccess } from "@features/access";
import { Articles } from "@features/articles/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { Clients } from "@features/clients/types/clients";
import { Callout, Heading, Tabs } from "@radix-ui/themes";
import { getArticleIcon } from "@views/client/modules/articles/components/article-icon";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "../../_layout/page";

export const StockAndServicesPreferences = () => {
  const { t } = useTranslation();

  const { update, client: clientUser, loading, refresh } = useClients();
  const client = clientUser?.client;
  const hasAccess = useHasAccess();
  const readonly = !hasAccess("CLIENT_MANAGE");

  const [serviceItems, setServiceItems] = useState<
    Partial<Clients["service_items"]>
  >({});

  useEffect(() => {
    setServiceItems({ ...client?.service_items });
  }, [client]);

  useEffect(() => {
    refresh();
  }, []);

  console.log("serviceItems", serviceItems?.default_article);

  return (
    <Page title={[{ label: "Stock et service" }, { label: "L'inventaire" }]}>
      <div className="w-full max-w-3xl mx-auto mt-6">
        <Heading size="6">Configuration du stock et des services</Heading>

        <Tabs.Root defaultValue="service" className="mt-4">
          <Tabs.List>
            <Tabs.Trigger value="service">Service</Tabs.Trigger>
            <Tabs.Trigger value="stock">Stock</Tabs.Trigger>
          </Tabs.List>
          <div className="h-4" />

          <Tabs.Content value="stock"></Tabs.Content>

          <Tabs.Content value="service" className="flex flex-col">
            <Section className="block mt-6 mb-4">
              Service sur site par défaut
            </Section>

            {!client?.service_items?.default_article && (
              <Callout.Root color="orange" className="mb-4">
                Aucun article par défaut n'a été défini
              </Callout.Root>
            )}

            <div className="flex flex-col justify-between">
              <RestDocumentsInput
                disabled={readonly}
                value={serviceItems?.default_article}
                onChange={(value) => {
                  setServiceItems({
                    default_article: value,
                  });
                }}
                className="flex"
                entity={"articles"}
                size="lg"
                icon={(p, article) =>
                  getArticleIcon((article as Articles)?.type)(p)
                }
              />

              <Button
                className="mt-4 mb-6"
                onClick={async () => {
                  console.log("TEST", {
                    ...((client?.service_items ||
                      {}) as Clients["service_items"]),
                    ...serviceItems,
                  });

                  await update(client?.id || "", {
                    service_items: {
                      ...((client?.service_items ||
                        {}) as Clients["service_items"]),
                      ...serviceItems,
                    },
                  });
                }}
              >
                {t("general.save")}
              </Button>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </Page>
  );
};
