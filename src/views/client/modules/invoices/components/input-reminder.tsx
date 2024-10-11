import { Base, Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import {
  FormContext,
  FormControllerFuncType,
} from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { Invoices } from "@features/invoices/types/types";
import { BellIcon } from "@heroicons/react/20/solid";

export const InvoiceReminderInput = ({
  ctrl,
  invoice,
  readonly,
  btnKey,
}: {
  ctrl: FormControllerFuncType<Invoices>;
  invoice: Invoices;
  readonly?: boolean;
  btnKey?: string;
}) => {
  return (
    <FormContext readonly={false} alwaysVisible>
      <InputButton
        btnKey={btnKey}
        placeholder="Rappels"
        icon={(p) => <BellIcon {...p} />}
        readonly={readonly}
        content={
          <>
            <Info>
              Envoyez un rappel toutes les semaines lorsque votre facture passe
              en attente de paiement tant que le paiement n'est pas effectué.
            </Info>
            <FormInput
              type="boolean"
              placeholder="Activer les rappels"
              value={ctrl("reminders.enabled").value}
              onChange={(e) => {
                ctrl("reminders.enabled").onChange(e);
                ctrl("reminders.repetition").onChange(3);
              }}
            />
            {ctrl("reminders.enabled").value && (
              <div className="space-y-2">
                <FormInput
                  type="number"
                  label="Nombre de rappels"
                  ctrl={ctrl("reminders.repetition")}
                />
              </div>
            )}
          </>
        }
        value={invoice.reminders?.enabled}
      >
        <div className="space-y-0 w-max flex flex-col text-left">
          <Base>{invoice.reminders?.repetition} rappel(s) envoyé(s)</Base>
        </div>
      </InputButton>
    </FormContext>
  );
};
