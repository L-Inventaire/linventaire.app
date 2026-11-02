import React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useCurrentClient } from "@features/clients/state/use-clients";
import { getDefaultCountry } from "@features/utils/location";
import { defaultInputClassName } from "./input-text";
import { twMerge } from "tailwind-merge";

const CustomInput = React.forwardRef((props: any, ref) => (
  <input
    {...props}
    ref={ref}
    style={{ boxShadow: "none", border: "0px !important" }}
    className={
      defaultInputClassName() +
      " rounded-l-none ring-transparent border-transparent focus:border-transparent shadow-none focus:shadow-none border-none"
    }
  />
));

export default function InputPhone(props: {
  disabled?: boolean;
  readonly?: boolean;
  value: string;
  size?: "sm" | "md" | "md" | "lg";
  onChange?: (phone: string | undefined) => void;
}) {
  const { client } = useCurrentClient();
  const country = getDefaultCountry(client?.address?.country);

  let inputClassName = defaultInputClassName();
  if (props.size === "lg") inputClassName = inputClassName + " h-11";
  else if (props.size === "md") inputClassName = inputClassName + " h-7";
  else inputClassName = inputClassName + " h-9";

  return (
    <PhoneInput
      disabled={props.disabled || props.readonly}
      className={twMerge(
        inputClassName,
        "shadow-sm rounded-md border overflow-hidden pl-3",
        props.disabled ? "opacity-50" : "",
        props.readonly ? "PhoneReadonly border-none shadow-none pl-0" : "",
      )}
      defaultCountry={country as any}
      inputComponent={CustomInput}
      value={props.value}
      onChange={props.onChange || (() => null)}
      placeholder="+11234567890"
    />
  );
}
