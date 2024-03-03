import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import Select from "@atoms/select";
import { Section } from "@atoms/text";
import { useClients } from "@features/clients/state/use-clients";
import { Clients } from "@features/clients/types/clients";
import { useEffect, useState } from "react";
import { Page, PageBlock } from "../../_layout/page";
import { useHasAccess } from "@features/access";

export const PreferencesPage = () => {
  const { update, client: clientUser, loading } = useClients();
  const client = clientUser?.client;
  const hasAccess = useHasAccess();
  const readOnly = !hasAccess("CLIENT_WRITE");

  const [preferences, setPreferences] = useState<
    Partial<Clients["preferences"]>
  >({});

  useEffect(() => {
    setPreferences({ ...client?.preferences });
  }, [client]);

  return (
    <Page title={[{ label: "Paramètres" }, { label: "L'inventaire" }]}>
      <PageBlock>
        <Section>Préférences</Section>
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
          <InputLabel
            className="mb-4"
            label="Devise principale"
            input={
              <Select
                disabled={readOnly}
                value={preferences?.currency || "eur"}
                onChange={(e) =>
                  setPreferences({ ...preferences, currency: e.target.value })
                }
              >
                <option value="eur">Euro</option>
                <option value="usd">Dollar</option>
              </Select>
            }
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
    </Page>
  );
};
