import { Stepper } from "@atoms/stepper";
import { StockItems } from "@features/stock/types/types";

export const StockItemStatus = ({
  readonly,
  value,
  onChange,
  size,
}: {
  readonly?: boolean;
  // "bought" | "stock" | "reserved" | "in_transit" | "delivered"
  value: StockItems["state"];
  onChange?: (value: StockItems["state"]) => void;
  size?: "xs" | "sm" | "md" | "md" | "lg";
}) => {
  const statusName = {
    stock: "En stock",
    in_transit: "En transit",
    delivered: "Livré",
    depleted: "Épuisé",
  };

  const statusColor = {
    stock: "blue",
    in_transit: "orange",
    delivered: "green",
    depleted: "red",
  };

  const statusGrouped = [["stock"], ["in_transit"], ["delivered", "depleted"]];

  return (
    <Stepper
      value={value}
      onChange={onChange}
      size={size}
      readonly={readonly}
      options={statusGrouped.map(
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
