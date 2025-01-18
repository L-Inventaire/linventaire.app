import { InputLabel } from "@atoms/input/input-decoration-label";
import { FormInput } from "@components/form/fields";
import {
  FormContextContext,
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { useClients } from "@features/clients/state/use-clients";
import { Contacts } from "@features/contacts/types/types";
import { InvoiceFormat, Invoices } from "@features/invoices/types/types";
import {
  getInvoiceWithOverrides,
  mergeObjects,
} from "@features/invoices/utils";
import { tvaMentionOptions } from "@features/utils/constants";
import { EditorInput } from "@molecules/editor-input";
import { PageBlockHr } from "@views/client/_layout/page";
import _ from "lodash";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type InvoiceFormatInputProps = {
  ctrl: FormControllerType<InvoiceFormat>;
  client?: Contacts;
  contact?: Contacts;
  readonly?: boolean;
  baseConfiguration?: boolean;
};

export const InvoiceFormatInput = (props: InvoiceFormatInputProps) => {
  const { t } = useTranslation();
  const { client: me } = useClients();

  const defaultConfig = getInvoiceWithOverrides(
    {} as Invoices,
    ...([props.client, props.contact, me?.client].filter(
      (a) => a !== undefined && !!a
    ) as any[])
  );

  const getReset = (key: keyof InvoiceFormat | `${string}.${string}`) => {
    const defaultVal = _.get(defaultConfig, "format." + key);
    if (_.isEqual(ctrl(key)?.value, defaultVal) || props.baseConfiguration)
      return undefined;
    return () => ctrl(key).onChange(defaultVal);
  };

  const { readonly: contextReadonly } = useContext(FormContextContext);
  const readonly =
    props.readonly === undefined ? contextReadonly : props.readonly;

  const values = mergeObjects(props.ctrl.value || {}, defaultConfig.format);

  const [form, setForm] = useState<InvoiceFormat>({
    ...values,
  });
  const { ctrl } = useFormController<InvoiceFormat>(form, setForm);

  useEffect(() => {
    const formWithNull = _.omitBy(form, (v, k) =>
      _.isEqual(v, defaultConfig.format[k as keyof InvoiceFormat])
    );
    props.ctrl.onChange(formWithNull as InvoiceFormat);
  }, [JSON.stringify(form)]);

  useEffect(() => {
    setForm({ ...values });
  }, [JSON.stringify(values)]);

  return (
    <div className="space-y-2">
      <InputLabel
        label={t("settings.invoices.heading")}
        onReset={getReset("heading")}
        input={
          <EditorInput
            disabled={readonly}
            onChange={ctrl("heading").onChange}
            value={ctrl("heading").value}
          />
        }
      />
      <InputLabel
        label={t("settings.invoices.footer")}
        onReset={getReset("footer")}
        input={
          <EditorInput
            disabled={readonly}
            onChange={ctrl("footer").onChange}
            value={ctrl("footer").value}
          />
        }
      />
      <InputLabel
        label={t("settings.invoices.payment_terms")}
        onReset={getReset("payment_terms")}
        input={
          <EditorInput
            disabled={readonly}
            onChange={ctrl("payment_terms").onChange}
            value={ctrl("payment_terms").value}
          />
        }
      />
      <FormInput
        onReset={getReset("tva")}
        label={t("settings.invoices.tva")}
        value={ctrl("tva").value}
        readonly={readonly}
        ctrl={ctrl("tva")}
        options={tvaMentionOptions.map((a) => ({ label: a, value: a }))}
      />

      <FormInput
        type="files"
        onReset={getReset("attachments")}
        value={ctrl("attachments").value}
        label={t("settings.invoices.attachments")}
        readonly={readonly}
        ctrl={ctrl("attachments")}
        rest={{ table: "invoices", column: "attachments" }}
      />

      <PageBlockHr />
      <FormInput
        type="boolean"
        onReset={getReset("branding")}
        value={ctrl("branding").value}
        label={t("settings.invoices.branding")}
        placeholder={t("settings.invoices.branding_placeholder")}
        readonly={readonly}
        ctrl={ctrl("branding")}
      />
      <FormInput
        type="color"
        onReset={getReset("color")}
        value={ctrl("color").value}
        label={t("settings.invoices.color")}
        readonly={readonly}
        ctrl={ctrl("color")}
      />
      <FormInput
        type="files"
        onReset={getReset("logo")}
        value={ctrl("logo").value}
        label={t("settings.invoices.logo")}
        readonly={readonly}
        ctrl={ctrl("logo")}
        rest={{ table: "invoices", column: "logo" }}
        max={1}
      />
      <FormInput
        type="files"
        onReset={getReset("footer_logo")}
        value={ctrl("footer_logo").value}
        label={t("settings.invoices.footer_logo")}
        readonly={readonly}
        ctrl={ctrl("footer_logo")}
        rest={{ table: "invoices", column: "footer_logo" }}
        max={1}
      />
      <FormInput
        type="select"
        onReset={getReset("template")}
        value={ctrl("template").value}
        label={t("settings.invoices.template")}
        readonly={readonly}
        ctrl={ctrl("template")}
        options={[{ value: "default", label: "Default" }]}
      />
    </div>
  );
};
