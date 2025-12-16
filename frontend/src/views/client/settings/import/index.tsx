import { Info } from "@atoms/text";
import { Heading, Button, Checkbox, Card, Flex, Text } from "@radix-ui/themes";
import { Page } from "../../_layout/page";
import { useEffect, useState, useRef } from "react";
import { useCurrentClient } from "@features/clients/state/use-clients";
import {
  dataExportApiClient,
  AvailableTable,
  ImportResult,
  ExportResult,
} from "@features/data-export/api-client";
import {
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export const ImportExportPage = () => {
  const { client } = useCurrentClient();
  const [tables, setTables] = useState<AvailableTable[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (client?.id) {
      loadTables();
    }
  }, [client?.id]);

  const loadTables = async () => {
    if (!client?.id) return;
    setLoading(true);
    try {
      const availableTables = await dataExportApiClient.getAvailableTables(
        client.id
      );
      setTables(availableTables);
    } catch (error) {
      console.error("Failed to load tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (tableName: string) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableName)) {
      newSelected.delete(tableName);
    } else {
      newSelected.add(tableName);
    }
    setSelectedTables(newSelected);
  };

  const selectAll = () => {
    setSelectedTables(new Set(tables.map((t) => t.name)));
  };

  const deselectAll = () => {
    setSelectedTables(new Set());
  };

  const handleExport = async () => {
    if (!client?.id || selectedTables.size === 0) return;

    setExporting(true);
    try {
      const data = await dataExportApiClient.exportData(
        client.id,
        Array.from(selectedTables)
      );

      // Create JSON file and download
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("L'export a échoué. Veuillez réessayer.");
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !client?.id) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const data: ExportResult = JSON.parse(text);

      // Validate that data is an object with arrays
      if (typeof data !== "object" || data === null) {
        throw new Error("Format de fichier invalide");
      }

      const result = await dataExportApiClient.importData(client.id, data);
      setImportResult(result);
    } catch (error) {
      console.error("Import failed:", error);
      alert(
        `L'import a échoué: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getTotalStats = () => {
    if (!importResult) return { imported: 0, skipped: 0, errors: 0 };
    return Object.values(importResult).reduce(
      (acc, table) => ({
        imported: acc.imported + table.imported,
        skipped: acc.skipped + table.skipped,
        errors: acc.errors + table.errors.length,
      }),
      { imported: 0, skipped: 0, errors: 0 }
    );
  };

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Import / Export" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">Import / Export</Heading>
        <Info className="mt-4 block">
          Exportez vos données (contacts, articles, factures, etc.) au format
          JSON.
        </Info>

        <Card className="mt-8">
          <Heading size="4" className="mb-4">
            Export des données
          </Heading>

          <Flex gap="2" className="mb-4">
            <Button
              size="2"
              variant="soft"
              onClick={selectAll}
              disabled={loading}
            >
              Tout sélectionner
            </Button>
            <Button
              size="2"
              variant="soft"
              onClick={deselectAll}
              disabled={loading}
            >
              Tout désélectionner
            </Button>
            <div className="flex-1" />
            <Button
              size="2"
              onClick={handleExport}
              disabled={selectedTables.size === 0 || exporting}
            >
              <Download size={16} />
              {exporting
                ? "Export en cours..."
                : `Exporter (${selectedTables.size})`}
            </Button>
          </Flex>

          {loading ? (
            <Text>Chargement des tables...</Text>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tables.map((table) => (
                <label
                  key={table.name}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedTables.has(table.name)}
                    onCheckedChange={() => toggleTable(table.name)}
                  />
                  <div className="flex-1">
                    <Text size="2" weight="medium">
                      {table.label}
                    </Text>
                    <Text size="1" color="gray" className="block">
                      {table.name}
                    </Text>
                  </div>
                </label>
              ))}
            </div>
          )}

          {tables.length === 0 && !loading && (
            <Text color="gray">Aucune table disponible</Text>
          )}
        </Card>

        <Card className="mt-6">
          <Heading size="4" className="mb-4">
            Import des données
          </Heading>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json"
            className="hidden"
          />

          <Flex gap="2" className="mb-4">
            <Button size="2" onClick={handleImportClick} disabled={importing}>
              <Upload size={16} />
              {importing
                ? "Import en cours..."
                : "Sélectionner un fichier JSON"}
            </Button>
          </Flex>

          <Text size="2" color="gray" className="mb-4 block">
            Sélectionnez un fichier JSON précédemment exporté. Les données
            existantes avec le même identifiant seront ignorées (pas de
            duplication).
          </Text>

          {importResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <Heading size="3" className="mb-3">
                Résultat de l'import
              </Heading>

              <Flex gap="4" className="mb-4">
                <Flex align="center" gap="1">
                  <CheckCircle size={16} className="text-green-600" />
                  <Text size="2">{getTotalStats().imported} importé(s)</Text>
                </Flex>
                <Flex align="center" gap="1">
                  <AlertCircle size={16} className="text-yellow-600" />
                  <Text size="2">{getTotalStats().skipped} ignoré(s)</Text>
                </Flex>
                {getTotalStats().errors > 0 && (
                  <Flex align="center" gap="1">
                    <XCircle size={16} className="text-red-600" />
                    <Text size="2">{getTotalStats().errors} erreur(s)</Text>
                  </Flex>
                )}
              </Flex>

              <div className="space-y-2">
                {Object.entries(importResult).map(([tableName, result]) => (
                  <div
                    key={tableName}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <Text size="2" weight="medium">
                      {tableName}
                    </Text>
                    <Flex gap="3">
                      <Text size="1" color="green">
                        +{result.imported}
                      </Text>
                      <Text size="1" color="yellow">
                        ~{result.skipped}
                      </Text>
                      {result.errors.length > 0 && (
                        <Text size="1" color="red">
                          ✗{result.errors.length}
                        </Text>
                      )}
                    </Flex>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="mt-6" variant="surface">
          <Heading size="3" className="mb-2">
            ℹ️ Informations
          </Heading>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>
              Les données exportées incluent les enregistrements supprimés
            </li>
            <li>Le format d'export et d'import est JSON</li>
            <li>
              L'import ignore les enregistrements déjà existants (même client_id
              + id)
            </li>
            <li>Seules les données de votre organisation sont exportées</li>
          </ul>
        </Card>
      </div>
    </Page>
  );
};
