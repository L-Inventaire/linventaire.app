import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import {
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { useClients } from "@features/clients/state/use-clients";
import { Contacts } from "@features/contacts/types/types";
import { Invoices, InvoiceSubscription } from "@features/invoices/types/types";
import {
  getInvoiceWithOverrides,
  mergeObjects,
} from "@features/invoices/utils";
import { Blockquote, Heading } from "@radix-ui/themes";
import { ModalHr, PageColumns } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect, useState } from "react";

export const optionsDelays = [
  {
    value: "1y",
    label: "1 an",
  },
  {
    value: "2y",
    label: "2 ans",
  },
  {
    value: "3y",
    label: "3 ans",
  },
];

const optionsStartDates = [
  {
    value: "after_first_invoice",
    label: "Après la première facture",
  },
  {
    value: "acceptance_start",
    label: "Lorsque le devis est accepté",
  },
  {
    value: "date",
    label: "Date spécifique",
  },
];

const optionsEndDates = [
  {
    value: "none",
    label: "Ne pas définir de fin",
  },
  {
    value: "delay",
    label: "Délai",
  },
  {
    value: "date",
    label: "Date spécifique",
  },
];

const optionsInvoiceState = [
  {
    value: "draft",
    label: "Brouillon",
  },
  {
    value: "sent",
    label: "Envoyé",
  },
];

const optionsInvoiceDate = [
  {
    value: "first_day",
    label: "Premier jour de la période",
  },
  {
    value: "first_workday",
    label: "Premier jour ouvré de la période",
  },
  {
    value: "monday",
    label: "Premier lundi de la période",
  },
  {
    value: "last_day",
    label: "Dernier jour de la période",
  },
  {
    value: "last_workday",
    label: "Dernier jour ouvré de la période",
  },
];

const optionsRenewAs = [
  {
    value: "draft",
    label: "Dupliquer le devis en brouillon",
  },
  {
    value: "sent",
    label: "Dupliquer le devis et l'envoyer au client",
  },
  {
    value: "closed",
    label: "Clôturer",
  },
];

export const RecurrenceInput = ({
  invoice,
  onlyEnding,
  baseConfiguration,
  client,
  contact,
  ...props
}: {
  ctrl: FormControllerType<Partial<InvoiceSubscription>>;
  invoice?: Invoices;
  onlyEnding?: boolean;
  client?: Contacts;
  contact?: Contacts;
  readonly?: boolean;
  baseConfiguration?: boolean;
}) => {
  const { client: me } = useClients();

  const defaultConfig = getInvoiceWithOverrides(
    {} as Invoices,
    ...([client, contact, me?.client].filter(
      (a) => a !== undefined && !!a
    ) as any[])
  );

  const getReset = (key: keyof InvoiceSubscription | `${string}.${string}`) => {
    const defaultVal = _.get(defaultConfig, key);
    if (_.isEqual(ctrl(key)?.value, defaultVal) || baseConfiguration)
      return undefined;
    return () => ctrl(key).onChange(defaultVal);
  };

  const subscriptions = _.uniq(
    invoice?.content?.map((a) => a.subscription)
  ).filter(Boolean) as string[];

  const values = mergeObjects(
    props.ctrl.value || {},
    defaultConfig.subscription
  );

  const [form, setForm] = useState<Partial<InvoiceSubscription>>(values);
  const { ctrl } = useFormController<Partial<InvoiceSubscription>>(
    form,
    setForm
  );

  useEffect(() => {
    const formWithNull = _.omitBy(form, (v, k) =>
      _.isEqual(v, defaultConfig.subscription[k as keyof InvoiceSubscription])
    );
    props.ctrl.onChange(formWithNull as InvoiceSubscription);
  }, [JSON.stringify(form)]);

  useEffect(() => {
    setForm({ ...values });
  }, [JSON.stringify(values)]);

  return (
    <>
      {!baseConfiguration && (
        <>
          <br />
          {subscriptions.length > 1 && (
            <Blockquote className="mb-4">
              Vous avez plusieurs articles avec des fréquences différentes, la
              facture sera dupliquée pour chaque groupes d'articles partageant
              la même fréquence à partir de la prochaine facture.
            </Blockquote>
          )}
        </>
      )}
      <>
        <div className="space-y-4">
          {!onlyEnding && (
            <>
              <PageColumns>
                <FormInput
                  onReset={getReset("subscription.start_type")}
                  type="select"
                  label="Début de la récurrence"
                  options={optionsStartDates}
                  ctrl={ctrl("subscription.start_type")}
                />
                {!baseConfiguration &&
                  ctrl("subscription.start_type")?.value === "date" && (
                    <FormInput
                      type="date"
                      label="Date (incluse)"
                      ctrl={ctrl("subscription.start")}
                    />
                  )}
              </PageColumns>
              <FormInput
                onReset={getReset("subscription.invoice_date")}
                type="select"
                label="Facturer le"
                ctrl={ctrl("subscription.invoice_date")}
                options={optionsInvoiceDate}
              />
            </>
          )}
          <FormInput
            onReset={getReset("subscription.invoice_state")}
            type="select"
            label="État des facture créées"
            ctrl={ctrl("subscription.invoice_state")}
            options={optionsInvoiceState}
          />
        </div>
        <ModalHr />
      </>
      <div className="space-y-4">
        <PageColumns>
          <FormInput
            onReset={getReset("subscription.end_type")}
            type="select"
            label="Fin de la facturation"
            options={optionsEndDates}
            ctrl={ctrl("subscription.end_type")}
          />
          {ctrl("subscription.end_type")?.value === "delay" && (
            <FormInput
              onReset={getReset("subscription.end_delay")}
              type="select"
              label="Délai"
              ctrl={ctrl("subscription.end_delay")}
              options={optionsDelays}
            />
          )}
          {!baseConfiguration &&
            ctrl("subscription.end_type")?.value === "date" && (
              <FormInput
                type="date"
                label="Date (incluse)"
                ctrl={ctrl("subscription.end")}
              />
            )}
        </PageColumns>

        <div className="space-y-2">
          <Heading size="2" className="pb-0">
            Action en fin de récurrence
          </Heading>
          <FormInput
            onReset={getReset("subscription.renew_as")}
            type="select"
            ctrl={ctrl("subscription.renew_as")}
            options={optionsRenewAs}
          />
          {ctrl("subscription.renew_as").value === "draft" && (
            <>
              <Heading size="2" className="pb-0">
                Créer le brouillon en avance
              </Heading>
              <FormInput
                onReset={getReset("subscription.renew_in_advance")}
                type="select"
                value={`${ctrl("subscription.renew_in_advance").value}`}
                onChange={(v) =>
                  ctrl("subscription.renew_in_advance").onChange(parseInt(v))
                }
                options={[
                  { value: "0", label: "Le jour même" },
                  { value: "30", label: "1 mois avant" },
                  { value: "60", label: "2 mois avant" },
                ]}
              />
            </>
          )}
          <Info className="block">
            Une fois la période de facturation terminée, le devis peut être
            automatiquement dupliqué en brouillon, ou en devis envoyé au client,
            ou bien définitivement clôturé.
          </Info>
        </div>
      </div>
    </>
  );
};
