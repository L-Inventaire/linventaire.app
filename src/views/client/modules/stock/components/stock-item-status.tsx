import { Button } from "@atoms/button/button";
import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import { Stepper } from "@atoms/stepper";
import { Base, Info } from "@atoms/text";
import { StockItems } from "@features/stock/types/types";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";

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
  size?: "sm" | "md" | "md" | "lg";
}) => {
  const statusName = {
    bought: "Commandé",
    stock: "En stock",
    reserved: "Réservé",
    in_transit: "En transit",
    delivered: "Livré",
    depleted: "Épuisé",
  };

  const statusColor = {
    bought: "gray",
    stock: "blue",
    reserved: "red",
    in_transit: "orange",
    delivered: "green",
    depleted: "gray",
  };

  const status = [
    "bought",
    "stock",
    "reserved",
    "in_transit",
    "delivered",
    "depleted",
  ];

  const statusGrouped = [
    ["stock", "bought"],
    ["reserved", "in_transit"],
    ["delivered", "depleted"],
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
