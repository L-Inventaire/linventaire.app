import Select from "@atoms/input/input-select";
import { DocumentBar } from "@components/document-bar";
import { PageLoader } from "@atoms/page-loader";
import { useClients } from "@features/clients/state/use-clients";
import { useInvoiceDefaultModel } from "@features/invoices/configuration";
import { Invoices } from "@features/invoices/types/types";
import { getDocumentNamePlurial } from "@features/invoices/utils";
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
  const { refresh, loading } = useClients();

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useInvoiceDefaultModel();
  const initialModel = JSON.parse(
    new URLSearchParams(window.location.search).get("model") || "{}"
  ) as Invoices;

  const { isInitiating, save, draft, setDraft } = useDraftRest<Invoices>(
    "invoices",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.InvoicesView, { id: item.id }));
    },
    _.omit(_.merge(defaultModel, initialModel), "reference") as Invoices
  );

  return (
    <Page
      title={[
        {
          label: getDocumentNamePlurial(draft.type),
          to: getRoute(ROUTES.Invoices, { type: draft.type }),
        },
        { label: id ? "Modifier" : "Créer" },
      ]}
      bar={
        <DocumentBar
          loading={isInitiating || loading}
          entity={"invoices"}
          document={{ id }}
          mode={"write"}
          onSave={async () => await save()}
          backRoute={getRoute(ROUTES.Invoices, { type: draft.type })}
          viewRoute={ROUTES.InvoicesView}
          editRoute={ROUTES.InvoicesEdit}
          onPrint={async () => getPdfPreview()}
          prefix={
            <>
              {!draft.id && (
                <>
                  <span>Création d'un</span>
                  <Select
                    size="md"
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
                size="md"
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
