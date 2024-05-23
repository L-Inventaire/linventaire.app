import { FormInput } from "@components/form/fields";
import {
  FormContextContext,
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { Payment } from "@features/clients/types/clients";
import { paymentOptions } from "@features/utils/constants";
import { PageBlockHr, PageColumns } from "@views/client/_layout/page";
import { useContext, useEffect, useState } from "react";

export const PaymentInput = (props: {
  ctrl: FormControllerType;
  readonly?: boolean;
}) => {
  const { readonly: contextReadonly } = useContext(FormContextContext);
  const readonly =
    props.readonly === undefined ? contextReadonly : props.readonly;

  const [form, setForm] = useState<Partial<Payment>>(props.ctrl.value || {});
  const { ctrl } = useFormController<Partial<Payment>>(form, setForm);

  useEffect(() => {
    props.ctrl.onChange(form);
  }, [JSON.stringify(form)]);

  useEffect(() => {
    setForm(props.ctrl.value || {});
  }, [JSON.stringify(props.ctrl.value)]);

  return (
    <div className="space-y-2">
      <FormInput
        readonly={readonly}
        label="Moyens de paiement"
        ctrl={ctrl("mode")}
        type="multiselect"
        options={paymentOptions}
      />

      {(form?.mode || ([] as string[])).includes("bank_transfer") && (
        <div>
          <div className="space-y-2">
            <PageColumns>
              <FormInput
                readonly={readonly}
                label="Banque"
                ctrl={ctrl("bank_name")}
                placeholder="Nom de la banque"
              />
              <FormInput
                label="BIC"
                readonly={readonly}
                ctrl={ctrl("bank_bic")}
                placeholder="BXITITMM"
                type="formatted"
                format="bic"
              />
            </PageColumns>
            <FormInput
              label="IBAN"
              readonly={readonly}
              ctrl={ctrl("bank_iban")}
              placeholder="FR76 3000 4000 0312 3456 7890 143"
              type="formatted"
              format="iban"
            />
          </div>
        </div>
      )}

      <PageBlockHr />

      <FormInput
        className="w-max"
        readonly={readonly}
        label="Délai de paiement (jours)"
        ctrl={ctrl("delay")}
        type="number"
      />
      <FormInput
        label="Pénalité de retard"
        readonly={readonly}
        ctrl={ctrl("late_penalty")}
        options={[
          {
            label: "3 fois le taux légal",
            value: "3 fois le taux légal",
          },
        ]}
      />
    </div>
  );
};
