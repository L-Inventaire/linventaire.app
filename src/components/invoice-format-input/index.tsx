import { FormInput } from "@components/form/fields";
import {
  FormContextContext,
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { Invoices as InvoiceFormat } from "@features/clients/types/clients";
import { tvaMentionOptions } from "@features/utils/constants";
import { PageBlockHr } from "@views/client/_layout/page";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const InvoiceFormatInput = (props: {
  ctrl: FormControllerType<any>;
  readonly?: boolean;
}) => {
  const { t } = useTranslation();

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
      <FormInput
        label={t("settings.invoices.heading")}
        readonly={readonly}
        ctrl={ctrl("heading")}
      />
      <FormInput
        label={t("settings.invoices.footer")}
        readonly={readonly}
        ctrl={ctrl("footer")}
      />
      <FormInput
        label={t("settings.invoices.payment_terms")}
        readonly={readonly}
        ctrl={ctrl("payment_terms")}
      />
      <FormInput
        label={t("settings.invoices.tva")}
        readonly={readonly}
        ctrl={ctrl("tva")}
        options={tvaMentionOptions.map((a) => ({ label: a, value: a }))}
      />

      <PageBlockHr />
      <FormInput
        type="boolean"
        label={t("settings.invoices.branding")}
        placeholder={t("settings.invoices.branding_placeholder")}
        readonly={readonly}
        ctrl={ctrl("branding")}
      />
      <FormInput
        type="color"
        label={t("settings.invoices.color")}
        readonly={readonly}
        ctrl={ctrl("color")}
      />
      <FormInput
        type="files"
        label={t("settings.invoices.logo")}
        readonly={readonly}
        ctrl={ctrl("logo")}
        rest={{ table: "invoices", column: "logo" }}
      />
      <FormInput
        type="files"
        label={t("settings.invoices.footer_logo")}
        readonly={readonly}
        ctrl={ctrl("footer_logo")}
        rest={{ table: "invoices", column: "footer_logo" }}
      />
      <FormInput
        type="select"
        label={t("settings.invoices.template")}
        readonly={readonly}
        ctrl={ctrl("template")}
        options={[{ value: "default", label: "Default" }]}
      />
    </div>
  );
};
