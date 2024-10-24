import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { InvoicesColumns } from "@features/invoices/configuration";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { ROUTES, getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { Table } from "@molecules/table";
import { Heading } from "@radix-ui/themes";
import _ from "lodash";
import { InvoiceStatus } from "../../invoices/components/invoice-status";

export const RelatedInvoicesInput = ({ id }: { id: string }) => {
  const navigate = useNavigateAlt();

  const { invoices: invoicesContact } = useInvoices({
    query: generateQueryFromMap({
      contact: id,
      state: ["draft", "sent", "purchase_order"],
    }),
    limit: 10,
    asc: false,
    index: "state,type,emit_date",
  });

  const { invoices: invoicesClient } = useInvoices({
    query: generateQueryFromMap({
      client: id,
      state: ["draft", "sent", "purchase_order"],
    }),
    limit: 10,
    asc: false,
    index: "state,type,emit_date",
  });

  return (
    <div className="flex flex-col">
      <Heading size="4" className="grow">
        Devis, factures et commandes
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
