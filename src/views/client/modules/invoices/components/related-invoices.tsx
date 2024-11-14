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

  const { invoices: quote } = useInvoices({
    query: generateQueryFromMap({ id: invoice.from_rel_quote || "none" }),
  });
  const { invoices: siblings } = useInvoices({
    query: [
      ...generateQueryFromMap({
        from_rel_quote: [isQuoteRelated ? invoice.id : invoice.from_rel_quote],
      }),
      { key: "id", not: true, values: [{ op: "equals", value: invoice.id }] },
    ],
  });

  if (!quote?.data?.list?.length && !siblings?.data?.list?.length) return null;

  return (
    <div className={twMerge("space-y-6", className)}>
      {isQuoteRelated && readonly && (
        <div className="float-right">
          <Button size="sm" onClick={() => openInvoiceModal(true)}>
            Facture partielle
          </Button>
        </div>
      )}
      <div>
        <Section className="my-2">Devis lié</Section>
        {!!quote?.data?.list?.length && (
          <RestTable
            onClick={({ id }, event) =>
              navigate(getRoute(ROUTES.InvoicesView, { id }), { event })
            }
            data={quote}
            entity="invoices"
            columns={InvoicesColumns}
          />
        )}
      </div>
      <div>
        <Section className="my-2">Factures et avoirs liés</Section>
        {!!siblings?.data?.list?.length && (
          <RestTable
            onClick={({ id }, event) =>
              navigate(getRoute(ROUTES.InvoicesView, { id }), { event })
            }
            data={siblings}
            entity="invoices"
            columns={InvoicesColumns}
          />
        )}
      </div>
    </div>
  );
};
