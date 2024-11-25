import { SectionSmall } from "@atoms/text";
import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { twMerge } from "tailwind-merge";
import "./styles.scss";
import _, { max, min } from "lodash";
import { DateTime } from "luxon";
import { timeDecimalToBase60 } from "@features/utils/format/dates";

interface InputProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "size" | "onChange" | "value"
  > {
  label?: string;
  placeholder?: string;
  className?: string;
  hourInputClassName?: string;
  secondsInputClassName?: string;
  value: Date | number[];
  disabled?: boolean;
  onChange?: (value: Date, numberValue: number[]) => void;
}

export function InputTime(props: InputProps) {
  return (
    <>
      {!props.label && <InputTimeMain {...props} />}{" "}
      {!!props.label && (
        <div
          className={twMerge(
            "flex flex-col items-start justify-start",
            props.className
          )}
        >
          <SectionSmall className="mb-1">{props.label}</SectionSmall>
          <InputTimeMain {..._.omit(props, "className")} />{" "}
        </div>
      )}
    </>
  );
}

function InputTimeMain(props: InputProps) {
  const rootClassName = twMerge(
    "flex justify-center items-center h-9 border border-slate-100 rounded-md",
    props.className
  );
  const inputClassName = "border-none w-[4ch] h-8 rounded-md text-sm";

  const _value = _.isArray(props.value)
    ? props.value
    : [
        DateTime.fromJSDate(props.value).hour,
        DateTime.fromJSDate(props.value).minute,
      ];

  const convertValueToText = (value: number[]) => {
    let val1 = value[0].toString();
    let val2 = value[1].toString();
    if (val1.length === 1) {
      val1 = "0" + val1;
    }
    if (val2.length === 1) {
      val2 = "0" + val2;
    }
    return [val1, val2];
  };

  const [textValues, setTextValues] = useState<string[]>(
    convertValueToText(_value)
  );

  useEffect(() => {
    let value1 = parseInt(textValues[0]);
    let value2 = parseInt(textValues[1]);

    if (isNaN(value1) || isNaN(value2)) {
      return;
    }

    value1 = max([0, min([23, value1])]) ?? 0;
    value2 = max([0, min([60, value2])]) ?? 0;

    const date = DateTime.now().setZone("UTC").set({
      hour: value1,
      minute: value2,
      second: 0,
    });

    if (props?.onChange) props?.onChange(date.toJSDate(), [value1, value2]);
  }, [textValues]);

  if (props?.disabled) {
    return <div className={rootClassName}>{_value.join(":")}</div>;
  }

  return (
    <div className={rootClassName}>
      <input
        type="text"
        value={textValues[0]}
        className={twMerge(
          inputClassName,
          "mr-1 text-right pr-1 rounded-r-none",
          _.isNaN(parseInt(textValues[0])) && "text-red-500"
        )}
        onChange={(e) => {
          setTextValues([e.target.value, textValues[1]]);
        }}
      />
      <span className="block mb-[3px]">:</span>
      <input
        type="text"
        value={textValues[1]}
        className={twMerge(
          inputClassName,
          "ml-1 pl-1 rounded-l-none",
          _.isNaN(parseInt(textValues[1])) && "text-red-500"
        )}
        onChange={(e) => {
          setTextValues([textValues[0], e.target.value]);
        }}
      />
    </div>
  );
}

export default InputTime;
