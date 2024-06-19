import { Button } from "@atoms/button/button";
import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
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
  size?: "xs" | "sm" | "md" | "lg";
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

  const setMenu = useSetRecoilState(DropDownAtom);

  useEffect(() => {
    if (readonly) return;
    const defStatus = status[0] || "bought";
    if (!status.includes(value) && value !== defStatus) {
      onChange && onChange(defStatus as any);
    }
  }, [value]);

  if (!status.includes(value)) return <></>;

  return (
    <Button
      className="rounded-full"
      data-tooltip={readonly ? statusName[value] : "Modifier le status" || "-"}
      theme="default"
      size={size === "xs" ? "xs" : "sm"}
      shortcut={["u"]}
      onClick={
        !readonly
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenu({
                target: e.currentTarget as any,
                position: "bottom",
                menu: status.map((a: any) => ({
                  icon: (p) => (
                    <div
                      className={twMerge(
                        p.className,
                        "rounded-full w-2.5 h-2.5",
                        `bg-${(statusColor as any)[a]}-500`
                      )}
                    />
                  ),
                  label: (statusName as any)[a] || "",
                  onClick: () => onChange && onChange(a),
                })) as DropDownMenuType,
              });
            }
          : undefined
      }
    >
      <div className="flex items-center space-x-2">
        {statusGrouped.map((group, i) => (
          <>
            {i !== 0 && size === "lg" && (
              <ChevronRightIcon className="w-3 h-3 ml-1 text-gray-400" />
            )}
            {group.includes(value) && (
              <>
                <div
                  className={twMerge(
                    "rounded-full w-2.5 h-2.5 inline-block",
                    `bg-${(statusColor as any)[value]}-500`
                  )}
                />
                <Base className="block !ml-1.5">
                  {statusName[value] || "-"}
                </Base>
              </>
            )}
            {!group.includes(value) && size === "lg" && (
              <>
                <Info>{(statusName as any)[group[0]] || "-"}</Info>
              </>
            )}
          </>
        ))}
        {!readonly && ["sm", "xs", "md"].includes(size || "sm") && (
          <ChevronDownIcon className="w-3 h-3 ml-1 text-gray-400" />
        )}
      </div>
    </Button>
  );
};
