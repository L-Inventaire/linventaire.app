import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import Select from "@atoms/input/input-select";
import { Info, InfoSmall, Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { PaymentInput } from "@components/payment-input";
import { useHasAccess } from "@features/access";
import { useClients } from "@features/clients/state/use-clients";
import { Clients } from "@features/clients/types/clients";
import { currencyOptions } from "@features/utils/constants";
import { useEffect, useState } from "react";
import { Page, PageBlock, PageColumns } from "../../_layout/page";
import { getFormattedNumerotation } from "@features/utils/format/numerotation";
import _ from "lodash";

export const PreferencesPage = () => {
  const { update, client: clientUser, loading } = useClients();
  const client = clientUser?.client;
  const hasAccess = useHasAccess();
  const readOnly = !hasAccess("CLIENT_MANAGE");

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

  const countersDefaults = {
    invoices: {
      format: "F-@YYYY-@C",
      name: "Factures",
      prefix: "F",
    },
    quotes: {
      format: "D-@YYYY-@C",
      name: "Devis",
      prefix: "D",
    },
    credit_notes: {
      format: "A-@YYYY-@C",
      name: "Avoirs",
      prefix: "A",
    },
  };

  return (
    <Page title={[{ label: "Paramètres" }, { label: "L'inventaire" }]}>
      <PageBlock>
        <Section>Général</Section>
        <div className="max-w-lg">
          <InputLabel
            className="mb-4"
            label="Langue de l'entreprise"
            input={
              <Select
                disabled={readOnly}
                value={preferences?.language || "en"}
                onChange={(e) =>
                  setPreferences({ ...preferences, language: e.target.value })
                }
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </Select>
            }
          />
          <FormInput
            type="select"
            className="mb-4"
            label="Devise principale"
            disabled={readOnly}
            value={preferences?.currency?.toLocaleUpperCase() || "EUR"}
            onChange={(e) =>
              setPreferences({ ...preferences, currency: e.target.value })
            }
            options={currencyOptions}
          />
          {!readOnly && (
            <Button
              theme="primary"
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
              Enregistrer
            </Button>
          )}
        </div>
      </PageBlock>
      <PageBlock>
        <Section>Paiements</Section>
        <Info>Informations par défaut pour les paiements</Info>
        <div className="mt-4 space-y-4">
          <PaymentInput
            readonly={readOnly}
            ctrl={{
              value: payment,
              onChange: setPayment,
            }}
          />
          {!readOnly && (
            <Button
              theme="primary"
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
      </PageBlock>
      <PageBlock>
        <Section>Format des factures</Section>
        <Info>Informations par défaut à afficher sur les factures</Info>
        <div className="mt-4 space-y-4">
          {!readOnly && (
            <Button
              className="mt-4"
              theme="primary"
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
      </PageBlock>
      <PageBlock>
        <Section>Numérotation des factures</Section>
        <Info>
          Numérotation des factures, devis et avoirs. Les numérotations doivent
          être unqiues pour chaque type de document.
        </Info>
        <div className="my-4 space-y-4">
          {(
            [
              "invoices",
              "quotes",
              "credit_notes",
            ] as (keyof typeof countersDefaults)[]
          ).map((type) => (
            <PageColumns>
              <FormInput
                label={
                  "Format des " +
                  countersDefaults[type]?.name +
                  ": " +
                  getFormattedNumerotation(
                    invoicesCounters?.[type]?.format || "",
                    invoicesCounters?.[type]?.counter || 1
                  )
                }
                type="text"
                options={[
                  `${countersDefaults[type]?.prefix}-@YY-@C`,
                  `${countersDefaults[type]?.prefix}-@YYYY-@CCCC`,
                  `${countersDefaults[type]?.prefix}-@YYYY-@MM-@CCCCCC`,
                  `${countersDefaults[type]?.prefix}-@YYYY-@MM#@C`,
                ].map((a) => ({
                  label: a,
                  value: a,
                }))}
                placeholder={countersDefaults[type]?.format}
                ctrl={{
                  value: invoicesCounters?.[type]?.format,
                  onChange: (e) =>
                    setInvoicesCounters({
                      ...invoicesCounters,
                      [type]: {
                        format: e
                          .normalize("NFD")
                          .replace(/\p{Diacritic}/gu, "")
                          .toLocaleUpperCase(),
                        counter: invoicesCounters?.[type]?.counter || 1,
                      },
                    }),
                }}
              />
              <FormInput
                label={"Prochaine valeur"}
                placeholder="87"
                type="number"
                ctrl={{
                  value: invoicesCounters?.[type]?.counter,
                  onChange: (e) =>
                    setInvoicesCounters({
                      ...invoicesCounters,
                      [type]: {
                        format: invoicesCounters?.[type]?.format || "",
                        counter: e,
                      },
                    }),
                }}
              />
            </PageColumns>
          ))}
        </div>
        <InfoSmall className="block leading-5">
          @YYYY: Année au format{" "}
          {getFormattedNumerotation(
            "@YYYY",
            invoicesCounters.invoices?.counter || 1
          )}
          <br />
          @YY: Année au format{" "}
          {getFormattedNumerotation(
            "@YY",
            invoicesCounters.invoices?.counter || 1
          )}
          <br />
          @MM: Mois au format{" "}
          {getFormattedNumerotation(
            "@MM",
            invoicesCounters.invoices?.counter || 1
          )}
          <br />
          @DD: Jour au format{" "}
          {getFormattedNumerotation(
            "@DD",
            invoicesCounters.invoices?.counter || 1
          )}
          <br />
          @CCCCCC: Compteur à 6 chiffres{" "}
          {getFormattedNumerotation(
            "@CCCCCC",
            invoicesCounters.invoices?.counter || 1
          )}
          <br />
          @CCCC: Compteur à 4 chiffres{" "}
          {getFormattedNumerotation(
            "@CCCC",
            invoicesCounters.invoices?.counter || 1
          )}
          <br />
          @CC: Compteur à 2 chiffres{" "}
          {getFormattedNumerotation(
            "@CC",
            invoicesCounters.invoices?.counter || 1
          )}
          <br />
          @C: Compteur à 1 chiffre{" "}
          {getFormattedNumerotation(
            "@C",
            invoicesCounters.invoices?.counter || 1
          )}
          <br />
        </InfoSmall>
        {!readOnly && (
          <Button
            className="mt-4"
            theme="primary"
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
      </PageBlock>
    </Page>
  );
};
