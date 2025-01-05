import { Info } from "@atoms/text";
import { RestDocumentProps, RestDocumentsInput } from "@components/input-rest";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { InvoiceStatus } from "../../invoice-status";
import { CompletionTags } from "../components/completion-tags";
import { TagPaymentCompletion } from "../../tag-payment-completion";
import { Skeleton } from "@radix-ui/themes";

export const InvoiceRestDocument = (
  props: Omit<RestDocumentProps<Invoices>, "entity">
) => {
  const size = props.size || "lg";
  return (
    <RestDocumentsInput
      {...(props as RestDocumentProps<Invoices>)}
      entity="invoices"
      render={(invoice) => <RenderInvoiceCard invoice={invoice} size={size} />}
      renderEmpty={() => (
        <div className="whitespace-normal min-w-32 animate-pulse opacity-75 space-y-1 py-2">
          <div className="line-clamp-1 text-ellipsis items-center flex space-x-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-20 h-3 rounded-md" />
          </div>
          {size === "lg" && <Skeleton className="w-32 h-3 rounded-md" />}
          {(size === "md" || size === "lg") && (
            <Skeleton className="w-20 h-3 rounded-md" />
          )}
        </div>
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
  size = size === "xl" ? "lg" : size;
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
        <Info className="line-clamp-1 text-ellipsis -my-px">
          {invoice.content?.map((a) => a.name).join(", ")}
        </Info>
      )}
      {(size === "lg" || size === "md") && (
        <div className="h-6 whitespace-nowrap flex">
          <InvoiceStatus
            type={invoice.type}
            value={invoice.state}
            readonly
            size="xs"
          />
          <div className="grow" />
          <div className="">
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
