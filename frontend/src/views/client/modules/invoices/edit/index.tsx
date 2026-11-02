import { PageLoader } from "@atoms/page-loader";
import { getUrlModel } from "@components/search-bar/utils/as-model";
import {
  useClients,
  useCurrentClient,
} from "@features/clients/state/use-clients";
import { useParamsOrContextId } from "@features/ctrlk";
import { RECEIVED_E_INVOICE_MODEL_KEY } from "@features/e-invoicing/types/types";
import { useInvoiceDefaultModel } from "@features/invoices/configuration";
import { Invoices } from "@features/invoices/types/types";
import { getDocumentNamePlurial } from "@features/invoices/utils";
import { ROUTES, getRoute } from "@features/routes";
import { InvoicesApiClient } from "@features/invoices/api-client/invoices-api-client";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { getRestApiClient } from "@features/utils/rest/hooks/use-rest";
import { useQueryClient } from "@tanstack/react-query";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { InvoicesDocumentBar } from "../components/document-bar";
import { InvoicesDetailsPage } from "../components/invoices-details";
import { SyncSubscriptionDayAtom } from "../components/input-recurrence-period";

export const InvoicesEditPage = (_props: { readonly?: boolean }) => {
  const { refresh } = useClients();
  const { id: clientId } = useCurrentClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParamsOrContextId();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useRef(useInvoiceDefaultModel()).current;
  const initialModel = getUrlModel<Invoices>();
  // Set when created from a received e-invoice
  const receivedEInvoiceId: string | undefined = (initialModel as any)[
    RECEIVED_E_INVOICE_MODEL_KEY
  ];

  const [syncSubscriptionDay, setSyncSubscriptionDay] = useRecoilState(
    SyncSubscriptionDayAtom(id || "new"),
  );

  const { isInitiating, save, draft, isPendingModification } =
    useDraftRest<Invoices>(
      "invoices",
      id || "new",
      async (item) => {
        console.log("SAVED ITEM EDIT HOOK", item);
        if (
          !id &&
          receivedEInvoiceId &&
          clientId &&
          ["supplier_invoices", "supplier_credit_notes"].includes(item.type)
        ) {
          try {
            await getRestApiClient("received_e_invoices").update(
              clientId,
              { state: "attached", supplier_invoice_id: item.id },
              receivedEInvoiceId,
            );
            queryClient.invalidateQueries({
              queryKey: ["received_e_invoices"],
            });
          } catch (e) {
            console.error(e);
            toast.error(
              "La facture a été créée mais n'a pas pu être rattachée à la facture électronique",
            );
          }
        }
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
        "reference",
        RECEIVED_E_INVOICE_MODEL_KEY
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
              if (
                syncSubscriptionDay &&
                invoice.from_rel_quote?.length &&
                invoice.from_subscription?.from
              ) {
                try {
                  await InvoicesApiClient.syncSubscriptionDay(
                    invoice,
                    invoice.from_subscription.from
                  );
                } catch (e) {
                  console.error(e);
                } finally {
                  setSyncSubscriptionDay(false);
                }
              }
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
