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
import { Contacts } from "@features/contacts/types/types";
import { format } from "date-fns";

export const InvoicePaymentInput = ({
  ctrl,
  invoice,
  readonly,
  btnKey,
  client,
  contact,
  noResetToDefault,
}: {
  ctrl: FormControllerFuncType<
    Pick<Invoices, "payment_information" | "currency">
  >;
  invoice?: Invoices;
  readonly?: boolean;
  btnKey?: string;
  client?: Contacts;
  contact?: Contacts;
  noResetToDefault?: boolean;
}) => {
  const paymentInfo = (ctrl("payment_information") || {}) as Partial<
    Invoices["payment_information"]
  >;
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
              client={client}
              contact={contact}
              baseConfiguration={noResetToDefault}
            />
          </div>
        </>
      )}
      value={paymentInfo.mode?.length || undefined}
    >
      <div className="text-left flex flex-col space-y-0 w-max">
        <Base>
          Paiement par{" "}
          {(paymentInfo.mode || [])
            .map((a) => paymentOptions.find((b) => b.value === a)?.label || a)
            .join(", ")}
        </Base>
        <Info>
          {formatIBAN(paymentInfo?.bank_iban || "")} ({paymentInfo?.bank_bic}{" "}
          {paymentInfo?.bank_name})
        </Info>
        <Info>
          Paiement sous {paymentInfo?.delay} jours{" "}
          {["month_end_delay_first", "month_end_delay_last"].includes(
            paymentInfo?.delay_type || ""
          ) && "fin de mois"}
          , pénalité {paymentInfo?.late_penalty}.
        </Info>

        {invoice &&
          invoice.type === "invoices" &&
          invoice.wait_for_completion_since &&
          invoice.state === "purchase_order" && (
            <>
              <Info className={"text-blue-500"}>
                Signé, paiement avant le :{" "}
                {format(computePaymentDelayDate(invoice).toJSDate(), "PP")}
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
