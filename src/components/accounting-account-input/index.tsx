import { InputLabel } from "@atoms/input/input-decoration-label";
import { FormInput } from "@components/form/fields";
import { InputButton } from "@components/input-button";
import { PCGInput, pgcLabel } from "@components/pcg-input";

type AccountingAccountPartial = {
  standard_identifier: string; // Numéro sur le plan comptable
  standard: "pcg" | "ifrs"; // Plan Comptable Général, dans le futur pourrait être étendu à d'autres standards
  name: string;
};

/** Input to set a name, and the pcg number for something */
export const AccountingAccountInput = ({
  value,
  onChange,
  readonly,
  placeholder,
}: {
  value?: AccountingAccountPartial;
  onChange: (e: AccountingAccountPartial) => void;
  readonly?: boolean;
  placeholder?: string;
}) => {
  const name = value?.name || pgcLabel(value?.standard_identifier || "", false);
  return (
    <InputButton
      content={() => (
        <div className="space-y-4">
          <InputLabel
            label="Compte"
            className="w-full"
            input={
              <PCGInput
                className="w-full"
                value={value?.standard_identifier || ""}
                onChange={(val) =>
                  onChange({
                    ...(value || { name: val }),
                    standard: "pcg",
                    standard_identifier: val,
                  })
                }
              />
            }
          />
          <FormInput
            type="text"
            label="Nom personnalisé"
            placeholder={
              pgcLabel(value?.standard_identifier || "", false) ||
              "Nom personnalisé"
            }
            className="w-full"
            value={value?.name || ""}
            onChange={(val) =>
              onChange({
                ...(value || { standard: "pcg", standard_identifier: "" }),
                name: val,
              })
            }
          />
        </div>
      )}
      value={name || undefined}
      placeholder={placeholder}
      readonly={readonly}
    >
      <div className="text-left space-x-1">
        <b>{value?.standard_identifier}</b>
        <span>{name || placeholder || "Compte"}</span>
      </div>
    </InputButton>
  );
};
