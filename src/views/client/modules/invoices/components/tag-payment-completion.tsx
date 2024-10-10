import { Tag, TagProps } from "@atoms/badge/tag";
import { CurrencyDollarIcon } from "@heroicons/react/20/solid";
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import { usePaymentCompletion } from "../hooks/use-payment-completion";
import { Invoices } from "@features/invoices/types/types";
import { Badge } from "@radix-ui/themes";

export type TagPaymentCompletionProps = {
  invoice: Invoices;
  paymentCompletion?: { value: number; color: string };
} & Omit<TagProps, "children">;

export const TagPaymentCompletion = ({
  invoice,
  paymentCompletion,
  ...props
}: TagPaymentCompletionProps) => {
  const fetchedPaymentCompletion = usePaymentCompletion(invoice);
  const realPaymentCompletion = paymentCompletion || fetchedPaymentCompletion;

  return (
    <Badge
      color={realPaymentCompletion.color as any}
      size={"2"}
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
