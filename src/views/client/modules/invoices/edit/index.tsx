import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { PageLoader } from "@components/page-loader";
import { useClients } from "@features/clients/state/use-clients";
import { Invoices } from "@features/invoices/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InvoicesDetailsPage } from "../components/invoices-details";

export const InvoicesEditPage = ({ readonly }: { readonly?: boolean }) => {
  const { client: clientUser, refresh, loading } = useClients();
  const client = clientUser!.client!;

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  // TODO this must not execute if we're in a modal /!\
  const initialModel = JSON.parse(
    new URLSearchParams(window.location.search).get("model") || "{}"
  ) as Invoices;

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
    _.merge(
      {
        type: "quotes",
        state: "draft",
        language: client.preferences?.language || "fr",
        currency: client.preferences?.currency || "EUR",
        format: client.invoices,
        payment_information: client.payment,
      } as Invoices,
      initialModel
    ) as Invoices
  );

  if (isInitiating || loading) return <PageLoader />;

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
      <InvoicesDetailsPage readonly={false} id={id} />
    </Page>
  );
};
