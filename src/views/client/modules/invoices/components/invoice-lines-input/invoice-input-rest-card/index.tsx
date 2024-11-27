import { Info } from "@atoms/text";
import { RestDocumentProps, RestDocumentsInput } from "@components/input-rest";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { InvoiceStatus } from "../../invoice-status";
import { CompletionTags } from "../components/completion-tags";
import { TagPaymentCompletion } from "../../tag-payment-completion";

export const InvoiceRestDocument = (
  props: Omit<RestDocumentProps<Invoices>, "entity">
) => {
  return (
    <RestDocumentsInput
      {...(props as RestDocumentProps<Invoices>)}
      entity="invoices"
      render={(invoice) => (
        <RenderInvoiceCard invoice={invoice} size={props.size || "lg"} />
      )}
    />
  );
};

const RenderInvoiceCard = ({
  invoice,
  size,
}: {
  invoice: Invoices;
  size: RestDocumentProps<Invoices>["size"];
}) => {
  const { contact } = useContact(invoice.client || invoice.supplier || "");
  const isQuote =
    invoice.type === "quotes" || invoice.type === "supplier_quotes";
  return (
    <div className="whitespace-normal">
      <div className="line-clamp-1 text-ellipsis">
        {[
          invoice?.reference,
          contact ? getContactName(contact) : "",
          invoice?.name,
        ]
          .filter(Boolean)
          .join(", ")}
      </div>
      {size === "lg" && (
        <Info className="line-clamp-1 text-ellipsis">
          {invoice.content?.map((a) => a.name).join(", ")}
        </Info>
      )}
      {(size === "lg" || size === "md") && (
        <div className="h-6">
          <InvoiceStatus
            type={invoice.type}
            value={invoice.state}
            readonly
            size="xs"
          />
          <div className="float-right">
            {isQuote && (
              <CompletionTags short invoice={invoice} lines={invoice.content} />
            )}
            {!isQuote && <TagPaymentCompletion invoice={invoice} size="1" />}
          </div>
        </div>
      )}
    </div>
  );
};
