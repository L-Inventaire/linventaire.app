import countries from "@assets/countries.json";
import { Input } from "@atoms/input/input-text";
import Select from "@atoms/select";
import { Clients } from "@features/clients/types/clients";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { useState } from "react";

export const AddressInput = (props: {
  value?: Partial<Clients["address"]>;
  onChange?: (args: Partial<Clients["address"]>) => void;
  disabled?: boolean;
}) => {
  const [addressLine1, setAddressLine1] = useState(
    props.value?.address_line_1 || ""
  );
  const [addressLine2, setAddressLine2] = useState(
    props.value?.address_line_2 || ""
  );
  const [zip, setZip] = useState(props.value?.zip || "");
  const [city, setCity] = useState(props.value?.city || "");
  const [region, setRegion] = useState(props.value?.region || "");
  const [country, setCountry] = useState(
    props.value?.country || navigator.language.toLocaleUpperCase() || "US"
  );

  useControlledEffect(() => {
    props.onChange?.({
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      zip,
      city,
      region,
      country,
    });
  }, [addressLine1, addressLine2, zip, city, region, country]);

  return (
    <>
      <Input
        label="Address"
        inputComponent={
          <>
            <Input
              id="address-line-1"
              placeholder="1007 Mountain Drive"
              autoComplete="street-address"
              inputClassName="relative rounded-none rounded-t-md focus:z-10 "
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              disabled={props.disabled}
            />
            <Input
              style={{ marginTop: -1 }}
              id="address-line-2"
              placeholder={addressLine1 ? "Address line 2" : "Wayne's manor"}
              inputClassName="relative rounded-none rounded-b-md focus:z-10"
              autoComplete="address-level-4"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              disabled={props.disabled}
            />
          </>
        }
      />
      <br />

      <Input
        label="Region and city"
        inputComponent={
          <>
            <Input
              style={{ marginTop: -1 }}
              placeholder="Region"
              autoComplete="address-level1"
              inputClassName="relative rounded-none rounded-t-md focus:z-10"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={props.disabled}
            />
            <div
              className="flex -space-x-px bg-white block relative"
              style={{ marginTop: "-1px" }}
            >
              <Input
                placeholder="ZIP"
                autoComplete="postal-code"
                inputClassName="rounded-none rounded-bl-md focus:z-10"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                disabled={props.disabled}
              />
              <Input
                placeholder="City"
                autoComplete="address-level2"
                inputClassName="rounded-none rounded-br-md focus:z-10"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={props.disabled}
              />
            </div>
          </>
        }
      />

      <br />

      <Input
        label="Country"
        inputComponent={
          <>
            <Select
              placeholder="Country"
              className="relative rounded-md focus:z-10 "
              value={country}
              autoComplete="country"
              onChange={(e) => setCountry(e.target.value)}
              disabled={props.disabled}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </Select>
          </>
        }
      />
    </>
  );
};
