import { Base, Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { Invoices } from "@features/invoices/types/types";
import { BellIcon } from "@heroicons/react/20/solid";

export const InvoiceReminderInput = ({
  ctrl,
  invoice,
  readonly,
}: {
  ctrl: FormControllerFuncType<Invoices>;
  invoice: Invoices;
  readonly?: boolean;
}) => {
  return (
    <InputButton
      placeholder="Rappels"
      icon={(p) => <BellIcon {...p} />}
      content={
        <>
          <Info>
            Envoyez un rappel toutes les semaines lorsque votre facture passe en
            attente de paiement tant que le paiement n'est pas effectué.
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
              <FormInput
                type="multiselect"
                label="Destinataires"
                onChange={(e) => ctrl("reminders.recipients").onChange(e)}
                value={ctrl("reminders.recipients").value}
                options={async (query: string) => [
                  ...(ctrl("reminders.recipients").value || []).map(
                    (r: string) => ({
                      value: r as string,
                      label: r as string,
                    })
                  ),
                  ...(query
                    .toLocaleLowerCase()
                    .match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g)
                    ? [{ value: query, label: query }]
                    : []),
                ]}
              />
            </div>
          )}
        </>
      }
      value={invoice.reminders?.enabled}
      readonly={readonly}
    >
      <div className="space-y-0 w-max flex flex-col text-left">
        <Base>{invoice.reminders?.repetition} rappel(s) envoyé(s)</Base>
        <Info>Envoyé au client et aux contacts.</Info>
        <Info>
          {invoice.reminders?.recipients?.length
            ? `à ${invoice.reminders?.recipients?.join(", ")}`
            : "Pas de destinataire additionel"}
        </Info>
      </div>
    </InputButton>
  );
};
