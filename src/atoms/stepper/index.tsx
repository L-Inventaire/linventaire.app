import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import { Base, Info } from "@atoms/text";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { Badge, Button } from "@radix-ui/themes";
import { Fragment, useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";

export const Stepper = <T extends string>({
  readonly,
  options,
  value,
  onChange,
  size,
}: {
  readonly?: boolean;
  options: { title: string; color: string; value: T }[][];
  value: T;
  onChange?: (value: T) => void;
  size?: "xs" | "sm" | "md" | "md" | "lg";
}) => {
  const statusGrouped = options.map((a) => a.map((b) => b.value));
  const status = statusGrouped.flat().map((a) => a);
  const statusName: { [key: string]: string } = {};
  const statusColor: { [key: string]: string } = {};
  options.forEach((group) => {
    group.forEach((option) => {
      statusName[option.value] = option.title;
      statusColor[option.value] = option.color;
    });
  });

  const setMenu = useSetRecoilState(DropDownAtom);

  useEffect(() => {
    if (readonly) return;
    const defStatus = status[0];
    if (!status.includes(value) && value !== defStatus) {
      onChange && onChange(defStatus as any);
    }
  }, [value]);

  if (!status.includes(value)) return <></>;

  if (size === "xs") {
    return (
      <Badge color={(statusColor as any)[value]} size={"1"}>
        {statusName[value] || "-"}
      </Badge>
    );
  }

  return (
    <Button
      className={twMerge("w-max", readonly ? "pointer-events-none " : "")}
      data-tooltip={readonly ? statusName[value] : "Modifier le status"}
      variant="outline"
      size={size === "sm" ? "1" : "2"}
      onClick={
        !readonly
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenu({
                target: e.currentTarget as any,
                position: "bottom",
                menu: async () =>
                  status.map((a: any) => ({
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
          <Fragment key={i}>
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
          </Fragment>
        ))}
        {!readonly && ["md", "sm", "md"].includes(size || "md") && (
          <ChevronDownIcon className="w-3 h-3 ml-1 text-gray-400" />
        )}
      </div>
    </Button>
  );
};
