import { Heading, Tabs } from "@radix-ui/themes";
import { Page } from "../../_layout/page";

export const StockAndServicesPreferences = () => {
  //const { t } = useTranslation();

  //const { update, client: clientUser, loading, refresh } = useClients();
  //const client = clientUser?.client;
  //const hasAccess = useHasAccess();
  //const readonly = !hasAccess("CLIENT_MANAGE");

  //useEffect(() => {
  //  refresh();
  //}, []);

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

          <Tabs.Content value="service"></Tabs.Content>
        </Tabs.Root>
      </div>
    </Page>
  );
};
