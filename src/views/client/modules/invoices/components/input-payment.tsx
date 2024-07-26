import { Base, Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { PaymentInput } from "@components/payment-input";
import { Invoices } from "@features/invoices/types/types";
import { currencyOptions, paymentOptions } from "@features/utils/constants";
import { formatIBAN } from "@features/utils/format/strings";
import { BanknotesIcon } from "@heroicons/react/20/solid";
import { PageBlockHr } from "@views/client/_layout/page";

export const InvoicePaymentInput = ({
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
      placeholder="Paiement"
      icon={(p) => <BanknotesIcon {...p} />}
      content={
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
      }
      value={invoice.payment_information.mode?.length || undefined}
    >
      <div className="text-left flex flex-col space-y-0 w-max">
        <Base>
          Paiement par{" "}
          {invoice.payment_information.mode
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
          Paiement sous {invoice.payment_information?.delay} jours, pénalité{" "}
          {invoice.payment_information?.late_penalty}.
        </Info>
      </div>
    </InputButton>
  );
};
