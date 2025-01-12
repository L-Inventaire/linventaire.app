import { InfoSmall } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { Clients } from "@features/clients/types/clients";
import { getFormattedNumerotation } from "@features/utils/format/numerotation";
import { Tabs } from "@radix-ui/themes";
import { PageColumns } from "@views/client/_layout/page";
import _ from "lodash";
import { Dispatch, SetStateAction, useState } from "react";

type InvoiceFormatInputProps = {
  invoicesCounters: Partial<Clients["invoices_counters"]>;
  setInvoicesCounters: Dispatch<
    SetStateAction<Partial<Clients["invoices_counters"]>>
  >;
  disabled?: boolean;
};

export const countersDefaults = {
  quotes: {
    format: "D-@YYYY-@C",
    name: "Devis",
    prefix: "D",
    counter: 1,
  },
  invoices: {
    format: "F-@YYYY-@C",
    name: "Factures",
    prefix: "F",
    counter: 1,
  },
  credit_notes: {
    format: "AV-@YYYY-@C",
    name: "Avoirs",
    prefix: "AV",
    counter: 1,
  },
  supplier_invoices: {
    format: "FF-@YYYY-@C",
    name: "Factures Fournisseurs",
    prefix: "FF",
    counter: 1,
  },
  supplier_credit_notes: {
    format: "AVF-@YYYY-@C",
    name: "Avoirs Fournisseurs",
    prefix: "AVF",
    counter: 1,
  },
  supplier_quotes: {
    format: "C@C",
    name: "Commandes",
    prefix: "C",
    counter: 1,
  },
  drafts: {
    format: "Brouillon-@C",
    name: "Brouillons",
    prefix: "Brouillon",
    counter: 1,
  },
};

export const InvoiceNumerotationInput = ({
  invoicesCounters,
  setInvoicesCounters,
  disabled = false,
}: InvoiceFormatInputProps) => {
  const years = Object.keys(invoicesCounters || {});
  const [tab, setTab] = useState(_.sortBy(years, (a) => -parseInt(a))[0]);
  invoicesCounters[tab] = _.pick(
    invoicesCounters[tab],
    "credit_notes",
    "invoices",
    "quotes",
    "supplier_invoices",
    "supplier_credit_notes",
    "supplier_quotes",
    "drafts"
  ) as any;
  return (
    <>
      <Tabs.Root value={tab} onValueChange={(e) => setTab(e)}>
        <Tabs.List className="flex space-x-4">
          {_.sortBy(years, (a) => a)
            .reverse()
            .map((year) => (
              <Tabs.Trigger value={year} key={year}>
                {year}
              </Tabs.Trigger>
            ))}
        </Tabs.List>
      </Tabs.Root>
      <div className="my-4 space-y-4">
        {(
          [
            "invoices",
            "quotes",
            "credit_notes",
            "supplier_invoices",
            "supplier_credit_notes",
            "supplier_quotes",
            "drafts",
          ] as (keyof typeof countersDefaults)[]
        ).map((type) => (
          <PageColumns>
            <FormInput
              label={
                "Format des " +
                countersDefaults[type]?.name +
                ": " +
                getFormattedNumerotation(
                  invoicesCounters?.[tab]?.[type]?.format || "",
                  (invoicesCounters as Clients["invoices_counters"])?.[tab]?.[
                    type
                  ]?.counter || 1
                )
              }
              disabled={disabled}
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
                value: invoicesCounters?.[tab]?.[type]?.format,
                onChange: (e) =>
                  setInvoicesCounters({
                    ...invoicesCounters,
                    [tab]: {
                      ...(invoicesCounters[tab] || ({} as any)),
                      [type]: {
                        format: e
                          .normalize("NFD")
                          .replace(/\p{Diacritic}/gu, "")
                          .toLocaleUpperCase(),
                        counter:
                          (invoicesCounters as Clients["invoices_counters"])?.[
                            tab
                          ]?.[type]?.counter || 1,
                      },
                    },
                  }),
              }}
            />
            <FormInput
              label={"Prochaine valeur"}
              placeholder="87"
              type="number"
              ctrl={{
                value: (invoicesCounters as Clients["invoices_counters"])?.[
                  tab
                ]?.[type]?.counter,
                onChange: (e) =>
                  setInvoicesCounters({
                    ...invoicesCounters,
                    [tab]: {
                      ...(invoicesCounters[tab] || ({} as any)),
                      [type]: {
                        format: invoicesCounters?.[tab]?.[type]?.format || "",
                        counter: e,
                      },
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
          (invoicesCounters as Clients["invoices_counters"])?.[tab].invoices
            ?.counter || 1
        )}
        <br />
        @YY: Année au format{" "}
        {getFormattedNumerotation(
          "@YY",
          (invoicesCounters as Clients["invoices_counters"])?.[tab].invoices
            ?.counter || 1
        )}
        <br />
        @MM: Mois au format{" "}
        {getFormattedNumerotation(
          "@MM",
          (invoicesCounters as Clients["invoices_counters"])?.[tab].invoices
            ?.counter || 1
        )}
        <br />
        @DD: Jour au format{" "}
        {getFormattedNumerotation(
          "@DD",
          (invoicesCounters as Clients["invoices_counters"])?.[tab].invoices
            ?.counter || 1
        )}
        <br />
        @CCCCCC: Compteur à 6 chiffres{" "}
        {getFormattedNumerotation(
          "@CCCCCC",
          (invoicesCounters as Clients["invoices_counters"])?.[tab].invoices
            ?.counter || 1
        )}
        <br />
        @CCCC: Compteur à 4 chiffres{" "}
        {getFormattedNumerotation(
          "@CCCC",
          (invoicesCounters as Clients["invoices_counters"])?.[tab].invoices
            ?.counter || 1
        )}
        <br />
        @CC: Compteur à 2 chiffres{" "}
        {getFormattedNumerotation(
          "@CC",
          (invoicesCounters as Clients["invoices_counters"])?.[tab].invoices
            ?.counter || 1
        )}
        <br />
        @C: Compteur à 1 chiffre{" "}
        {getFormattedNumerotation(
          "@C",
          (invoicesCounters as Clients["invoices_counters"])?.[tab].invoices
            ?.counter || 1
        )}
        <br />
      </InfoSmall>
    </>
  );
};
