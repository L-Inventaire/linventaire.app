import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import Select from "@atoms/input/input-select";
import { Info, Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { InvoiceFormatInput } from "@components/invoice-format-input";
import { InvoiceNumerotationInput } from "@components/invoice-numerotation-input";
import { PaymentInput } from "@components/payment-input";
import { useHasAccess } from "@features/access";
import { useClients } from "@features/clients/state/use-clients";
import {
  Clients,
  InvoiceCounters,
  Invoices,
} from "@features/clients/types/clients";
import { InvoiceCountersOverrides } from "@features/contacts/types/types";
import { currencyOptions } from "@features/utils/constants";
import { Heading, Tabs } from "@radix-ui/themes";
import _ from "lodash";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "../../_layout/page";
import { EditorInput } from "@molecules/editor-input";

export const PreferencesPage = () => {
  const { t } = useTranslation();

  const { update, client: clientUser, loading, refresh } = useClients();
  const client = clientUser?.client;
  const hasAccess = useHasAccess();
  const readonly = !hasAccess("CLIENT_MANAGE");

  useEffect(() => {
    refresh();
  }, []);

  const [preferences, setPreferences] = useState<
    Partial<Clients["preferences"]>
  >({});
  const [payment, setPayment] = useState<Partial<Clients["payment"]>>({});
  const [invoices, setInvoices] = useState<Partial<Clients["invoices"]>>({});
  const [invoicesCounters, setInvoicesCounters] = useState<
    Partial<Clients["invoices_counters"]>
  >({});

  useEffect(() => {
    setPreferences({ ...client?.preferences });
    setPayment({ ...client?.payment });
    setInvoices({ ...client?.invoices });
    setInvoicesCounters({ ...client?.invoices_counters });
  }, [client]);

  return (
    <Page title={[{ label: "Paramètres" }, { label: "L'inventaire" }]}>
      <div className="w-full max-w-3xl mx-auto mt-6">
        <Heading size="6">Configuration des factures</Heading>

        <Tabs.Root defaultValue="format" className="mt-4">
          <Tabs.List>
            <Tabs.Trigger value="format">Format des factures</Tabs.Trigger>
            <Tabs.Trigger value="payment">Paiements des factures</Tabs.Trigger>
            <Tabs.Trigger value="recurring">Récurrences</Tabs.Trigger>
            <Tabs.Trigger value="numerotation">
              Numérotation des factures
            </Tabs.Trigger>
            <Tabs.Trigger value="general">Autre</Tabs.Trigger>
          </Tabs.List>
          <div className="h-4" />
          <Tabs.Content value="general">
            <Section>{t("settings.preferences.title")}</Section>
            <div className="max-w-lg">
              <InputLabel
                className="mb-4"
                label={t("settings.preferences.language")}
                input={
                  <Select
                    disabled={readonly}
                    value={preferences?.language || "en"}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        language: e.target.value,
                      })
                    }
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </Select>
                }
              />
              <InputLabel
                className="mb-4"
                label={t("settings.preferences.timezone")}
                input={
                  <Select
                    disabled={readonly}
                    value={preferences?.timezone || "Europe/Paris"}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        timezone: e.target.value,
                      })
                    }
                  >
                    {Intl.supportedValuesOf("timeZone").map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </Select>
                }
              />
              <EditorInput
                className="mb-4"
                value={preferences?.email_footer || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    email_footer: e,
                  })
                }
              />
              <FormInput
                type="select"
                className="mb-4"
                label={t("settings.preferences.currency")}
                disabled={readonly}
                value={preferences?.currency?.toLocaleUpperCase() || "EUR"}
                onChange={(e) =>
                  setPreferences({ ...preferences, currency: e.target.value })
                }
                options={currencyOptions}
              />
              {!readonly && (
                <Button
                  theme="primary"
                  size="md"
                  onClick={() =>
                    update(client?.id || "", {
                      preferences: {
                        ...client?.preferences,
                        language: preferences?.language,
                        currency: preferences?.currency,
                      },
                    })
                  }
                  loading={loading}
                >
                  {t("general.save")}
                </Button>
              )}
            </div>
          </Tabs.Content>
          <Tabs.Content value="payment">
            <Section>{t("settings.payments.title")}</Section>
            <Info>Informations par défaut pour les paiements</Info>
            <div className="mt-4 space-y-4">
              <PaymentInput
                readonly={readonly}
                ctrl={{
                  value: payment,
                  onChange: setPayment,
                }}
              />
              {!readonly && (
                <Button
                  theme="primary"
                  size="md"
                  onClick={() =>
                    update(client?.id || "", {
                      payment: {
                        ...client?.payment!,
                        ...payment,
                      },
                    })
                  }
                  loading={loading}
                >
                  Enregistrer
                </Button>
              )}
            </div>
          </Tabs.Content>
          <Tabs.Content value="recurring">
            <Section>Récurrences des factures</Section>
            <Info>Paramètres par défaut pour les récurrences</Info>
            <div className="mt-4 space-y-4">
              <div>[En cours]</div>
              {!readonly && (
                <Button
                  className="mt-4"
                  theme="primary"
                  size="md"
                  onClick={() =>
                    update(client?.id || "", {
                      invoices: {
                        ...((client?.invoices || {}) as Clients["invoices"]),
                        ...invoices,
                      },
                    })
                  }
                  loading={loading}
                >
                  Enregistrer
                </Button>
              )}
            </div>
          </Tabs.Content>
          <Tabs.Content value="format">
            <Section>Format des factures</Section>
            <Info>Informations par défaut à afficher sur les factures</Info>
            <div className="mt-4 space-y-4">
              <InvoiceFormatInput
                readonly={readonly}
                ctrl={{
                  value: invoices as Invoices,
                  onChange: setInvoices,
                }}
                ctrlAttachments={{
                  value: invoices?.attachments || [],
                  onChange: (attachments) =>
                    setInvoices({ ...invoices, attachments }),
                }}
              />

              {!readonly && (
                <Button
                  className="mt-4"
                  theme="primary"
                  size="md"
                  onClick={async () => {
                    try {
                      await update(client?.id || "", {
                        invoices: {
                          ...((client?.invoices || {}) as Clients["invoices"]),
                          ...invoices,
                        },
                      });
                    } catch (error) {}
                  }}
                  loading={loading}
                >
                  Enregistrer
                </Button>
              )}
            </div>
          </Tabs.Content>
          <Tabs.Content value="numerotation">
            <Section>Numérotation des factures</Section>
            <Info>
              Numérotation des factures, devis et avoirs. Les numérotations
              doivent être unqiues pour chaque type de document.
            </Info>

            <InvoiceNumerotationInput
              invoicesCounters={invoicesCounters}
              setInvoicesCounters={
                setInvoicesCounters as unknown as Dispatch<
                  SetStateAction<
                    Partial<InvoiceCounters | InvoiceCountersOverrides>
                  >
                >
              }
              isCounters
            />

            {!readonly && (
              <Button
                className="mt-4"
                theme="primary"
                size="md"
                disabled={
                  _.uniq(
                    [
                      invoicesCounters.invoices?.format,
                      invoicesCounters.quotes?.format,
                      invoicesCounters.credit_notes?.format,
                    ].map((a) =>
                      a?.replace(/(@YYYY|@YY|@MM|@DD|@C{1,6}|[^a-zA-Z])/gm, "")
                    )
                  ).length !== 3
                }
                onClick={() =>
                  update(client?.id || "", {
                    invoices_counters: {
                      ...((client?.invoices_counters ||
                        {}) as Clients["invoices_counters"]),
                      ...invoicesCounters,
                    },
                  })
                }
                loading={loading}
              >
                Enregistrer
              </Button>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </Page>
  );
};
