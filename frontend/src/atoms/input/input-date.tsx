import { Base } from "@atoms/text";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { twMerge } from "tailwind-merge";
import { defaultInputClassName, errorInputClassName } from "./input-text";
import "./styles.scss";

interface InputProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "size" | "onChange" | "value"
  > {
  placeholder?: string;
  highlight?: boolean;
  theme?: "plain";
  hasError?: boolean;
  size?: "md" | "lg" | "md" | "sm";
  className?: string;
  children?: React.ReactNode;
  value?: string | Date | null;
  onChange?: (e: Date | null) => void;
}

export function InputDate(props: InputProps) {
  const [active, setActive] = useState(false);

  let inputClassName = props.hasError
    ? errorInputClassName(props.theme)
    : defaultInputClassName(props.theme);
  inputClassName = inputClassName + (props.disabled ? " opacity-50" : "");

  if (props.highlight && props.value)
    inputClassName = inputClassName + " ring ring-yellow-500";

  if (props.size === "lg") inputClassName = inputClassName + " text-base h-11";
  else if (props.size === "md")
    inputClassName = inputClassName + " text-sm h-7 py-0 px-3";
  else inputClassName = inputClassName + " text-sm h-9 py-1";

  const getDateValue = () => {
    if (!props.value) return null;

    try {
      const date = new Date(props.value);
      if (_.isNaN(date.getTime())) return null;

      return date;
    } catch (e: any) {
      return null;
    }
  };

  return (
    <DatePicker
      wrapperClassName={twMerge(active ? "z-10" : "", props.className)}
      dateFormat={"yyyy-MM-dd"}
      placeholderText={props.placeholder || "YYYY-MM-DD"}
      className={twMerge(inputClassName, props.className)}
      selected={getDateValue()}
      onChange={(date) => {
        props.onChange?.(date);
      }}
      isClearable
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      clearButtonClassName="mr-1"
      calendarClassName="select-none !bg-white dark:!bg-slate-900 shadow border !border-slate-300 dark:!border-slate-700 rounded-lg overflow-hidden "
      renderCustomHeader={(e) => (
        <div className="flex flex-row items-center">
          <div
            className="cursor-pointer hover:text-slate-500 text-black dark:text-white"
            onClick={e.decreaseMonth}
          >
            <ArrowLeftIcon className="h-4 w-4 mx-3" />
          </div>
          <Base className="block grow">
            {
              [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ][new Date(e.monthDate).getMonth()]
            }{" "}
            {new Date(e.monthDate).getFullYear()}
          </Base>
          <div
            className="cursor-pointer hover:text-slate-500 text-black dark:text-white"
            onClick={e.increaseMonth}
          >
            <ArrowRightIcon className="h-4 w-4 mx-3" />
          </div>
        </div>
      )}
    />
  );
}

export default InputDate;
