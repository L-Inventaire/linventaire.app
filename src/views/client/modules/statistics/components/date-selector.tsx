import InputDate from "@atoms/input/input-date";
import { Dispatch, SetStateAction } from "react";

type DateSelectorProps = {
  startDate: Date;
  endDate: Date;
  setStartDate: Dispatch<SetStateAction<Date>>;
  setEndDate: Dispatch<SetStateAction<Date>>;
};

export const DateSelector = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: DateSelectorProps) => {
  return (
    <div className="flex">
      <InputDate
        size="md"
        className="shrink-0 w-32"
        value={startDate}
        onChange={(date) => {
          setStartDate(date ?? new Date());
        }}
      />
      <InputDate
        size="md"
        className="shrink-0 w-32"
        value={endDate}
        onChange={(date) => {
          setEndDate(date ?? new Date());
        }}
      />
    </div>
  );
};
