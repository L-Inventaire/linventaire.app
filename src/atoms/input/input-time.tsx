import { FormInput } from "@components/form/fields";
import { FormContextContext } from "@components/form/formcontext";
import { prettyPrintTime } from "@features/utils/format/dates";
import _, { max, min } from "lodash";
import { DateTime } from "luxon";
import { useContext, useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { twMerge } from "tailwind-merge";
import { InputLabel } from "./input-decoration-label";
import "./styles.scss";

interface InputProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "size" | "onChange" | "value"
  > {
  size?: "sm" | "lg";
  label?: string;
  labelProps?: React.HTMLAttributes<HTMLLabelElement>;
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
        <InputLabel
          label={props.label}
          input={<InputTimeMain {..._.omit(props, "className")} />}
        />
      )}
    </>
  );
}

function InputTimeMain(props: InputProps) {
  const rootClassName = twMerge(
    "flex justify-center items-center h-9 border border-slate-100 rounded-md",
    props.className
  );

  const formContext = useContext(FormContextContext);
  const disabled =
    props.disabled || formContext.disabled || formContext.readonly || false;

  const _value = _.isArray(props.value)
    ? props.value
    : [
        DateTime.fromJSDate(props.value).hour,
        DateTime.fromJSDate(props.value).minute,
      ];

  const convertValueToText = (value: number[]) => {
    let val1 = value[0].toString();
    let val2 = value[1].toString();
    if (val2.length === 1) {
      val2 = "0" + val2;
    }
    return [val1, val2];
  };

  const [textValues, setTextValues] = useState<string[]>(
    convertValueToText(_value)
  );

  useEffect(() => {
    setTextValues(convertValueToText(_value));
  }, [_value]);

  const onChangeTextValues = (textValues: string[]) => {
    let value1 = parseInt(textValues[0]);
    let value2 = parseInt(textValues[1]);

    if (isNaN(value1) || isNaN(value2)) {
      return;
    }

    value1 = max([0, value1]) ?? 0;
    value2 = max([0, min([60, value2])]) ?? 0;

    const date = DateTime.now().setZone("UTC").set({
      hour: value1,
      minute: value2,
      second: 0,
    });

    if (props?.onChange) props?.onChange(date.toJSDate(), [value1, value2]);
  };

  if (disabled) {
    return (
      <div className={twMerge(rootClassName, "px-3")}>
        {prettyPrintTime(_value)}
      </div>
    );
  }

  return (
    <div className={"flex relative w-32"}>
      <FormInput
        autoSelectAll
        size={props.size}
        type="text"
        value={textValues[0]}
        className="w-16"
        inputClassName={twMerge(
          "!min-w-0 max-w-none! w-16 rounded-r-none border-r-0",
          _.isNaN(parseInt(textValues[0])) && "text-red-500"
        )}
        onChange={(value) => {
          setTextValues([value, textValues[1]]);
          onChangeTextValues([value, textValues[1]]);
        }}
      />
      <FormInput
        autoSelectAll
        size={props.size}
        type="text"
        value={textValues[1]}
        className="w-16"
        inputClassName={twMerge(
          "!min-w-0 max-w-none! w-16 rounded-l-none border-l-0",
          _.isNaN(parseInt(textValues[1])) && "text-red-500"
        )}
        onChange={(value) => {
          setTextValues([textValues[0], value]);
          onChangeTextValues([textValues[0], value]);
        }}
      />
      <div className="pointer-events-none z-10 absolute w-2 w-full h-full top-0 left-0 items-center justify-center flex">
        <span className="-mt-1">:</span>
      </div>
    </div>
  );
}

export default InputTime;
