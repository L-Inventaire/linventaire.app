import { Button } from "@atoms/button/button";
import { InvoiceNumerotationModalAtom } from "@components/invoice-numerotation-input/modal";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { Contacts } from "@features/contacts/types/types";
import { InvoicesColumns } from "@features/invoices/configuration";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { ROUTES, getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Table } from "@molecules/table";
import { Heading } from "@radix-ui/themes";
import _ from "lodash";
import { useSetRecoilState } from "recoil";
import { InvoiceStatus } from "../../invoices/components/invoice-status";

export const RelatedInvoicesInput = ({
  id,
  readonly = true,
}: {
  id: string;
  readonly?: boolean;
}) => {
  const navigate = useNavigateAlt();

  const { invoices: invoicesContact } = useInvoices({
    query: generateQueryFromMap({
      contact: id,
      state: ["draft", "sent", "purchase_order"],
    }),
    limit: 20,
    index: "state_order,type,emit_date desc",
  });

  const { invoices: invoicesClient } = useInvoices({
    query: generateQueryFromMap({
      client: id,
      state: ["draft", "sent", "purchase_order"],
    }),
    limit: 20,
    index: "state_order,type,emit_date desc",
  });

  const { draft: contact, setDraft: setContact } = useReadDraftRest<Contacts>(
    "contacts",
    id || "new",
    readonly
  );

  const setModalNumerotation = useSetRecoilState(InvoiceNumerotationModalAtom);

  return (
    <div className="flex flex-col">
      <Heading size="4" className="flex items-center justify-between grow">
        <span>Devis, factures et commandes</span>
        <Button
          onClick={() => {
            setModalNumerotation((mod) => ({
              ...mod,
              open: true,
              invoicesCounters: contact?.overrides?.invoices_counters ?? null,
              isCounters: false,
              readonly: readonly,
              onSave: async (counters) => {
                setContact((contact) => {
                  return {
                    ...contact,
                    invoices_counters: {
                      ...contact?.overrides?.invoices_counters,
                      ...(counters ?? {}),
                    },
                  };
                });
              },
            }));
          }}
        >
          Numérotation
        </Button>
      </Heading>
      <div className="space-y-4 mt-4">
        <Table
          border
          data={_.orderBy(
            _.uniq([
              ...(invoicesContact.data?.list || []),
              ...(invoicesClient.data?.list || []),
            ])
          )}
          groupBy="state"
          groupByRender={(row) => (
            <div className="mt-px">
              <InvoiceStatus
                size="xs"
                readonly
                value={row.state}
                type={row.type}
              />
            </div>
          )}
          columns={[
            {
              title: "Document",
              thClassName: "w-1/4",
              render: (invoice) =>
                invoice.type === "quotes"
                  ? "Devis"
                  : invoice.type === "invoices"
                  ? "Facture"
                  : invoice.type === "credit_notes"
                  ? "Avoir"
                  : "Bon de commande",
            },
            ...InvoicesColumns.filter((invoice) => invoice.id !== "tags"),
          ]}
          onClick={(contact, event) =>
            navigate(getRoute(ROUTES.InvoicesView, { id: contact.id }), {
              event,
            })
          }
        />
      </div>
    </div>
  );
};
