import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { InvoicesColumns } from "@features/invoices/configuration";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { ROUTES, getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { Table } from "@molecules/table";
import { PageBlock } from "@views/client/_layout/page";
import _ from "lodash";

export const RelatedInvoicesInput = ({ id }: { id: string }) => {
  const navigate = useNavigateAlt();

  const { invoices: invoicesContact } = useInvoices({
    query: generateQueryFromMap({
      contact: id,
      state: ["draft", "sent", "purchase_order", "partial_paid", "paid"],
    }),
    limit: 10,
    asc: false,
    index: "emit_date",
  });

  const { invoices: invoicesClient } = useInvoices({
    query: generateQueryFromMap({
      client: id,
      state: ["draft", "sent", "purchase_order", "partial_paid", "paid"],
    }),
    limit: 10,
    asc: false,
    index: "emit_date",
  });

  return (
    <PageBlock closable title="Documents">
      <div className="space-y-4 mt-4">
        <Table
          data={_.orderBy(
            _.uniq([
              ...(invoicesContact.data?.list || []),
              ...(invoicesClient.data?.list || []),
            ]),
            "emit_date",
            "desc"
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
    </PageBlock>
  );
};
