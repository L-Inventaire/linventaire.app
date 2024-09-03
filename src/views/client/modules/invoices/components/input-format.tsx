import { Base, Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { InvoiceFormatInput } from "@components/invoice-format-input";
import { Clients } from "@features/clients/types/clients";
import { Invoices } from "@features/invoices/types/types";
import { languageOptions } from "@features/utils/constants";
import { LanguageIcon } from "@heroicons/react/20/solid";
import { ModalHr } from "@views/client/_layout/page";
import _ from "lodash";

export const InvoiceInputFormat = ({
  ctrl,
  invoice,
  readonly,
  client,
  btnKey,
}: {
  ctrl: FormControllerFuncType<Invoices>;
  invoice: Invoices;
  readonly?: boolean;
  client: Clients;
  btnKey?: string;
}) => {
  const hasContent = _.isEqual(
    _.omitBy(invoice?.format, (a) => !a),
    _.omitBy(client.invoices, (a) => !a)
  )
    ? undefined
    : true;
  return (
    <InputButton
      readonly={readonly}
      btnKey={btnKey}
      className={hasContent ? "w-full justify-start" : ""}
      data-tooltip="Format et langue par défaut"
      label={
        (languageOptions.find((a) => a.value === invoice?.language)?.label ||
          "English") + " et format par défaut"
      }
      icon={(p) => <LanguageIcon {...p} />}
      value={hasContent}
      content={
        <>
          <FormInput
            label="Langue"
            className="w-max mb-4"
            ctrl={ctrl("language")}
            type="select"
            options={languageOptions}
          />
          <ModalHr />
          <InvoiceFormatInput
            readonly={readonly}
            ctrl={ctrl("format")}
            hideLinkedDocuments
          />
        </>
      }
    >
      <div className="flex flex-col space-y-0 text-left">
        <Base>
          {languageOptions.find((a) => a.value === invoice?.language)?.label}
        </Base>
        <Info>{invoice?.format?.tva || "Pas de mention de TVA"}</Info>
        <Info>
          {
            [
              invoice?.format?.footer,
              invoice?.format?.heading,
              invoice?.format?.payment_terms,
            ].filter(Boolean).length
          }{" "}
          autre configurations modifiées.
        </Info>
      </div>
    </InputButton>
  );
};
