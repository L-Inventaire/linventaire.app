import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useClients } from "@features/clients/state/use-clients";
import { useParamsOrContextId } from "@features/ctrlk";
import { useInvoiceDefaultModel } from "@features/invoices/configuration";
import { Invoices } from "@features/invoices/types/types";
import { getDocumentNamePlurial } from "@features/invoices/utils";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { InvoiceActions } from "../components/invoice-actions";
import { InvoicesDetailsPage } from "../components/invoices-details";
import { getUrlModel } from "@components/search-bar/utils/as-model";

export const InvoicesEditPage = (_props: { readonly?: boolean }) => {
  const { refresh, loading } = useClients();

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParamsOrContextId();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();
  const isRevision = id?.includes("~");

  const defaultModel = useRef(useInvoiceDefaultModel()).current;
  const initialModel = getUrlModel<Invoices>();

  const { isInitiating, save, draft, remove, restore, isPendingModification } =
    useDraftRest<Invoices>(
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
      loading={isPendingModification}
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
      <div className="mt-6" />
      {isInitiating ? (
        <PageLoader />
      ) : (
        <InvoicesDetailsPage readonly={false} id={id} />
      )}
    </Page>
  );
};
