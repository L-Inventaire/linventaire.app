import { TagProps } from "@atoms/badge/tag";
import { Invoices } from "@features/invoices/types/types";
import { Badge } from "@radix-ui/themes";
import { usePaymentCompletion } from "../../../../../features/invoices/hooks/use-payment-completion";
import { formatAmount } from "../../../../../features/utils/format/strings";

export type TagPaymentCompletionProps = {
  size?: "1" | "2";
  invoice: Invoices;
} & Omit<TagProps, "children" | "size">;

export const TagPaymentCompletion = ({
  size,
  invoice,
  ...props
}: TagPaymentCompletionProps) => {
  const fetchedPaymentCompletion = usePaymentCompletion(invoice);

  return (
    <Badge
      color={fetchedPaymentCompletion.color as any}
      size={size || "2"}
      data-tooltip={props["data-tooltip"] || "% payé"}
    >
      {formatAmount(invoice?.transactions?.total || 0, invoice.currency)} (
      {fetchedPaymentCompletion.value}%)
    </Badge>
  );
};
