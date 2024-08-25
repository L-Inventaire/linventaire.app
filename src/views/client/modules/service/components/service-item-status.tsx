import { Stepper } from "@atoms/stepper";
import { ServiceItems } from "@features/service/types/types";

export const ServiceItemStatus = ({
  readonly,
  value,
  onChange,
  size,
}: {
  readonly?: boolean;
  // "bought" | "stock" | "reserved" | "in_transit" | "delivered"
  value: ServiceItems["state"];
  onChange?: (value: ServiceItems["state"]) => void;
  size?: "sm" | "md" | "md" | "lg";
}) => {
  const statusName = {
    backlog: "Backlog",
    todo: "À faire",
    in_progress: "En cours",
    in_review: "En revue",
    done: "Terminé",
    cancelled: "Annulé",
  };

  const statusColor = {
    backlog: "gray",
    todo: "red",
    in_progress: "orange",
    in_review: "blue",
    done: "green",
    cancelled: "gray",
  };

  const statusGrouped = [
    ["backlog", "todo"],
    ["in_progress", "in_review"],
    ["done", "cancelled"],
  ];

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
