import { Stepper } from "@atoms/stepper";
import { Invoices, InvoicesState } from "@features/invoices/types/types";
import { getInvoicesStatusColor, getInvoiceStatusPrettyName } from "../utils";

export const InvoiceStatus = ({
  readonly,
  type,
  value,
  onChange,
  size,
}: {
  readonly?: boolean;
  type: Invoices["type"];
  value: Invoices["state"];
  onChange?: (value: Invoices["state"]) => void;
  size?: "xs" | "sm" | "md" | "md" | "lg";
}) => {
  // Quotes:
  // draft / sent / purchase_order / closed

  // Invoices / Credit notes / Supplier invoices:
  // draft / accounted / partial_paid / paid / closed
  const statusPerTypeGrouped = {
    quotes: [
      ["draft"],
      ["sent"],
      ["purchase_order", "recurring", "closed", "completed"],
    ],
    invoices: [["draft"], ["sent"], ["closed"]],
    credit_notes: [["draft"], ["sent"], ["closed"]],
    supplier_quotes: [
      ["draft"],
      ["sent"],
      ["purchase_order", "closed", "completed"],
    ],
    supplier_invoices: [["draft"], ["sent"], ["closed"]],
    supplier_credit_notes: [["draft"], ["sent"], ["closed"]],
  } as { [key: string]: InvoicesState[][] };

  if (!statusPerTypeGrouped[type]) {
    return null;
  }

  return (
    <Stepper
      value={value}
      onChange={onChange}
      size={size}
      readonly={readonly}
      options={statusPerTypeGrouped[type].map(
        (group) =>
          group.map(
            (status) =>
              ({
                title: getInvoiceStatusPrettyName(status, type),
                color: getInvoicesStatusColor(status, type),
                value: status as string,
              } as any)
          ) as any
      )}
    />
  );
};
