import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import Select from "@atoms/input/input-select";
import { Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { useHasAccess } from "@features/access";
import { useClients } from "@features/clients/state/use-clients";
import { Clients } from "@features/clients/types/clients";
import { currencyOptions } from "@features/utils/constants";
import { EditorInput } from "@molecules/editor-input";
import { Heading, Tabs } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "../../_layout/page";

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

  useEffect(() => {
    setPreferences({ ...client?.preferences });
  }, [client]);

  return (
    <Page title={[{ label: "Paramètres" }, { label: "L'inventaire" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">Autres configurations</Heading>

        <Tabs.Root defaultValue="other" className="mt-4">
          <Tabs.List>
            <Tabs.Trigger value="other">Autre</Tabs.Trigger>
          </Tabs.List>
          <div className="h-4" />
          <Tabs.Content value="other">
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
              <InputLabel
                className="mb-4"
                label={t("settings.preferences.email_footer")}
                input={
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
                        timezone: preferences?.timezone,
                        email_footer: preferences?.email_footer,
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
        </Tabs.Root>
      </div>
    </Page>
  );
};
