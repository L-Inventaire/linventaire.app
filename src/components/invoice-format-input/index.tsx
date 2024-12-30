import { InputLabel } from "@atoms/input/input-decoration-label";
import { FormInput } from "@components/form/fields";
import {
  FormContextContext,
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { useClients } from "@features/clients/state/use-clients";
import { Contacts } from "@features/contacts/types/types";
import { InvoiceFormat } from "@features/invoices/types/types";
import { tvaMentionOptions } from "@features/utils/constants";
import { EditorInput } from "@molecules/editor-input";
import { PageBlockHr } from "@views/client/_layout/page";
import _ from "lodash";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDefaultConfig } from "./utils";

export type InvoiceFormatInputProps = {
  ctrl: FormControllerType<InvoiceFormat>;
  ctrlAttachments?: FormControllerType<string[]>;
  contact?: Contacts;
  readonly?: boolean;
  hideLinkedDocuments?: boolean;
  default?: "client" | "contact";
};

export const InvoiceFormatInput = (props: InvoiceFormatInputProps) => {
  const { t } = useTranslation();
  const { client } = useClients();

  const defaultConfig = getDefaultConfig(
    client?.client,
    props.contact,
    props?.default ?? "contact"
  );

  const getValue = (
    ctrlKey: `${string}.${string}` | "attachments" | keyof InvoiceFormat,
    key: string
  ) => {
    return ctrl(ctrlKey).value === undefined
      ? _.get(defaultConfig, key)
      : ctrl(ctrlKey).value;
  };

  const { readonly: contextReadonly } = useContext(FormContextContext);
  const readonly =
    props.readonly === undefined ? contextReadonly : props.readonly;

  const [form, setForm] = useState<InvoiceFormat & { attachments: string[] }>({
    ...props.ctrl.value,
    attachments: [],
  });
  const { ctrl } = useFormController<InvoiceFormat & { attachments: string[] }>(
    form,
    setForm
  );

  useEffect(() => {
    const formNoAttachments = _.omit(form, "attachments");
    props.ctrl.onChange(formNoAttachments as InvoiceFormat);
  }, [JSON.stringify(form)]);

  useEffect(() => {
    setForm({ ...props.ctrl.value, attachments: form.attachments });
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
            reset={
              getValue("footer", "invoices.footer") !==
              defaultConfig?.invoices?.footer
            }
            onReset={() =>
              ctrl("footer").onChange(defaultConfig?.invoices?.footer)
            }
            disabled={readonly}
            onChange={ctrl("footer").onChange}
            value={getValue("footer", "invoices.footer")}
          />
        }
      />
      <InputLabel
        label={t("settings.invoices.payment_terms")}
        input={
          <EditorInput
            reset={
              getValue("payment_terms", "invoices.payment_terms") !==
              defaultConfig?.invoices?.payment_terms
            }
            onReset={() =>
              ctrl("payment_terms").onChange(
                defaultConfig?.invoices?.payment_terms
              )
            }
            disabled={readonly}
            onChange={ctrl("payment_terms").onChange}
            value={getValue("payment_terms", "invoices.payment_terms")}
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
      {!props.hideLinkedDocuments && props.ctrlAttachments && (
        <FormInput
          type="files"
          reset={
            getValue("attachments", "invoices.attachments") !==
            defaultConfig?.invoices?.attachments
          }
          onReset={() =>
            ctrl("attachments").onChange(defaultConfig?.invoices?.attachments)
          }
          value={getValue("attachments", "invoices.attachments")}
          label={t("settings.invoices.attachments")}
          readonly={readonly}
          ctrl={ctrl("attachments")}
          rest={{ table: "invoices", column: "attachments" }}
        />
      )}

      <PageBlockHr />
      <FormInput
        type="boolean"
        reset={
          getValue("branding", "invoices.branding") !==
          defaultConfig?.invoices?.branding
        }
        onReset={() =>
          ctrl("branding").onChange(defaultConfig?.invoices?.branding)
        }
        value={getValue("branding", "invoices.branding")}
        label={t("settings.invoices.branding")}
        placeholder={t("settings.invoices.branding_placeholder")}
        readonly={readonly}
        ctrl={ctrl("branding")}
      />
      <FormInput
        type="color"
        reset={
          getValue("color", "invoices.color") !== defaultConfig?.invoices?.color
        }
        onReset={() => ctrl("color").onChange(defaultConfig?.invoices?.color)}
        value={getValue("color", "invoices.color")}
        resetProps={{
          className: "right-8",
        }}
        label={t("settings.invoices.color")}
        readonly={readonly}
        ctrl={ctrl("color")}
      />
      <FormInput
        type="files"
        reset={
          getValue("logo", "invoices.logo") !== defaultConfig?.invoices?.logo
        }
        onReset={() => ctrl("logo").onChange(defaultConfig?.invoices?.logo)}
        value={getValue("logo", "invoices.logo")}
        label={t("settings.invoices.logo")}
        readonly={readonly}
        ctrl={ctrl("logo")}
        rest={{ table: "invoices", column: "logo" }}
        max={1}
      />
      <FormInput
        type="files"
        reset={
          getValue("footer_logo", "invoices.footer_logo") !==
          defaultConfig?.invoices?.footer_logo
        }
        onReset={() =>
          ctrl("footer_logo").onChange(defaultConfig?.invoices?.footer_logo)
        }
        value={getValue("footer_logo", "invoices.footer_logo")}
        label={t("settings.invoices.footer_logo")}
        readonly={readonly}
        ctrl={ctrl("footer_logo")}
        rest={{ table: "invoices", column: "footer_logo" }}
        max={1}
      />
      <FormInput
        type="select"
        reset={
          getValue("template", "invoices.template") !==
          defaultConfig?.invoices?.template
        }
        onReset={() =>
          ctrl("template").onChange(defaultConfig?.invoices?.template)
        }
        value={getValue("template", "invoices.template")}
        label={t("settings.invoices.template")}
        readonly={readonly}
        ctrl={ctrl("template")}
        options={[{ value: "default", label: "Default" }]}
      />
    </div>
  );
};
