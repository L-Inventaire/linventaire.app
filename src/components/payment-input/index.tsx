import { FormInput } from "@components/form/fields";
import {
  FormContextContext,
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { useClients } from "@features/clients/state/use-clients";
import { Payment } from "@features/clients/types/clients";
import { Contacts } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import {
  getInvoiceWithOverrides,
  mergeObjects,
} from "@features/invoices/utils";
import { paymentDelayOptions, paymentOptions } from "@features/utils/constants";
import { PageBlockHr, PageColumns } from "@views/client/_layout/page";
import _ from "lodash";
import { useContext, useEffect, useState } from "react";

export const PaymentInput = (props: {
  ctrl: FormControllerType<Partial<Invoices["payment_information"]>>;
  client?: Contacts;
  contact?: Contacts;
  readonly?: boolean;
  baseConfiguration?: boolean;
}) => {
  const { client: me } = useClients();

  const defaultConfig = getInvoiceWithOverrides(
    {} as Invoices,
    ...([props.client, props.contact, me?.client].filter(
      (a) => a !== undefined && !!a
    ) as any[])
  );

  const getReset = (
    key: keyof Invoices["payment_information"] | `${string}.${string}`
  ) => {
    const defaultVal = _.get(defaultConfig, "payment_information." + key);
    if (_.isEqual(ctrl(key)?.value, defaultVal) || props.baseConfiguration)
      return undefined;
    return () => ctrl(key).onChange(defaultVal);
  };

  const { readonly: contextReadonly } = useContext(FormContextContext);
  const readonly =
    props.readonly === undefined ? contextReadonly : props.readonly;

  const values = mergeObjects(
    props.ctrl.value || {},
    defaultConfig.payment_information
  );

  const [form, setForm] = useState<Partial<Payment>>(values || {});
  const { ctrl } = useFormController<Partial<Payment>>(form, setForm);

  useEffect(() => {
    const formWithNull = _.omitBy(
      form,
      (v, k) =>
        _.isEqual(
          v,
          defaultConfig.payment_information[
            k as keyof Invoices["payment_information"]
          ]
        ) && !props.baseConfiguration
    );
    props.ctrl.onChange(formWithNull as Invoices["payment_information"]);
  }, [JSON.stringify(form)]);

  useEffect(() => {
    setForm(values || {});
  }, [JSON.stringify(values)]);

  return (
    <div className="space-y-2">
      <FormInput
        onReset={getReset("mode")}
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
                onReset={getReset("bank_name")}
                readonly={readonly}
                label="Banque"
                ctrl={ctrl("bank_name")}
                placeholder="Nom de la banque"
              />
              <FormInput
                onReset={getReset("bank_bic")}
                label="BIC"
                readonly={readonly}
                ctrl={ctrl("bank_bic")}
                placeholder="BXITITMM"
                type="formatted"
                format="bic"
              />
            </PageColumns>
            <FormInput
              onReset={getReset("bank_iban")}
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
        onReset={getReset("delay_type")}
        className="w-full"
        readonly={readonly}
        label="Type de délai"
        ctrl={ctrl("delay_type")}
        type="select"
        options={paymentDelayOptions}
      />

      {ctrl("delay_type")?.value !== "date" && (
        <FormInput
          onReset={getReset("delay")}
          className="w-full"
          readonly={readonly}
          label="Délai de paiement (jours)"
          ctrl={ctrl("delay")}
          type="number"
        />
      )}

      {ctrl("delay_type")?.value === "date" && (
        <FormInput
          onReset={getReset("delay_date")}
          className="w-full"
          readonly={readonly}
          label="Date limite de paiement"
          ctrl={ctrl("delay_date")}
          type="date"
        />
      )}

      <FormInput
        onReset={getReset("late_penalty")}
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
