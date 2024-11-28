import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { Invoices } from "@features/invoices/types/types";
import { CalendarDateRangeIcon } from "@heroicons/react/16/solid";
import { format } from "date-fns";
import { Text } from "@radix-ui/themes";
import { FormInput } from "@components/form/fields";
import { Checkbox } from "@atoms/input/input-checkbox";
import { useEffect, useState } from "react";
import { applyOffset } from "@features/invoices/utils";

export const InvoiceRecurrencePeriodInput = ({
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
  const [useCustomDate, setUseCustomDate] = useState(false);

  useEffect(() => {
    if (!useCustomDate) {
      const date = new Date(invoice.from_subscription.from);
      applyOffset(date, invoice.from_subscription.frequency, 1);
      ctrl("from_subscription.to").onChange(date.getTime());
    }
  }, [useCustomDate, invoice.from_subscription.from]);

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
                {format(new Date(invoice.from_subscription.to), "dd/MM/yyyy")}
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
        </div>
      )}
      value={"true"}
    >
      <Text size="3">
        Période du{" "}
        {format(new Date(invoice.from_subscription.from), "dd/MM/yyyy")} au{" "}
        {format(new Date(invoice.from_subscription.to), "dd/MM/yyyy")}
      </Text>
    </InputButton>
  );
};
