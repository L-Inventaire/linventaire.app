import React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import countries from "@assets/countries.json";
import { getCountryFromTimezone } from "@features/utils/location";
import { defaultInputClassName } from "./input-text";

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
  value: string;
  size: "sm" | "md" | "lg";
  onChange: (phone: string) => void;
}) {
  const countryHint =
    getCountryFromTimezone() ||
    ((window as any).navigator.language.toLocaleUpperCase() as string).slice(
      0,
      2
    ) ||
    "US";
  const country = (
    countries.find((c: any) => c.code === countryHint) || countries[0]
  )?.code;

  let inputClassName = defaultInputClassName();
  if (props.size === "lg") inputClassName = inputClassName + " h-11";
  else if (props.size === "sm") inputClassName = inputClassName + " h-7";
  else inputClassName = inputClassName + " h-9";

  return (
    <PhoneInput
      disabled={props.disabled}
      className={
        inputClassName +
        " shadow-sm bg-white rounded-md border overflow-hidden pl-3"
      }
      defaultCountry={country as any}
      inputComponent={CustomInput}
      value={props.value}
      onChange={props.onChange}
      placeholder="+11234567890"
    />
  );
}
