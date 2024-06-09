import Select from "@atoms/input/input-select";
import { DocumentBar } from "@components/document-bar";
import { PageLoader } from "@components/page-loader";
import { useClients } from "@features/clients/state/use-clients";
import { Invoices } from "@features/invoices/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InvoiceStatus } from "../components/invoice-status";
import { InvoicesDetailsPage } from "../components/invoices-details";
import { getPdfPreview } from "../components/invoices-preview/invoices-preview";

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

  const { isInitiating, save, draft, setDraft } = useDraftRest<Invoices>(
    "invoices",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.InvoicesView, { id: item.id }));
    },
    _.omit(
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
      ),
      "reference"
    ) as Invoices
  );

  return (
    <Page
      title={[
        { label: "Invoices", to: getRoute(ROUTES.Invoices) },
        { label: id ? "Modifier" : "Créer" },
      ]}
      bar={
        <DocumentBar
          loading={isInitiating || loading}
          document={{ id }}
          mode={"write"}
          onSave={async () => await save()}
          backRoute={ROUTES.Invoices + '?q=type%3A"' + draft.type + '"'}
          viewRoute={ROUTES.InvoicesView}
          editRoute={ROUTES.InvoicesEdit}
          onPrint={async () => getPdfPreview()}
          prefix={
            <>
              {!draft.id && (
                <>
                  <span>Création d'un</span>
                  <Select
                    size="sm"
                    className="w-max"
                    value={draft.type}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        type: e.target.value as Invoices["type"],
                      })
                    }
                  >
                    <option value="quotes">Devis</option>
                    <option value="invoices">Facture</option>
                    <option value="credit_notes">Avoir</option>
                  </Select>
                  <span>en</span>
                </>
              )}
              <InvoiceStatus
                size="lg"
                value={draft.state}
                type={draft.type}
                onChange={(value) => setDraft({ ...draft, state: value })}
              />
            </>
          }
        />
      }
    >
      {isInitiating ? (
        <PageLoader />
      ) : (
        <InvoicesDetailsPage readonly={false} id={id} />
      )}
    </Page>
  );
};
