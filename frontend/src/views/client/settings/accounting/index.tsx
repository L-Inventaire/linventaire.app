import { Button } from "@atoms/button/button";
import Link from "@atoms/link";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Info, Section } from "@atoms/text";
import { AccountingAccountInput } from "@components/accounting-account-input";
import { useHasAccess } from "@features/access";
import { useClients } from "@features/clients/state/use-clients";
import { Heading } from "@radix-ui/themes";
import {
  AccountingAccount,
  AccountingLineKind,
  ClientAccounting,
  DEFAULT_CLIENT_ACCOUNTING,
} from "@shared/accounting";
import {
  standardCodeToVatCategory,
  standardCodeToVatValue,
} from "@shared/consts";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "../../_layout/page";

const LINE_KINDS: { kind: AccountingLineKind; label: string }[] = [
  { kind: "product", label: "Produits" },
  { kind: "service", label: "Services" },
  { kind: "consumable", label: "Consommables" },
];

// VAT codes with an actual VAT amount (S:20, S:10...)
const VAT_RATES = Object.keys(standardCodeToVatValue).filter(
  (code) => standardCodeToVatValue[code] > 0,
);

const defaultLabel = (account: AccountingAccount) =>
  `${account.standard_identifier} - ${account.name} (par défaut)`;

export const AccountingSettingsPage = () => {
  const { t } = useTranslation();

  const { update, client: clientUser, loading, refresh } = useClients();
  const client = clientUser?.client;
  const hasAccess = useHasAccess();
  const readonly = !hasAccess("CLIENT_MANAGE");

  const [accounting, setAccounting] = useState<Partial<ClientAccounting>>({});

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    setAccounting(_.cloneDeep(client?.accounting || {}));
  }, [client]);

  const ctrl = (path: string) => ({
    value: _.get(accounting, path) as AccountingAccount | undefined,
    onChange: (value: AccountingAccount) =>
      setAccounting(_.set(_.cloneDeep(accounting), path, value)),
  });

  const accountInput = (path: string, placeholder: string) => (
    <div className="space-y-1">
      <AccountingAccountInput
        {...ctrl(path)}
        placeholder={placeholder}
        readonly={readonly}
      />
      {!readonly && !!ctrl(path).value?.standard_identifier && (
        <Link
          className="text-sm block"
          onClick={() => {
            const next = _.cloneDeep(accounting);
            _.unset(next, path);
            setAccounting(next);
          }}
        >
          Revenir au compte par défaut
        </Link>
      )}
    </div>
  );

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Comptabilité" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">Configuration comptable</Heading>
        <Info>
          Ces comptes sont utilisés dans l'export comptable. Le compte défini
          sur l'article est toujours prioritaire, les comptes ci-dessous
          s'appliquent aux articles sans compte et aux lignes sans article.
        </Info>

        {(["sell", "buy"] as const).map((side) => (
          <div key={side} className="mt-6">
            <Section>
              {side === "sell"
                ? "Comptes de vente par défaut"
                : "Comptes d'achat par défaut"}
            </Section>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {LINE_KINDS.map(({ kind, label }) => (
                <InputLabel
                  key={kind}
                  label={label}
                  input={accountInput(
                    `${side}.${kind}`,
                    defaultLabel(DEFAULT_CLIENT_ACCOUNTING[side][kind]),
                  )}
                />
              ))}
            </div>
          </div>
        ))}

        {(["vat_collected", "vat_deductible"] as const).map((key) => (
          <div key={key} className="mt-6">
            <Section>
              {key === "vat_collected"
                ? "Comptes de TVA collectée (ventes)"
                : "Comptes de TVA déductible (achats)"}
            </Section>
            <Info>
              Un compte pour toute la TVA, ou un compte par taux si votre
              comptable les distingue.
            </Info>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <InputLabel
                label="Tous les taux"
                input={accountInput(
                  `${key}.default`,
                  defaultLabel(DEFAULT_CLIENT_ACCOUNTING[key]),
                )}
              />
              {VAT_RATES.map((code) => (
                <InputLabel
                  key={code}
                  label={`TVA ${standardCodeToVatCategory[code] || code}`}
                  input={accountInput(
                    // Codes contain dots (S:5.5), use an array path
                    `${key}.rates["${code}"]`,
                    "Même compte que tous les taux",
                  )}
                />
              ))}
            </div>
          </div>
        ))}

        {!readonly && (
          <Button
            theme="primary"
            size="md"
            className="mt-6"
            loading={loading}
            onClick={async () => {
              await update(client?.id || "", {
                accounting: accounting as ClientAccounting,
              });
            }}
          >
            {t("general.save")}
          </Button>
        )}
      </div>
    </Page>
  );
};
