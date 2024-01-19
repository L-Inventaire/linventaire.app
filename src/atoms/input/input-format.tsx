import { formatAmount } from "@features/utils/format/strings";
import _ from "lodash";
import { useCallback, useEffect, useState, useRef } from "react";
import { Input, InputProps } from "./input-text";

export const InputFormat = (
  props: InputProps & { format: "price" | "percentage" | "mail" | "phone" }
) => {
  const [value, setValue] = useState(props.value);
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const extractRawValue = (val: string) => {
    if (!(val + "").trim()) return "";
    return (
      parseFloat(
        val
          .replace(",", ".")
          .replace(/[^0-9.-]/gm, "")
          .replace(/(.)-/gm, "$1")
      ) + ""
    );
  };

  const applyFormat = useCallback(
    (val: string) => {
      if (!(val + "").trim()) return "";
      if (props.format === "percentage") {
        val = parseFloat(val).toFixed(2).toString();
        val = extractRawValue(val) + " %";
      } else if (props.format === "price") {
        val = "" + formatAmount(parseFloat(extractRawValue(val)));
      }
      return val;
    },
    [props.format]
  );

  useEffect(() => {
    if (!isFocused) {
      setValue(applyFormat((props.value as string) + ""));
    }
  }, [isFocused, props.value, applyFormat]);

  return (
    <Input
      {..._.omit(props, "value", "onChange")}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        props.onChange &&
          props.onChange({
            target: { value: extractRawValue(e.target.value) },
          } as any);
      }}
      inputRef={ref}
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus && props.onFocus(e as any);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur && props.onBlur(e as any);
      }}
    />
  );
};
