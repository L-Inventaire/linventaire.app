import { Tag, TagProps } from "@atoms/badge/tag";
import { CurrencyDollarIcon } from "@heroicons/react/20/solid";
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import { usePaymentCompletion } from "../hooks/use-payment-completion";
import { Invoices } from "@features/invoices/types/types";

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
    <Tag
      className={twMerge(
        "rounded-lg ml-1",
        realPaymentCompletion.color &&
          `text-${realPaymentCompletion.color}-600`,
        props.className
      )}
      noColor
      size={props.size || "md"}
      data-tooltip={props["data-tooltip"] || "Facturé %"}
      icon={
        <CurrencyDollarIcon
          className={twMerge(
            "w-4 h-4 mr-1 shrink-0",
            realPaymentCompletion.color &&
              `text-${realPaymentCompletion.color}-600`
          )}
        />
      }
      {..._.omit(
        props,
        "children",
        "className",
        "size",
        "icon",
        "data-tooltip"
      )}
    >
      {realPaymentCompletion.value} %
    </Tag>
  );
};
