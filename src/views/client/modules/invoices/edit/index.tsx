import { Button } from "@atoms/button/button";
import { Section, Title } from "@atoms/text";
import { Invoices } from "@features/invoices/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page, PageBlockHr } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { InvoicesDetailsPage } from "../components/invoices-details";
import { PageLoader } from "@components/page-loader";
import { useClients } from "@features/clients/state/use-clients";
import { getFormattedNumerotation } from "@features/utils/format/numerotation";

export const InvoicesEditPage = ({ readonly }: { readonly?: boolean }) => {
  const type = "quotes";

  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const {
    draft: invoice,
    isPending,
    isInitiating,
    save,
  } = useDraftRest<Invoices>(
    "invoices",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.InvoicesView, { id: item.id }));
    },
    {
      type,
      state: "draft",
      reference: getFormattedNumerotation(
        client.invoices_counters[type]?.format,
        client.invoices_counters[type]?.counter
      ),
      language: client.preferences?.language || "fr",
      currency: client.preferences?.currency || "EUR",
      format: client.invoices,
      payment_information: client.payment,
    } as Invoices
  );

  if (isInitiating) return <PageLoader />;

  return (
    <Page
      title={[
        { label: "Invoices", to: getRoute(ROUTES.Invoices) },
        { label: id ? "Modifier" : "Créer" },
      ]}
    >
      <div className="float-right space-x-2">
        <Button
          theme="outlined"
          onClick={async () =>
            navigate(
              !id
                ? getRoute(ROUTES.Invoices)
                : getRoute(ROUTES.InvoicesView, { id })
            )
          }
          size="sm"
        >
          Annuler
        </Button>
        <Button
          disabled={!invoice.client}
          loading={isPending}
          onClick={async () => await save()}
          size="sm"
        >
          Sauvegarder
        </Button>
      </div>
      {!id && <Title>Création de {invoice.reference}</Title>}
      {id && <Title>Modification de {invoice.reference || ""}</Title>}
      <div className="mt-4" />
      <InvoicesDetailsPage type={type} readonly={false} id={id} />
    </Page>
  );
};
