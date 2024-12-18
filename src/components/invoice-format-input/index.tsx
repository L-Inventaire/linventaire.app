import { InputLabel } from "@atoms/input/input-decoration-label";
import { FormInput } from "@components/form/fields";
import {
  FormContextContext,
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { useClients } from "@features/clients/state/use-clients";
import { Invoices as InvoiceFormat } from "@features/clients/types/clients";
import { Contacts } from "@features/contacts/types/types";
import { tvaMentionOptions } from "@features/utils/constants";
import { EditorInput } from "@molecules/editor-input";
import { PageBlockHr } from "@views/client/_layout/page";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDefaultConfig } from "./utils";

export const InvoiceFormatInput = (props: {
  ctrl: FormControllerType<any>;
  contact?: Contacts;
  readonly?: boolean;
  hideLinkedDocuments?: boolean;
}) => {
  const { t } = useTranslation();
  const { client } = useClients();

  const defaultConfig = getDefaultConfig(client?.client, props.contact);

  const { readonly: contextReadonly } = useContext(FormContextContext);
  const readonly =
    props.readonly === undefined ? contextReadonly : props.readonly;

  const [form, setForm] = useState<Partial<InvoiceFormat>>(
    props.ctrl.value || {}
  );
  const { ctrl } = useFormController<Partial<InvoiceFormat>>(form, setForm);

  useEffect(() => {
    props.ctrl.onChange(form);
  }, [JSON.stringify(form)]);

  useEffect(() => {
    setForm(props.ctrl.value || {});
  }, [JSON.stringify(props.ctrl.value)]);

  return (
    <div className="space-y-2">
      <InputLabel
        label={t("settings.invoices.heading")}
        input={
          <EditorInput
            reset={ctrl("heading").value !== defaultConfig?.invoices?.heading}
            onReset={() =>
              ctrl("heading").onChange(defaultConfig?.invoices?.heading)
            }
            disabled={readonly}
            onChange={ctrl("heading").onChange}
            value={ctrl("heading").value}
          />
        }
      />
      <InputLabel
        label={t("settings.invoices.footer")}
        input={
          <EditorInput
            reset={ctrl("footer").value !== defaultConfig?.invoices?.footer}
            onReset={() =>
              ctrl("footer").onChange(defaultConfig?.invoices?.footer)
            }
            disabled={readonly}
            onChange={ctrl("footer").onChange}
            value={ctrl("footer").value}
          />
        }
      />
      <InputLabel
        label={t("settings.invoices.payment_terms")}
        input={
          <EditorInput
            reset={
              ctrl("payment_terms").value !==
              defaultConfig?.invoices?.payment_terms
            }
            onReset={() =>
              ctrl("payment_terms").onChange(
                defaultConfig?.invoices?.payment_terms
              )
            }
            disabled={readonly}
            onChange={ctrl("payment_terms").onChange}
            value={ctrl("payment_terms").value}
          />
        }
      />
      <FormInput
        label={t("settings.invoices.tva")}
        reset={ctrl("tva").value !== defaultConfig?.invoices?.tva}
        onReset={() => ctrl("tva").onChange(defaultConfig?.invoices?.tva)}
        readonly={readonly}
        ctrl={ctrl("tva")}
        options={tvaMentionOptions.map((a) => ({ label: a, value: a }))}
      />
      {!props.hideLinkedDocuments && (
        <FormInput
          type="files"
          reset={
            ctrl("attachments").value !== defaultConfig?.invoices?.attachments
          }
          onReset={() =>
            ctrl("attachments").onChange(defaultConfig?.invoices?.attachments)
          }
          label={t("settings.invoices.attachments")}
          readonly={readonly}
          ctrl={ctrl("attachments")}
          rest={{ table: "invoices", column: "attachments" }}
        />
      )}

      <PageBlockHr />
      <FormInput
        type="boolean"
        reset={ctrl("branding").value !== defaultConfig?.invoices?.branding}
        onReset={() =>
          ctrl("branding").onChange(defaultConfig?.invoices?.branding)
        }
        label={t("settings.invoices.branding")}
        placeholder={t("settings.invoices.branding_placeholder")}
        readonly={readonly}
        ctrl={ctrl("branding")}
      />
      <FormInput
        type="color"
        reset={ctrl("color").value !== defaultConfig?.invoices?.color}
        onReset={() => ctrl("color").onChange(defaultConfig?.invoices?.color)}
        resetProps={{
          className: "right-8",
        }}
        label={t("settings.invoices.color")}
        readonly={readonly}
        ctrl={ctrl("color")}
      />
      <FormInput
        type="files"
        reset={ctrl("logo").value !== defaultConfig?.invoices?.logo}
        onReset={() => ctrl("logo").onChange(defaultConfig?.invoices?.logo)}
        label={t("settings.invoices.logo")}
        readonly={readonly}
        ctrl={ctrl("logo")}
        rest={{ table: "invoices", column: "logo" }}
        max={1}
      />
      <FormInput
        type="files"
        reset={
          ctrl("footer_logo").value !== defaultConfig?.invoices?.footer_logo
        }
        onReset={() =>
          ctrl("footer_logo").onChange(defaultConfig?.invoices?.footer_logo)
        }
        label={t("settings.invoices.footer_logo")}
        readonly={readonly}
        ctrl={ctrl("footer_logo")}
        rest={{ table: "invoices", column: "footer_logo" }}
        max={1}
      />
      <FormInput
        type="select"
        reset={ctrl("template").value !== defaultConfig?.invoices?.template}
        onReset={() =>
          ctrl("template").onChange(defaultConfig?.invoices?.template)
        }
        label={t("settings.invoices.template")}
        readonly={readonly}
        ctrl={ctrl("template")}
        options={[{ value: "default", label: "Default" }]}
      />
    </div>
  );
};
