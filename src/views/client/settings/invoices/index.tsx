import { Button } from "@atoms/button/button";
import { Info, Section } from "@atoms/text";
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
import { Heading, Tabs } from "@radix-ui/themes";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "../../_layout/page";
import { RecurrenceInput } from "@components/recurring-input";

export const InvoicesSettingsPage = () => {
  const { t } = useTranslation();

  const { update, client: clientUser, loading, refresh } = useClients();
  const client = clientUser?.client;
  const hasAccess = useHasAccess();
  const readonly = !hasAccess("CLIENT_MANAGE");

  useEffect(() => {
    refresh();
  }, []);

  const [recurring, setRecurring] = useState<Partial<Clients["recurring"]>>({});
  const [payment, setPayment] = useState<Partial<Clients["payment"]>>({});
  const [invoices, setInvoices] = useState<Partial<Clients["invoices"]>>({});
  const [invoicesCounters, setInvoicesCounters] = useState<
    Partial<Clients["invoices_counters"]>
  >({});

  useEffect(() => {
    setRecurring({ ...client?.recurring });
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
          </Tabs.List>
          <div className="h-4" />
          <Tabs.Content value="payment">
            <Section>{t("settings.payments.title")}</Section>
            <Info>Informations par défaut pour les paiements</Info>
            <div className="mt-4 space-y-4">
              <PaymentInput
                baseConfiguration
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
            <Section>Récurrences</Section>
            <Info>Paramètres par défaut pour les récurrences</Info>
            <div className="mt-4 space-y-4">
              <RecurrenceInput
                baseConfiguration
                ctrl={{ onChange: setRecurring, value: recurring }}
              />
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
                baseConfiguration
                readonly={readonly}
                ctrl={{
                  value: invoices as Invoices,
                  onChange: setInvoices,
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
                  SetStateAction<Partial<InvoiceCounters>>
                >
              }
            />

            {!readonly && (
              <Button
                className="mt-4"
                theme="primary"
                size="md"
                disabled={false}
                onClick={() =>
                  update(client?.id || "", {
                    invoices_counters: invoicesCounters as InvoiceCounters,
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
