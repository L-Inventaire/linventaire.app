import { Section } from "@atoms/text";
import { Text } from "@radix-ui/themes";
import _ from "lodash";
import React from "react";
import { twMerge } from "tailwind-merge";

type DashboardCardProps = {
  title?: string;
  icon?: (p: any) => React.ReactNode;
} & React.ComponentProps<"div">;

const DashboardCard = ({
  title,
  icon,
  children,
  ...props
}: DashboardCardProps) => {
  return (
    <div
      className={twMerge(
        "min-w-28 min-h-32 bg-slate-25 dark:bg-slate-800 rounded-md p-3 px-4",
        props.className
      )}
      {..._.omit(props, "className")}
    >
      {(title || icon) && (
        <Text size="4" className="flex w-full justify-between items-center">
          {title && <Section className="font-normal m-0">{title}</Section>}
          {icon &&
            icon({
              className: "h-4 w-4 opacity-80 shrink-0",
            })}
        </Text>
      )}

      {children}
    </div>
  );
};

export default DashboardCard;
