import { Info } from "@atoms/text";
import { RestDocumentProps, RestDocumentsInput } from "@components/input-rest";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { Skeleton } from "@radix-ui/themes";
import { InvoiceStatus } from "../../invoice-status";
import { TagPaymentCompletion } from "../../tag-payment-completion";
import { CompletionTags } from "../components/completion-tags";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";

export const InvoiceRestDocument = (
  props: Omit<RestDocumentProps<Invoices>, "entity">
) => {
  const size = props.size || "lg";
  return (
    <RestDocumentsInput
      key={props.value?.[0]}
      {...(props as RestDocumentProps<Invoices>)}
      entity="invoices"
      render={(_, invoices) => (
        <RenderInvoiceCard invoices={invoices || []} size={size} />
      )}
      renderEmpty={
        props.value?.length
          ? () => (
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
            )
          : undefined
      }
    />
  );
};

const RenderInvoiceCard = ({
  invoices,
  size,
}: {
  invoices: Invoices[];
  size: RestDocumentProps<Invoices>["size"];
}) => {
  const invoice = invoices?.[0];
  size = size === "xl" ? "lg" : size;
  const { contacts } = useContacts({
    query: buildQueryFromMap({
      id: [
        ...(invoices?.map?.((a) => a.client) || []),
        ...(invoices?.map?.((a) => a.supplier) || []),
      ].filter(Boolean),
    }),
  });
  const isQuote =
    invoice.type === "quotes" || invoice.type === "supplier_quotes";
  return (
    <div className="whitespace-normal">
      {invoices?.map((invoice) => (
        <div className="line-clamp-1 text-ellipsis" key={invoice.id}>
          {[
            invoice?.reference,
            getContactName(
              (contacts?.data?.list || [])?.find(
                (a) => a.id === invoice.client || a.id === invoice.supplier
              ) || {}
            ),
            invoice?.name,
          ]
            .filter(Boolean)
            .join(", ")}
        </div>
      ))}
      {invoices.length === 1 && size === "lg" && (
        <Info className="line-clamp-1 text-ellipsis -my-px">
          {invoice.content?.map((a) => a.name).join(", ")}
        </Info>
      )}
      {invoices.length === 1 && (size === "lg" || size === "md") && (
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
