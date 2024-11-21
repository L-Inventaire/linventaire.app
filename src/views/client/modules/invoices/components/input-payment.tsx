import { Base, Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { PaymentInput } from "@components/payment-input";
import { Invoices } from "@features/invoices/types/types";
import { currencyOptions, paymentOptions } from "@features/utils/constants";
import { formatTime } from "@features/utils/format/dates";
import { formatIBAN } from "@features/utils/format/strings";
import { BanknotesIcon } from "@heroicons/react/20/solid";
import { PageBlockHr } from "@views/client/_layout/page";
import { computePaymentDelayDate, isPaymentLate } from "../utils";

export const InvoicePaymentInput = ({
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
    <InputButton
      btnKey={btnKey}
      placeholder="Paiement"
      icon={(p) => <BanknotesIcon {...p} />}
      readonly={readonly}
      content={() => (
        <>
          <div className="p-4 border rounded">
            <FormInput
              label="Devise"
              className="w-full mb-4"
              ctrl={ctrl("currency")}
              type="select"
              options={currencyOptions}
            />
            <PageBlockHr />
            <PaymentInput
              readonly={readonly}
              ctrl={ctrl("payment_information")}
            />
          </div>
        </>
      )}
      value={invoice.payment_information.mode?.length || undefined}
    >
      <div className="text-left flex flex-col space-y-0 w-max">
        <Base>
          Paiement par{" "}
          {(invoice.payment_information.mode || [])
            .map((a) => paymentOptions.find((b) => b.value === a)?.label || a)
            .join(", ")}{" "}
          en {invoice.currency}
        </Base>
        <Info>
          {formatIBAN(invoice.payment_information?.bank_iban)} (
          {invoice.payment_information?.bank_bic}{" "}
          {invoice.payment_information?.bank_name})
        </Info>
        <Info>
          Paiement sous {invoice.payment_information?.delay} jours{" "}
          {["month_end_delay_first", "month_end_delay_last"].includes(
            invoice.payment_information?.delay_type
          ) && "fin de mois"}
          , pénalité {invoice.payment_information?.late_penalty}.
        </Info>

        {invoice.type === "invoices" &&
          invoice.wait_for_completion_since &&
          invoice.state === "purchase_order" && (
            <>
              <Info className={"text-blue-500"}>
                Signé, paiement avant le :{" "}
                {formatTime(computePaymentDelayDate(invoice).toJSDate(), {
                  keepDate: true,
                  hideTime: true,
                })}
              </Info>
              {isPaymentLate(invoice) && (
                <Info className={"text-red-500"}>
                  La paiement est en retard !
                </Info>
              )}
            </>
          )}
      </div>
    </InputButton>
  );
};
