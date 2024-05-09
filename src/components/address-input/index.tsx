import countries from "@assets/countries.json";
import { Input } from "@atoms/input/input-text";
import Select from "@atoms/input/input-select";
import { Clients } from "@features/clients/types/clients";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { useContext, useEffect, useState } from "react";
import {
  FormContextContext,
  FormControllerType,
} from "@components/form/formcontext";
import { Base } from "@atoms/text";

export const AddressInput = (props: {
  ctrl?: FormControllerType;
  value?: Partial<Clients["address"]>;
  onChange?: (args: Partial<Clients["address"]>) => void;
  disabled?: boolean;
  autoComplete?: boolean;
  readonly?: boolean;
}) => {
  const context = useContext(FormContextContext);
  const value = props.ctrl?.value || props.value || {};
  const onChange = props.ctrl?.onChange || props.onChange || (() => {});
  const disabled = props.disabled ?? context?.disabled;
  const readonly = props.readonly ?? context?.readonly;
  const autoComplete = props.autoComplete === false ? false : true;

  const [addressLine1, setAddressLine1] = useState(value?.address_line_1 || "");
  const [addressLine2, setAddressLine2] = useState(value?.address_line_2 || "");
  const [zip, setZip] = useState(value?.zip || "");
  const [city, setCity] = useState(value?.city || "");
  const [region, setRegion] = useState(value?.region || "");
  const [country, setCountry] = useState(
    value?.country || navigator.language.toLocaleUpperCase() || "US"
  );

  useEffect(() => {
    setAddressLine1(value?.address_line_1 || "");
    setAddressLine2(value?.address_line_2 || "");
    setZip(value?.zip || "");
    setCity(value?.city || "");
    setRegion(value?.region || "");
    setCountry(
      value?.country || navigator.language.toLocaleUpperCase() || "US"
    );
  }, [value]);

  useControlledEffect(() => {
    onChange?.({
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      zip,
      city,
      region,
      country,
    });
  }, [addressLine1, addressLine2, zip, city, region, country]);

  if (readonly) {
    return (
      <div className="space-y-2">
        <Input
          label="Adresse"
          inputComponent={
            <Base>
              {addressLine1 && <>{addressLine1}</>}
              {addressLine2 && (
                <>
                  {addressLine1 && <br />}
                  {addressLine2}
                </>
              )}
              {(zip || city) && <br />}
              {zip && <>{zip} </>}
              {city && <>{city}</>}
              {(region || country) && <br />}
              {region && <>{region} </>}
              {country && (
                <>
                  {countries.find((a) => a.code === country)?.name || country}
                </>
              )}
            </Base>
          }
        />
      </div>
    );
  }

  return (
    <form
      className="space-y-2"
      autoComplete={props.autoComplete === false ? "off" : undefined}
    >
      <Input
        label="Adresse"
        inputComponent={
          <>
            <Input
              id="address-line-1"
              placeholder="1007 Mountain Drive"
              autoComplete={autoComplete ? "street-address" : "off"}
              inputClassName="relative rounded-none rounded-t-md focus:z-10 "
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              disabled={disabled}
            />
            <Input
              style={{ marginTop: -1 }}
              id="address-line-2"
              placeholder={addressLine1 ? "Address line 2" : "Wayne's manor"}
              inputClassName="relative rounded-none rounded-b-md focus:z-10"
              autoComplete={autoComplete ? "address-level-4" : "off"}
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              disabled={disabled}
            />
          </>
        }
      />
      <Input
        label="Region and city"
        inputComponent={
          <>
            <Input
              style={{ marginTop: -1 }}
              placeholder="Region"
              autoComplete={autoComplete ? "address-level1" : "off"}
              inputClassName="relative rounded-none rounded-t-md focus:z-10"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={disabled}
            />
            <div
              className="flex -space-x-px block relative"
              style={{ marginTop: "-1px" }}
            >
              <Input
                placeholder="ZIP"
                autoComplete={autoComplete ? "postal-code" : "off"}
                inputClassName="rounded-none rounded-bl-md focus:z-10"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                disabled={disabled}
              />
              <Input
                placeholder="City"
                autoComplete={autoComplete ? "address-level2" : "off"}
                inputClassName="rounded-none rounded-br-md focus:z-10"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={disabled}
              />
            </div>
          </>
        }
      />
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
              disabled={disabled}
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
    </form>
  );
};
