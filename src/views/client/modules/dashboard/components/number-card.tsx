import { Info } from "@atoms/text";
import { Heading } from "@radix-ui/themes";
import React from "react";
import { twMerge } from "tailwind-merge";
import DashboardCard from "./card";
type NumberCardProps = {
  title: string;
  number: number;
  totalNumber?: number;
  icon?: (p: any) => React.ReactNode;
} & React.ComponentProps<"div">;

const NumberCard = ({
  title,
  number,
  totalNumber,
  icon,
  ...props
}: NumberCardProps) => {
  return (
    <DashboardCard
      icon={icon}
      title={title}
      className={twMerge("flex flex-col justify-between", props.className)}
      {...props}
    >
      <div className="flex flex-col">
        <Heading size="7" className="text-blue-600">
          {number}
        </Heading>
        {totalNumber && <Info>sur {totalNumber}</Info>}
      </div>
    </DashboardCard>
  );
};

export default NumberCard;
