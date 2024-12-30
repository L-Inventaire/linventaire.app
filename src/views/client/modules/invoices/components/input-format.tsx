import { Base, Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { InvoiceFormatInput } from "@components/invoice-format-input";
import { Clients } from "@features/clients/types/clients";
import { InvoiceFormat } from "@features/invoices/types/types";
import { languageOptions } from "@features/utils/constants";
import { LanguageIcon } from "@heroicons/react/20/solid";
import { ModalHr } from "@views/client/_layout/page";
import _ from "lodash";
import { twMerge } from "tailwind-merge";

export const InvoiceInputFormat = ({
  ctrl,
  ctrlLang,
  ctrlAttachments,
  language,
  readonly,
  client,
  btnKey,
  default_,
}: {
  ctrl: FormControllerType<InvoiceFormat>;
  ctrlLang?: FormControllerType<string>;
  ctrlAttachments?: FormControllerType<string[]>;
  language?: string;
  readonly?: boolean;
  client?: Clients;
  btnKey?: string;
  default_?: "client" | "contact";
}) => {
  const hasContent = _.isEqual(
    _.omitBy(ctrl?.value, (a) => !a),
    _.omitBy(client?.invoices, (a) => !a)
  )
    ? undefined
    : true;
  return (
    <InputButton
      readonly={readonly}
      btnKey={btnKey}
      className={twMerge(hasContent && "w-full justify-start", "flex")}
      data-tooltip="Format et langue par défaut"
      label={
        (languageOptions.find((a) => a.value === language)?.label ||
          "English") + " et format par défaut"
      }
      icon={(p) => <LanguageIcon {...p} />}
      value={hasContent}
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
            ctrlAttachments={ctrlAttachments}
            hideLinkedDocuments
            default={default_}
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
