import { Button } from "@atoms/button/button";
import { Section } from "@atoms/text";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { RestTable } from "@components/table-rest";
import { CtrlKRestEntities } from "@features/ctrlk";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";

export const RelatedInvoices = ({
  invoice,
  readonly,
  className,
  onPartialInvoice,
}: {
  invoice: Invoices;
  readonly?: boolean;
  className?: string;
  onPartialInvoice?: () => void;
}) => {
  const isQuoteRelated =
    invoice.type === "quotes" || invoice.type === "supplier_quotes";

  const { invoices: quote } = useInvoices({
    query: generateQueryFromMap({ id: invoice.from_rel_quote || "none" }),
  });
  const { invoices: siblings } = useInvoices({
    query: generateQueryFromMap({
      from_rel_quote: [isQuoteRelated ? invoice.id : invoice.from_rel_quote],
    }),
  });

  if (!quote?.data?.list?.length && !siblings?.data?.list?.length) return null;

  return (
    <div className={className}>
      {isQuoteRelated && readonly && (
        <div className="float-right">
          <Button size="sm" onClick={onPartialInvoice}>
            Facture partielle
          </Button>
        </div>
      )}
      <Section className="mb-2">Factures et avoirs liés</Section>
      {!!quote?.data?.list?.length && (
        <RestTable
          data={quote}
          entity="invoices"
          columns={CtrlKRestEntities["invoices"].renderResult as any}
        />
      )}
      {!!siblings?.data?.list?.length && (
        <RestTable
          data={siblings}
          entity="invoices"
          columns={[
            {
              render: (invoice) => <>{invoice.id}</>,
            },
          ]}
        />
      )}
    </div>
  );
};
