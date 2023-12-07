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
    className={defaultInputClassName + " rounded-l-none"}
  />
));

export default function InputPhone(props: {
  disabled?: boolean;
  value: string;
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

  return (
    <PhoneInput
      disabled={props.disabled}
      className={defaultInputClassName + " pl-3"}
      defaultCountry={country as any}
      inputComponent={CustomInput}
      value={props.value}
      onChange={props.onChange}
      placeholder="+11234567890"
    />
  );
}
