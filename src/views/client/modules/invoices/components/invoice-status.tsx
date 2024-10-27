import { Stepper } from "@atoms/stepper";
import { Invoices } from "@features/invoices/types/types";

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

  const statusName = {
    draft: "Brouillon",
    sent:
      type === "quotes" || type === "invoices" || type === "credit_notes"
        ? "Envoyé"
        : "Demandé",
    accounted: "Comptabilisé",
    purchase_order: type === "quotes" ? "Accepté" : "Commandé",
    partial_paid: "Paiment partiel",
    paid: "Payé",
    closed: "Fermé",
    completed: "À facturer",
  };

  const statusColor = {
    draft: "gray",
    sent:
      type === "quotes" || type === "invoices" || type === "credit_notes"
        ? "blue"
        : "red",
    accounted: "blue",
    purchase_order: "orange",
    partial_paid: "orange",
    paid: "green",
    closed: "red",
    completed: "green",
    signed: "green",
  };

  const statusPerTypeGrouped = {
    quotes: [["draft"], ["sent"], ["purchase_order", "closed", "completed"]],
    invoices: [["draft"], ["sent"], ["closed"]],
    credit_notes: [["draft"], ["sent"], ["closed"]],
    supplier_quotes: [
      ["draft"],
      ["sent"],
      ["purchase_order", "closed", "completed"],
    ],
    supplier_invoices: [["draft"], ["sent"], ["closed"]],
    supplier_credit_notes: [["draft"], ["sent"], ["closed"]],
  };

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
                title: (statusName as any)[status],
                color: (statusColor as any)[status],
                value: status,
              } as any)
          ) as any
      )}
    />
  );
};
