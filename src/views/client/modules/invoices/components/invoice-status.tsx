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
    sent: type === "quotes" ? "Envoyé" : "Demande au fournisseur",
    accounted: "Comptabilisé",
    purchase_order: type === "quotes" ? "Bon de commande" : "Commandé",
    partial_paid: "Paiment partiel",
    paid: "Payé",
    closed: "Fermé",
    completed: "Complété",
  };

  const statusColor = {
    draft: "gray",
    sent: "blue",
    accounted: "blue",
    purchase_order: "orange",
    partial_paid: "orange",
    paid: "green",
    closed: "red",
    completed: "green",
  };

  const statusPerTypeGrouped = {
    quotes: [["draft"], ["sent"], ["purchase_order", "closed", "completed"]],
    invoices: [["draft"], ["accounted"], ["paid", "partial_paid", "closed"]],
    credit_notes: [
      ["draft"],
      ["accounted"],
      ["paid", "partial_paid", "closed"],
    ],
    supplier_quotes: [
      ["draft"],
      ["sent"],
      ["purchase_order", "closed", "completed"],
    ],
    supplier_invoices: [
      ["draft"],
      ["accounted"],
      ["paid", "partial_paid", "closed"],
    ],
    supplier_credit_notes: [
      ["draft"],
      ["accounted"],
      ["paid", "partial_paid", "closed"],
    ],
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
