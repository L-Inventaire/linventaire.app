import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { Invoices } from "@features/invoices/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { InvoicesDetailsPage } from "../components/invoices-details";
import { PageLoader } from "@components/page-loader";

export const InvoicesEditPage = ({ readonly }: { readonly?: boolean }) => {
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
    {} as Invoices
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
          disabled={!invoice.name}
          loading={isPending}
          onClick={async () => await save()}
          size="sm"
        >
          Sauvegarder
        </Button>
      </div>
      {!id && <Title>Création de {invoice.name || "<nouveau>"}</Title>}
      {id && <Title>Modification de {invoice.name || ""}</Title>}
      <div className="mt-4" />
      <InvoicesDetailsPage readonly={false} id={id} />
    </Page>
  );
};
