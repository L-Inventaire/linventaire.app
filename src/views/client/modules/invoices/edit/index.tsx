import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
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
import { InvoiceActions } from "../components/invoice-actions";
import { InvoicesDetailsPage } from "../components/invoices-details";

export const InvoicesEditPage = (_props: { readonly?: boolean }) => {
  const { refresh, loading } = useClients();

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();
  const isRevision = id?.includes("~");

  const defaultModel = useInvoiceDefaultModel();
  const initialModel = JSON.parse(
    new URLSearchParams(window.location.search).get("model") || "{}"
  ) as Invoices;

  const { isInitiating, save, draft, remove, restore } = useDraftRest<Invoices>(
    "invoices",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.InvoicesView, { id: item.id }));
    },
    _.omit(
      _.merge(defaultModel, {
        ...initialModel,
        content: (initialModel.content || []).map((a) => ({
          ...a,
          quantity_delivered: 0,
          quantity_ready: 0,
        })),
      }),
      "reference"
    ) as Invoices
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
      footer={
        isRevision ? undefined : <InvoiceActions id={id} readonly={false} />
      }
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
          onRemove={draft.id ? remove : undefined}
          onRestore={draft.id ? restore : undefined}
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
