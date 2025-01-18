import { DocumentBar } from "@components/document-bar";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { ROUTES, getRoute } from "@features/routes";
import { Heading, Text } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";

export const GroupInvoices = (_props: { readonly?: boolean }) => {
  const { ids } = useParams();

  const { invoices: items } = useInvoices({
    query: buildQueryFromMap({ id: ids?.split(",") }),
    limit: 100,
  });

  if (items.isLoading) return <></>;

  return (
    <Page
      title={[{ label: "Regrouper des devis" }]}
      bar={
        <DocumentBar
          entity={"invoices"}
          document={{}}
          mode={"write"}
          backRoute={getRoute(ROUTES.Invoices, { id: "new" })}
        />
      }
    >
      <div className="w-full max-w-4xl mx-auto space-y-6 mt-4">
        <div className="space-y-2">
          <Heading size="4">Regrouper des devis</Heading>
          <Text>
            Un nouveau devis sera créé avec les lignes des devis sélectionnés.
            Les devis sélectionnés seront clôturés.
          </Text>
        </div>
        [Cette action n'est pas encore disponible]
      </div>
    </Page>
  );
};
