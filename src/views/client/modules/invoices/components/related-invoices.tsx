import { Button } from "@atoms/button/button";
import { Section } from "@atoms/text";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { RestTable } from "@components/table-rest";
import { InvoicesColumns } from "@features/invoices/configuration";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { useSetRecoilState } from "recoil";
import { InvoiceInvoiceModalAtom } from "./invoice-actions/modal-invoice";
import { twMerge } from "tailwind-merge";

export const RelatedInvoices = ({
  invoice,
  readonly,
  className,
}: {
  invoice: Invoices;
  readonly?: boolean;
  className?: string;
}) => {
  const openInvoiceModal = useSetRecoilState(InvoiceInvoiceModalAtom);

  const navigate = useNavigateAlt();

  const isQuoteRelated =
    invoice.type === "quotes" || invoice.type === "supplier_quotes";
  const isSupplierRelated =
    invoice.type === "supplier_quotes" ||
    invoice.type === "supplier_invoices" ||
    invoice.type === "supplier_credit_notes";

  const { invoices: quote } = useInvoices({
    query: generateQueryFromMap({ id: invoice.from_rel_quote || "none" }),
  });
  const { invoices: siblingsInvoices } = useInvoices({
    query: [
      ...generateQueryFromMap({
        type: isSupplierRelated
          ? ["supplier_invoices", "supplier_credit_notes"]
          : ["invoices", "credit_notes"],
        from_rel_quote: [isQuoteRelated ? invoice.id : invoice.from_rel_quote],
      }),
      { key: "id", not: true, values: [{ op: "equals", value: invoice.id }] },
    ],
    asc: true,
    index: "state_order,emit_date desc",
  });
  const { invoices: siblingsOrders } = useInvoices({
    query: [
      ...generateQueryFromMap({
        type: "supplier_quotes",
        from_rel_quote: [isQuoteRelated ? invoice.id : invoice.from_rel_quote],
      }),
      { key: "id", not: true, values: [{ op: "equals", value: invoice.id }] },
    ],
  });

  if (
    !quote?.data?.list?.length &&
    !siblingsInvoices?.data?.list?.length &&
    !siblingsOrders?.data?.list?.length
  )
    return null;

  return (
    <div className={twMerge("space-y-6", className)}>
      {!!quote?.data?.list?.length && (
        <>
          <div>
            <Section className="my-2">Devis lié</Section>
            <RestTable
              onClick={({ id }, event) =>
                navigate(getRoute(ROUTES.InvoicesView, { id }), { event })
              }
              data={quote}
              entity="invoices"
              columns={InvoicesColumns}
            />
          </div>
        </>
      )}
      {(!!siblingsInvoices?.data?.list?.length ||
        (isQuoteRelated && readonly)) && (
        <div>
          {isQuoteRelated && readonly && (
            <div className="float-right">
              <Button size="xs" onClick={() => openInvoiceModal(true)}>
                Facture partielle
              </Button>
            </div>
          )}
          <Section className="my-2">Factures et avoirs liés</Section>
          <RestTable
            onClick={({ id }, event) =>
              navigate(getRoute(ROUTES.InvoicesView, { id }), { event })
            }
            data={siblingsInvoices}
            entity="invoices"
            columns={InvoicesColumns}
          />
        </div>
      )}
      {!!siblingsOrders?.data?.list?.length && (
        <div>
          <Section className="my-2">Commandes liés à ce devis</Section>
          <RestTable
            onClick={({ id }, event) =>
              navigate(getRoute(ROUTES.InvoicesView, { id }), { event })
            }
            data={siblingsOrders}
            entity="invoices"
            columns={InvoicesColumns}
          />
        </div>
      )}
    </div>
  );
};
