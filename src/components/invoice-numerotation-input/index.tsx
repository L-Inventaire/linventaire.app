import { InfoSmall } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { Clients } from "@features/clients/types/clients";
import { Contacts } from "@features/contacts/types/types";
import { getFormattedNumerotation } from "@features/utils/format/numerotation";
import { PageColumns } from "@views/client/_layout/page";
import { Dispatch, SetStateAction } from "react";

type InvoiceFormatInputProps = {
  invoicesCounters: Partial<
    Clients["invoices_counters"] | Contacts["invoices_counters"]
  >;
  setInvoicesCounters: Dispatch<
    SetStateAction<
      Partial<Clients["invoices_counters"] | Contacts["invoices_counters"]>
    >
  >;
  isCounters: boolean;
  disabled?: boolean;
};

export const countersDefaults = {
  quotes: {
    format: "D-@YYYY-@C",
    name: "Devis",
    prefix: "D",
  },
  invoices: {
    format: "F-@YYYY-@C",
    name: "Factures",
    prefix: "F",
  },
  credit_notes: {
    format: "AV-@YYYY-@C",
    name: "Avoirs",
    prefix: "AV",
  },
  supplier_invoices: {
    format: "FF-@YYYY-@C",
    name: "Factures Fournisseurs",
    prefix: "FF",
  },
  supplier_credit_notes: {
    format: "AVF-@YYYY-@C",
    name: "Avoirs Fournisseurs",
    prefix: "AVF",
  },
  supplier_quotes: {
    format: "C@C",
    name: "Commandes",
    prefix: "C",
  },
};

export const InvoiceNumerotationInput = ({
  invoicesCounters,
  setInvoicesCounters,
  isCounters,
  disabled = false,
}: InvoiceFormatInputProps) => {
  return (
    <>
      <div className="my-4 space-y-4">
        {(
          [
            "invoices",
            "quotes",
            "credit_notes",
            "supplier_invoices",
            "supplier_credit_notes",
            "supplier_quotes",
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
                  (invoicesCounters as Clients["invoices_counters"])?.[type]
                    ?.counter || 1
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
                value: invoicesCounters?.[type]?.format,
                onChange: (e) =>
                  setInvoicesCounters({
                    ...invoicesCounters,
                    [type]: {
                      format: e
                        .normalize("NFD")
                        .replace(/\p{Diacritic}/gu, "")
                        .toLocaleUpperCase(),
                      counter:
                        (invoicesCounters as Clients["invoices_counters"])?.[
                          type
                        ]?.counter || 1,
                    },
                  }),
              }}
            />
            {isCounters && (
              <FormInput
                label={"Prochaine valeur"}
                placeholder="87"
                type="number"
                ctrl={{
                  value: (invoicesCounters as Clients["invoices_counters"])?.[
                    type
                  ]?.counter,
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
            )}
          </PageColumns>
        ))}
      </div>
      <InfoSmall className="block leading-5">
        @YYYY: Année au format{" "}
        {getFormattedNumerotation(
          "@YYYY",
          (invoicesCounters as Clients["invoices_counters"]).invoices
            ?.counter || 1
        )}
        <br />
        @YY: Année au format{" "}
        {getFormattedNumerotation(
          "@YY",
          (invoicesCounters as Clients["invoices_counters"]).invoices
            ?.counter || 1
        )}
        <br />
        @MM: Mois au format{" "}
        {getFormattedNumerotation(
          "@MM",
          (invoicesCounters as Clients["invoices_counters"]).invoices
            ?.counter || 1
        )}
        <br />
        @DD: Jour au format{" "}
        {getFormattedNumerotation(
          "@DD",
          (invoicesCounters as Clients["invoices_counters"]).invoices
            ?.counter || 1
        )}
        <br />
        @CCCCCC: Compteur à 6 chiffres{" "}
        {getFormattedNumerotation(
          "@CCCCCC",
          (invoicesCounters as Clients["invoices_counters"]).invoices
            ?.counter || 1
        )}
        <br />
        @CCCC: Compteur à 4 chiffres{" "}
        {getFormattedNumerotation(
          "@CCCC",
          (invoicesCounters as Clients["invoices_counters"]).invoices
            ?.counter || 1
        )}
        <br />
        @CC: Compteur à 2 chiffres{" "}
        {getFormattedNumerotation(
          "@CC",
          (invoicesCounters as Clients["invoices_counters"]).invoices
            ?.counter || 1
        )}
        <br />
        @C: Compteur à 1 chiffre{" "}
        {getFormattedNumerotation(
          "@C",
          (invoicesCounters as Clients["invoices_counters"]).invoices
            ?.counter || 1
        )}
        <br />
      </InfoSmall>
    </>
  );
};
