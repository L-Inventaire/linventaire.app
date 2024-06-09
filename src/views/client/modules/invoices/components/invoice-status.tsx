import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import { Base, Info } from "@atoms/text";
import { Invoices } from "@features/invoices/types/types";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";

export const InvoiceStatus = ({
  readonly,
  type,
  value,
  onChange,
  size,
}: {
  readonly?: boolean;
  type: "invoices" | "quotes" | "credit_notes";
  value: Invoices["state"];
  onChange?: (value: Invoices["state"]) => void;
  size?: "xs" | "sm" | "md" | "lg";
}) => {
  // Quotes:
  // draft / sent / purchase_order / closed

  // Invoices / Credit notes:
  // draft / accounted / partial_paid / paid / closed

  const statusName = {
    draft: "Brouillon",
    sent: "Envoyé",
    accounted: "Comptabilisé",
    purchase_order: "Bon de commande",
    partial_paid: "Paiment partiel",
    paid: "Payé",
    closed: "Fermé",
  };

  const statusColor = {
    draft: "gray",
    sent: "blue",
    accounted: "blue",
    purchase_order: "green",
    partial_paid: "orange",
    paid: "green",
    closed: "red",
  };

  const statusPerType = {
    quotes: ["draft", "sent", "purchase_order", "closed"],
    invoices: ["draft", "accounted", "partial_paid", "paid", "closed"],
    credit_notes: ["draft", "accounted", "partial_paid", "paid", "closed"],
  };

  const statusPerTypeGrouped = {
    quotes: [["draft"], ["sent"], ["purchase_order", "closed"]],
    invoices: [["draft"], ["accounted"], ["paid", "partial_paid", "closed"]],
    credit_notes: [
      ["draft"],
      ["accounted"],
      ["paid", "partial_paid", "closed"],
    ],
  };

  const setMenu = useSetRecoilState(DropDownAtom);

  if (!statusPerType[type]?.includes(value)) return <></>;

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
                menu: statusPerType[type].map((a: any) => ({
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
        {statusPerTypeGrouped[type].map((group, i) => (
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
