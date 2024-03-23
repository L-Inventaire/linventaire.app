import { Base } from "@atoms/text";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/outline";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  size?: "md" | "lg" | "sm";
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
    inputClassName = inputClassName + " ring-2 ring-yellow-500";

  if (props.size === "lg") inputClassName = inputClassName + " text-base h-11";
  else if (props.size === "sm")
    inputClassName = inputClassName + " text-sm h-7 py-0 px-3";
  else inputClassName = inputClassName + " text-sm h-9 py-1";

  return (
    <DatePicker
      wrapperClassName={active ? "z-10" : ""}
      dateFormat={"yyyy-MM-dd"}
      placeholderText={props.placeholder || "YYYY-MM-DD"}
      className={inputClassName + " " + props.className}
      selected={props.value ? new Date(props.value) : null}
      onChange={(date) => props.onChange?.(date)}
      isClearable
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      clearButtonClassName="mr-1"
      calendarClassName="select-none !bg-white dark:!bg-wood-900 shadow border !border-wood-300 dark:!border-wood-700 rounded-lg overflow-hidden "
      renderCustomHeader={(e) => (
        <div className="flex flex-row items-center">
          <div
            className="cursor-pointer hover:text-wood-500 text-black dark:text-white"
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
            className="cursor-pointer hover:text-wood-500 text-black dark:text-white"
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
