import { TagProps } from "@atoms/badge/tag";
import { Invoices } from "@features/invoices/types/types";
import { CurrencyDollarIcon } from "@heroicons/react/20/solid";
import { Badge } from "@radix-ui/themes";
import { twMerge } from "tailwind-merge";
import { usePaymentCompletion } from "../../../../../features/invoices/hooks/use-payment-completion";

export type TagPaymentCompletionProps = {
  size?: "1" | "2";
  invoice: Invoices;
  paymentCompletion?: { value: number; color: string };
} & Omit<TagProps, "children" | "size">;

export const TagPaymentCompletion = ({
  size,
  invoice,
  paymentCompletion,
  ...props
}: TagPaymentCompletionProps) => {
  const fetchedPaymentCompletion = usePaymentCompletion(invoice);
  const realPaymentCompletion = paymentCompletion || fetchedPaymentCompletion;

  return (
    <Badge
      color={realPaymentCompletion.color as any}
      size={size || "2"}
      data-tooltip={props["data-tooltip"] || "% payé"}
    >
      <CurrencyDollarIcon
        className={twMerge(
          "w-4 h-4 shrink-0",
          realPaymentCompletion.color &&
            `text-${realPaymentCompletion.color}-600`
        )}
      />{" "}
      {realPaymentCompletion.value} %
    </Badge>
  );
};
