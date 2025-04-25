import { Base, Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { InvoiceFormatInput } from "@components/invoice-format-input";
import { Contacts } from "@features/contacts/types/types";
import { InvoiceFormat } from "@features/invoices/types/types";
import { languageOptions } from "@features/utils/constants";
import { LanguageIcon } from "@heroicons/react/20/solid";
import { ModalHr } from "@views/client/_layout/page";
import { twMerge } from "tailwind-merge";

export const InvoiceInputFormat = ({
  ctrl,
  ctrlLang,
  language,
  readonly,
  btnKey,
  client,
  contact,
}: {
  ctrl: FormControllerType<InvoiceFormat>;
  ctrlLang?: FormControllerType<string>;
  language?: string;
  readonly?: boolean;
  client?: Contacts;
  contact?: Contacts;
  btnKey?: string;
}) => {
  return (
    <InputButton
      readonly={readonly}
      btnKey={btnKey}
      className={twMerge("w-full justify-start", "flex")}
      data-tooltip="Format et langue par défaut"
      label={
        (languageOptions.find((a) => a.value === language)?.label ||
          "English") + " et format par défaut"
      }
      icon={(p) => <LanguageIcon {...p} />}
      value={true}
      content={() => (
        <>
          {ctrlLang && (
            <FormInput
              label="Langue"
              className="w-max mb-4"
              ctrl={ctrlLang}
              type="select"
              options={languageOptions}
            />
          )}
          <ModalHr />
          <InvoiceFormatInput
            readonly={readonly}
            ctrl={ctrl}
            client={client}
            contact={contact}
          />
        </>
      )}
    >
      <div className="flex flex-col space-y-0 text-left">
        <Base>{languageOptions.find((a) => a.value === language)?.label}</Base>
        <Info>{ctrl?.value?.tva || "Format de facture/devis par défaut"}</Info>
        <Info>
          {
            [
              ctrl?.value?.footer,
              ctrl?.value?.heading,
              ctrl?.value?.payment_terms,
            ].filter(Boolean).length
          }{" "}
          autre configurations modifiées.
        </Info>
      </div>
    </InputButton>
  );
};
