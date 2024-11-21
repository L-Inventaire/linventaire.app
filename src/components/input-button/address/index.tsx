import { Address } from "@features/clients/types/clients";
import { InputButton, InputButtonProps } from "..";
import { AddressInput } from "./form";

export const AddressInputButton = (
  props: InputButtonProps<Partial<Address>> & {
    autoComplete?: boolean;
  }
) => {
  return (
    <InputButton
      label={props.label || "Address"}
      {...props}
      content={() => (
        <AddressInput
          value={props.value as any}
          onChange={props.onChange as any}
          autoComplete={props.autoComplete}
        />
      )}
    >
      <div className="text-left">
        <AddressInput value={props.value as any} readonly />
      </div>
    </InputButton>
  );
};
