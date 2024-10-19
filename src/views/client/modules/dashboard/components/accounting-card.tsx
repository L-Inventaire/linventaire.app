import { Base, Info, Title } from "@atoms/text";
import { useStatistics } from "@features/statistics/hooks";
import { formatAmount } from "@features/utils/format/strings";
import React from "react";
import { useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import DashboardCard from "./card";
type AccountingCardProps = {} & React.ComponentProps<"div">;

const AccountingCard = ({ ...props }: AccountingCardProps) => {
  const { client: clientId } = useParams();
  const statistics = useStatistics(clientId);

  return (
    <DashboardCard
      title="Bénéfices"
      {...props}
      className={twMerge("flex flex-col justify-between", props.className)}
    >
      <div className="flex flex-col">
        <div className="flex flex-col w-full items-end mt-3">
          <Title className="text-green-600">
            {formatAmount(statistics.totalRevenue ?? 0)}
          </Title>
          <Info>sur 1.500.305€</Info>
        </div>
        <Base className="-mt-1 -mb-1 text-gray-500">-</Base>
        <div className="flex flex-col w-full items-end">
          <Title className="text-red-600">
            {formatAmount(statistics.totalExpenses ?? 0)}
          </Title>
          <Info>sur 1.500.305€</Info>
        </div>
      </div>

      <hr className="border-gray-200 my-3 -mb-6 lg:-mb-12" />

      <div className="flex w-full items-center justify-between h-1/3">
        <Base className="text-gray-500">=</Base>
        <div className="flex flex-col items-end h-1/3">
          <Title className="">{formatAmount(statistics.benefits ?? 0)}</Title>
          <Info>sur 1.500.305€</Info>
        </div>
      </div>
    </DashboardCard>
  );
};

export default AccountingCard;
