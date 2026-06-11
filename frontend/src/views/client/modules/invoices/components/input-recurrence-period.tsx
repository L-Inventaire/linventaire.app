import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { Invoices } from "@features/invoices/types/types";
import { CalendarDateRangeIcon } from "@heroicons/react/16/solid";
import { format } from "date-fns";
import { Text } from "@radix-ui/themes";
import { FormInput } from "@components/form/fields";
import { Checkbox } from "@atoms/input/input-checkbox";
import { Info } from "@atoms/text";
import { useEffect, useState } from "react";
import { applyOffset } from "@shared/invoices";
import { atomFamily, useRecoilState } from "recoil";
import _ from "lodash";

// Holds, per invoice, whether the user asked to realign the billing day of the
// source subscription when saving. Read by the edit page on save.
export const SyncSubscriptionDayAtom = atomFamily<boolean, string>({
  key: "SyncSubscriptionDayAtom",
  default: false,
});

export const InvoiceRecurrencePeriodInput = ({
  ctrl,
  invoice,
  readonly,
  btnKey,
  sourceQuote,
}: {
  ctrl: FormControllerFuncType<Invoices>;
  invoice: Invoices;
  readonly?: boolean;
  btnKey?: string;
  sourceQuote?: Invoices;
}) => {
  const frequencies = _.uniq(
    invoice.content?.filter((a) => a.subscription).map((a) => a.subscription),
  );
  const minFrequency =
    _.minBy(frequencies, (a) => {
      const t = new Date();
      applyOffset(t, a!, Intl.DateTimeFormat().resolvedOptions().timeZone, 1);
      return t.getTime();
    }) || "monthly";
  const expectedToDate = invoice.from_subscription?.from
    ? new Date(invoice.from_subscription?.from)
    : null;
  if (expectedToDate) {
    applyOffset(
      expectedToDate,
      (invoice.from_subscription?.frequency === "multiple"
        ? null
        : invoice.from_subscription?.frequency) ||
        minFrequency ||
        "monthly",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      1,
    );
    expectedToDate.setDate(expectedToDate.getDate() - 1);
  }
  const isCustomDate =
    invoice.from_subscription?.from &&
    invoice.from_subscription?.to &&
    expectedToDate &&
    new Date(expectedToDate).toISOString().split("T")[0] !==
      new Date(invoice.from_subscription?.to).toISOString().split("T")[0];

  const [useCustomDate, setUseCustomDate] = useState(!!isCustomDate);

  // When this invoice is linked to a still-active recurring quote, we let the
  // user realign the subscription's billing day on the period start they just
  // set. We only offer it when the day actually differs from the current one.
  const fromDate = invoice.from_subscription?.from
    ? new Date(invoice.from_subscription.from)
    : null;
  const subscriptionAnchor = sourceQuote?.subscription_started_at
    ? new Date(sourceQuote.subscription_started_at)
    : null;
  const canSyncSubscriptionDay =
    !readonly &&
    !!invoice.from_rel_quote?.length &&
    sourceQuote?.state === "recurring" &&
    !!fromDate &&
    !!subscriptionAnchor &&
    fromDate.getDate() !== subscriptionAnchor.getDate();

  const [syncSubscriptionDay, setSyncSubscriptionDay] = useRecoilState(
    SyncSubscriptionDayAtom(invoice.id || "new"),
  );

  // Drop the intent if the period gets reverted to the existing billing day.
  useEffect(() => {
    if (!canSyncSubscriptionDay && syncSubscriptionDay) {
      setSyncSubscriptionDay(false);
    }
  }, [canSyncSubscriptionDay]);

  useEffect(() => {
    if (!useCustomDate) {
      if (!invoice.from_subscription?.from) {
        const to = new Date();
        applyOffset(
          to,
          minFrequency,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          1,
        );
        ctrl("from_subscription").onChange({
          from: Date.now(),
          to: to.getTime(),
          frequency: frequencies.length === 1 ? minFrequency : "multiple",
        });
      } else if (expectedToDate) {
        ctrl("from_subscription.to").onChange(expectedToDate.getTime());
      }
    }
  }, [useCustomDate, invoice.from_subscription?.from]);

  return (
    <InputButton
      btnKey={btnKey}
      placeholder="Période de récurrence correspondante"
      icon={(p) => <CalendarDateRangeIcon {...p} />}
      readonly={readonly}
      content={() => (
        <div className="space-y-4">
          <FormInput
            label="Début de la période"
            type="date"
            ctrl={ctrl("from_subscription.from")}
          />
          <div className="space-y-2">
            {!useCustomDate && (
              <div>
                Fin de la période le{" "}
                {format(
                  new Date(invoice.from_subscription?.to || Date.now()),
                  "dd/MM/yyyy",
                )}
              </div>
            )}
            {useCustomDate && (
              <FormInput
                label="Fin de la période"
                type="date"
                ctrl={ctrl("from_subscription.to")}
              />
            )}
            <Checkbox
              label="Utiliser une date personnalisée"
              value={useCustomDate}
              onChange={setUseCustomDate}
            />
          </div>
          {canSyncSubscriptionDay && (
            <div className="space-y-1 border-t border-slate-100 dark:border-slate-700 pt-3">
              <Checkbox
                label="Mettre à jour le jour de facturation de l'abonnement source"
                value={syncSubscriptionDay}
                onChange={setSyncSubscriptionDay}
              />
              <Info className="block">
                Les prochaines factures de cet abonnement seront générées à
                partir du {format(new Date(fromDate || Date.now()), "dd")} du
                mois.
              </Info>
            </div>
          )}
        </div>
      )}
      value={"true"}
    >
      <Text size="3">
        Période du{" "}
        {format(
          new Date(invoice.from_subscription?.from || Date.now()),
          "dd/MM/yyyy",
        )}{" "}
        au{" "}
        {format(
          new Date(invoice.from_subscription?.to || Date.now()),
          "dd/MM/yyyy",
        )}
      </Text>
    </InputButton>
  );
};
