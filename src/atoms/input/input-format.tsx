import {
  formatAmount,
  normalizeStringToKey,
} from "@features/utils/format/strings";
import _ from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input, InputProps } from "./input-text";

export const InputFormat = (
  props: InputProps & {
    format: "price" | "percentage" | "mail" | "phone" | "iban" | "code";
  }
) => {
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const needUnfocus = props.format === "price" || props.format === "percentage";
  const isNumber = props.format === "price" || props.format === "percentage";

  const extractRawValue = (val: string) => {
    if (!(val + "").trim()) return "";
    if (props.format === "iban")
      return val.toLocaleUpperCase().replace(/[^A-Z0-9]/gm, "");
    if (isNumber && typeof val === "string")
      return (
        parseFloat(
          (val || "0")
            .replace(",", ".")
            .replace(/[^0-9.-]/gm, "")
            .replace(/(.)-/gm, "$1")
        ) + ""
      );
    return val;
  };

  const applyFormat = useCallback(
    (val: string) => {
      if (!(val + "").trim()) return "";
      if (props.format === "percentage") {
        val = parseFloat(val).toFixed(2).toString();
        val = extractRawValue(val) + " %";
      } else if (props.format === "code") {
        val = normalizeStringToKey(val);
      } else if (props.format === "price") {
        val = "" + formatAmount(parseFloat(extractRawValue(val)));
      } else if (props.format === "iban") {
        val =
          "" +
          val
            .toLocaleUpperCase()
            .replace(/[^A-Z0-9]/, "")
            .replace(/([A-Z0-9]{4})/g, "$1 ")
            .replace(/ $/, "");
      } else if (props.format === "phone") {
        val = val.replace(/[^0-9+]/gm, "");
      } else if (props.format === "mail") {
        val = val.replace(/[^a-zA-Z0-9@.-_]/gm, "");
      }
      return val;
    },
    [props.format]
  );

  const [value, setValue] = useState(applyFormat(props.value as string));

  useEffect(() => {
    if (!isFocused || !needUnfocus) {
      setValue(applyFormat((props.value as string) + ""));
    }
  }, [isFocused, props.value, applyFormat]);

  return (
    <Input
      {..._.omit(props, "value", "onChange")}
      value={value}
      onChange={(e) => {
        setValue(applyFormat(e.target.value));
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
