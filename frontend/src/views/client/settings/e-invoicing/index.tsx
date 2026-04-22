import { ButtonConfirm } from "@/atoms/button/confirm";
import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Info, Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { useHasAccess } from "@features/access";
import { useEInvoicingConfig } from "@features/e-invoicing/hooks/use-e-invoicing-config";
import { Heading, Switch } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import { Page } from "../../_layout/page";

export const EInvoicingPage = () => {
  const hasAccess = useHasAccess();
  const readonly = !hasAccess("CLIENT_MANAGE");

  const {
    config,
    isLoading,
    saveConfig,
    testConnection,
    deleteConfig,
    updateSettings,
    syncData,
  } = useEInvoicingConfig();

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showForm, setShowForm] = useState(true);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (config) {
      setShowForm(false);
      setClientId("");
      setClientSecret("");
    } else {
      setShowForm(true);
    }
  }, [config]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      client_id: clientId,
      client_secret: clientSecret,
      pdp_provider: "superpdp",
    });
  };

  const handleTest = async () => {
    await testConnection.mutateAsync();
  };

  const handleDelete = async () => {
    await deleteConfig.mutateAsync();
    setShowForm(true);
  };

  const handleToggleSend = async (enabled: boolean) => {
    await updateSettings.mutateAsync({ send_enabled: enabled });
  };

  const handleToggleReceive = async (enabled: boolean) => {
    await updateSettings.mutateAsync({ receive_enabled: enabled });
  };

  const handleSync = async () => {
    await syncData.mutateAsync();
  };

  const isConfigured = config?.connection_status === "connected";
  const hasError = config?.connection_status === "error";

  // Debug logs
  useEffect(() => {
    if (config) {
      console.log("[EInvoicingPage] Config loaded:", {
        connection_status: config.connection_status,
        superpdp_company_id: config.superpdp_company_id,
        directory_entries_count: config.superpdp_directory_entries?.length || 0,
        directory_entries: config.superpdp_directory_entries,
      });
    }
  }, [config]);

  // Auto-sync data when page loads if config is connected
  useEffect(() => {
    if (
      config &&
      config.connection_status === "connected" &&
      !isLoading &&
      !hasSyncedRef.current
    ) {
      console.log("[EInvoicingPage] Auto-syncing data from SuperPDP...");
      hasSyncedRef.current = true;
      syncData.mutate();
    }
  }, [config, isLoading, syncData]);

  return (
    <Page
      title={[{ label: "Paramètres" }, { label: "Facturation électronique" }]}
    >
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">Facturation électronique</Heading>
        <Info className="mt-2">
          Configurez la facturation électronique pour automatiser l'envoi et la
          réception de factures via le réseau Peppol.
        </Info>

        {/* Configuration Form (if not configured) */}
        {showForm && !config && (
          <div className="mt-6 space-y-4">
            <Section>Configuration du connecteur</Section>

            <FormInput
              type="select"
              label="Plateforme de dématérialisation"
              value="superpdp"
              disabled={true}
              options={[{ value: "superpdp", label: "SuperPDP" }]}
            />

            <FormInput
              type="text"
              label="Client ID"
              value={clientId}
              onChange={(value) => setClientId(value)}
              disabled={readonly}
              autoComplete="off"
              placeholder="Votre client ID SuperPDP"
            />

            <FormInput
              type="password"
              label="Client Secret"
              value={clientSecret}
              onChange={(value) => setClientSecret(value)}
              disabled={readonly}
              autoComplete="new-password"
              placeholder="Votre client secret SuperPDP"
            />

            <div className="flex gap-2">
              <Button
                theme="primary"
                size="md"
                onClick={handleSave}
                loading={saveConfig.isPending}
                disabled={!clientId || !clientSecret || readonly}
              >
                Enregistrer la configuration
              </Button>
            </div>
          </div>
        )}

        {/* Saved but not tested */}
        {config && config.connection_status === "not_configured" && (
          <div className="mt-6 space-y-4">
            <Section>Configuration enregistrée</Section>
            <Info>
              La configuration a été enregistrée. Testez la connexion pour
              l'activer.
            </Info>
            <div className="flex gap-2">
              <Button
                theme="primary"
                size="md"
                onClick={handleTest}
                loading={testConnection.isPending}
              >
                Tester la connexion
              </Button>
              <ButtonConfirm
                theme="danger"
                size="md"
                onClick={handleDelete}
                loading={deleteConfig.isPending}
              >
                Retirer le connecteur
              </ButtonConfirm>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && config && (
          <div className="mt-6 space-y-4">
            <Section>Erreur de connexion</Section>
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">
                Impossible de se connecter à SuperPDP
              </p>
              {config.last_error && (
                <p className="text-red-600 text-sm mt-1">{config.last_error}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                theme="primary"
                size="md"
                onClick={handleTest}
                loading={testConnection.isPending}
              >
                Tester à nouveau
              </Button>
              <ButtonConfirm
                theme="danger"
                size="md"
                onClick={handleDelete}
                loading={deleteConfig.isPending}
              >
                Retirer le connecteur
              </ButtonConfirm>
            </div>
          </div>
        )}

        {/* Successfully connected */}
        {isConfigured && config && config.superpdp_company && (
          <div className="mt-6 space-y-6">
            {/* PDP Info */}
            <div>
              <Section>Connecteur actif</Section>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="font-medium">SuperPDP</p>
                  <p className="text-sm text-gray-600">
                    Environnement: {config.superpdp_company.env}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    theme="secondary"
                    size="sm"
                    onClick={handleSync}
                    loading={syncData.isPending}
                  >
                    Actualiser les données
                  </Button>
                  <ButtonConfirm
                    theme="danger"
                    size="sm"
                    onClick={handleDelete}
                    loading={deleteConfig.isPending}
                  >
                    Retirer le connecteur
                  </ButtonConfirm>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div>
              <Section>Informations de l'entreprise</Section>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-medium">Raison sociale:</span>{" "}
                  {config.superpdp_company.formal_name}
                </div>
                <div>
                  <span className="font-medium">Nom commercial:</span>{" "}
                  {config.superpdp_company.trade_name}
                </div>
                <div>
                  <span className="font-medium">Numéro SIREN/SIRET:</span>{" "}
                  {config.superpdp_company.number}
                </div>
                <div>
                  <span className="font-medium">Adresse:</span>{" "}
                  {config.superpdp_company.address},{" "}
                  {config.superpdp_company.postcode}{" "}
                  {config.superpdp_company.city},{" "}
                  {config.superpdp_company.country}
                </div>
              </div>
            </div>

            {/* Mandates */}
            <div>
              <Section>
                Mandats de facturation (envoi des factures électroniques)
              </Section>
              {config.superpdp_company.mandates &&
              config.superpdp_company.mandates.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {config.superpdp_company.mandates.map((mandate) => (
                    <div
                      key={mandate.id}
                      className="p-3 border border-gray-200 rounded"
                    >
                      <div className="font-medium">
                        {mandate.managed_public_company_formal_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Numéro: {mandate.managed_public_company_number}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ Aucun mandat configuré
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Vous devez configurer au moins un mandat avec votre
                    partenaire pour pouvoir utiliser l'envoi de factures
                    électronique.
                  </p>
                </div>
              )}
            </div>

            {/* Directory Entries */}
            <div>
              <Section>Lignes d'annuaire (réception des factures)</Section>
              <Info className="mt-1 mb-2">
                Ces adresses techniques permettent de recevoir des factures
                électroniques. Gérez-les depuis votre compte SuperPDP.
              </Info>
              {config.superpdp_directory_entries &&
              config.superpdp_directory_entries.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {config.superpdp_directory_entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 border border-gray-200 rounded"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {entry.directory.toUpperCase()}
                            </span>
                            {entry.is_replyto && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                Reply-to
                              </span>
                            )}
                            {entry.status === "created" && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                Actif
                              </span>
                            )}
                            {entry.status === "pending" && (
                              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                                En attente
                              </span>
                            )}
                            {entry.status === "error" && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                Erreur
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {entry.identifier}
                          </div>
                          {entry.status_message && (
                            <div className="text-xs text-gray-500 mt-1">
                              {entry.status_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ Aucune ligne d'annuaire configurée
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Vous devez configurer au moins une ligne d'annuaire chez
                    votre partenaire pour recevoir des factures électroniques.
                  </p>
                </div>
              )}
            </div>

            {/* Send/Receive Toggles */}
            <div>
              <Section>Paramètres d'activation</Section>
              <div className="mt-4 space-y-4">
                <InputLabel
                  label="Envoi automatique des factures"
                  input={
                    <Switch
                      checked={config.send_enabled}
                      onCheckedChange={handleToggleSend}
                      disabled={
                        readonly ||
                        updateSettings.isPending ||
                        !config.superpdp_company.mandates ||
                        config.superpdp_company.mandates.length === 0
                      }
                    />
                  }
                />

                <InputLabel
                  label="Réception automatique des factures"
                  input={
                    <Switch
                      checked={config.receive_enabled}
                      onCheckedChange={handleToggleReceive}
                      disabled={
                        readonly ||
                        updateSettings.isPending ||
                        !config.superpdp_directory_entries ||
                        config.superpdp_directory_entries.length === 0
                      }
                    />
                  }
                />
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-6">
            <p>Chargement...</p>
          </div>
        )}
      </div>
    </Page>
  );
};
