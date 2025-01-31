import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import Select from "@atoms/input/input-select";
import { Info, Section } from "@atoms/text";
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
import { useFormController } from "@components/form/formcontext";

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
  const [smtp, setSmtp] = useState<Partial<Clients["smtp"]>>({});
  const { ctrl: smtpCtrl } = useFormController(smtp, setSmtp);

  useEffect(() => {
    setPreferences({ ...client?.preferences });
    setSmtp({ ...client?.smtp });
  }, [client]);

  return (
    <Page title={[{ label: "Paramètres" }, { label: "L'inventaire" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">Autres configurations</Heading>

        <Tabs.Root defaultValue="other" className="mt-4">
          <Tabs.List>
            <Tabs.Trigger value="other">Général</Tabs.Trigger>
            {hasAccess("CLIENT_MANAGE") && (
              <Tabs.Trigger value="smtp">Mail</Tabs.Trigger>
            )}
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
          <Tabs.Content value="smtp">
            <div className="space-y-6">
              <div className="space-y-2">
                <Heading size="4">Général</Heading>
                <FormInput
                  ctrl={smtpCtrl("enabled")}
                  label="Utiliser un serveur SMTP"
                  type="boolean"
                />
                {!!smtpCtrl("enabled").value && (
                  <FormInput
                    ctrl={smtpCtrl("from")}
                    label="Adresse d'envoi"
                    placeholder="bonjour@server.net"
                  />
                )}
              </div>
              {!!smtpCtrl("enabled").value && (
                <>
                  <div className="space-y-2">
                    <Heading size="4">Server SMTP</Heading>
                    <FormInput
                      ctrl={smtpCtrl("host")}
                      label="Serveur"
                      placeholder="server.net"
                    />
                    <FormInput
                      ctrl={smtpCtrl("port")}
                      label="Port"
                      placeholder="587"
                    />
                    <FormInput
                      ctrl={smtpCtrl("user")}
                      label="Nom d'utilisateur"
                      placeholder="user"
                      autoComplete="off"
                    />
                    <FormInput
                      ctrl={smtpCtrl("pass")}
                      label="Mot de passe"
                      placeholder="password"
                      type="password"
                      autoComplete="one-time-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Heading size="4">Vérification DKIM</Heading>
                    <Info>
                      La vérification DKIM est nécessaire pour que vos emails
                      soient reçu par vos destinataires.
                    </Info>
                    <FormInput
                      ctrl={smtpCtrl("dkim.domainName")}
                      label="Domaine"
                      placeholder="server.net"
                    />
                    <FormInput
                      ctrl={smtpCtrl("dkim.keySelector")}
                      label="Sélecteur"
                      placeholder="default"
                    />
                    <FormInput
                      ctrl={smtpCtrl("dkim.privateKey")}
                      label="Clé privée"
                      placeholder="-----BEGIN-----xxx-----PRIVATE KEY-----"
                    />
                  </div>
                </>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </Page>
  );
};
