import { PageLoader } from "@atoms/page-loader";
import { getUrlModel } from "@components/search-bar/utils/as-model";
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
import { InvoicesDocumentBar } from "../components/document-bar";
import { InvoicesDetailsPage } from "../components/invoices-details";

export const InvoicesEditPage = (_props: { readonly?: boolean }) => {
  const { refresh } = useClients();

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParamsOrContextId();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useRef(useInvoiceDefaultModel()).current;
  const initialModel = getUrlModel<Invoices>();

  const { isInitiating, save, draft, isPendingModification } =
    useDraftRest<Invoices>(
      "invoices",
      id || "new",
      async (item) => {
        console.log("SAVED ITEM EDIT HOOK", item);
        navigate(getRoute(ROUTES.InvoicesView, { id: item.id }));
      },
      _.omit(
        _.merge({}, defaultModel, {
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
      bar={
        <InvoicesDocumentBar
          id={id}
          onSave={async () => {
            const invoice = await save();
            if (invoice?.id) {
              console.log("NAVIGATE TO VIEW");
              navigate(getRoute(ROUTES.InvoicesView, { id: invoice.id }));
            }
          }}
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
