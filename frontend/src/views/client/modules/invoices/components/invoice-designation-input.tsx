import { Heading } from "@radix-ui/themes";
import { Base } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { Invoices } from "@features/invoices/types/types";

interface InvoiceDesignationInputProps {
  readonly?: boolean;
  draft: Invoices;
  nameCtrl: any;
  altReferenceCtrl: any;
}

export const InvoiceDesignationInput = ({
  readonly,
  draft,
  nameCtrl,
  altReferenceCtrl,
}: InvoiceDesignationInputProps) => {
  return (
    <FormContext readonly={readonly} alwaysVisible>
      {(!readonly || nameCtrl.value || altReferenceCtrl.value) && (
        <>
          {draft.type === "quotes" && !!readonly && (
            <div className="flex space-x-2 pb-4 items-end">
              <Heading size="4" className="grow">
                {nameCtrl.value}
              </Heading>
              <Base>{altReferenceCtrl.value}</Base>
            </div>
          )}
          {draft.type === "quotes" && !readonly && (
            <div className="flex space-x-2 pb-4 items-center">
              <FormInput
                ctrl={nameCtrl}
                size="lg"
                placeholder="Désignation (optionnel)"
              />
              <InputButton
                theme="invisible"
                size="sm"
                placeholder="Autre référence"
                content={() => (
                  <div className="space-y-2 mt-4">
                    <FormInput
                      ctrl={altReferenceCtrl}
                      label="Autre référence"
                    />
                  </div>
                )}
                value={
                  [altReferenceCtrl.value]
                    .filter((a) => (a || "").trim())
                    .join(" - ") || false
                }
              />
            </div>
          )}
          {draft.type !== "quotes" && (
            <InputButton
              theme="invisible"
              size="sm"
              className="-mx-1 px-1"
              placeholder="Désignation et autre référence"
              content={() => (
                <div className="space-y-2 mt-4">
                  <FormInput ctrl={nameCtrl} label="Désignation" />
                  <FormInput ctrl={altReferenceCtrl} label="Autre référence" />
                </div>
              )}
              value={
                [nameCtrl.value, altReferenceCtrl.value]
                  .filter((a) => (a || "").trim())
                  .join(" - ") || false
              }
            />
          )}
        </>
      )}
    </FormContext>
  );
};
