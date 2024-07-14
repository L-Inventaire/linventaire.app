import { Tag } from "@atoms/badge/tag";
import { Info } from "@atoms/text";
import { RestDocumentProps, RestDocumentsInput } from "@components/input-rest";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { InvoiceStatus } from "../invoice-status";
import { computeCompletion, renderCompletion } from "../invoices-details";

export const InvoiceRestDocument = (
  props: Omit<RestDocumentProps<Invoices>, "entity">
) => {
  return (
    <RestDocumentsInput
      {...(props as RestDocumentProps<Invoices>)}
      entity="invoices"
      render={(invoice) => <RenderInvoiceCard invoice={invoice} />}
    />
  );
};

const RenderInvoiceCard = ({ invoice }: { invoice: Invoices }) => {
  const { contact } = useContact(invoice.client || invoice.supplier || "");
  return (
    <div className="mt-1">
      <div className="line-clamp-1 text-ellipsis">
        {invoice.content?.map((a) => a.name).join(", ")}
      </div>
      <Info className="line-clamp-1 text-ellipsis">
        {[
          invoice?.reference,
          contact ? getContactName(contact) : "",
          invoice?.name,
        ]
          .filter(Boolean)
          .join(", ")}
      </Info>
      <div className="h-6 space-x-2 mt-1">
        <InvoiceStatus
          type={invoice.type}
          value={invoice.state}
          readonly
          size="xs"
        />
        <div className="-space-x-px inline-block">
          <Tag
            className="rounded-r-none"
            data-tooltip={"Lignes en stock"}
            size="xs"
            noColor
            color={renderCompletion(invoice.content)[1]}
          >
            {renderCompletion(invoice.content)[0]}%
          </Tag>
          <Tag
            className="rounded-l-none"
            data-tooltip={"Lignes livrées"}
            size="xs"
            noColor
            color={"gray"}
          >
            -
          </Tag>
        </div>
      </div>
    </div>
  );
};
