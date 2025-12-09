import { Info } from "@atoms/text";
import { Heading, Button, Checkbox, Card, Flex, Text } from "@radix-ui/themes";
import { Page } from "../../_layout/page";
import { useEffect, useState } from "react";
import { useCurrentClient } from "@features/clients/state/use-clients";
import {
  dataExportApiClient,
  AvailableTable,
} from "@features/data-export/api-client";
import { Download } from "lucide-react";

export const ImportExportPage = () => {
  const { client } = useCurrentClient();
  const [tables, setTables] = useState<AvailableTable[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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

        <Card className="mt-6" variant="surface">
          <Heading size="3" className="mb-2">
            ℹ️ Informations
          </Heading>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>
              Les données exportées incluent les enregistrements supprimés
            </li>
            <li>Le format d'export est JSON</li>
            <li>
              L'import n'est pas encore disponible (nécessite une stratégie de
              fusion)
            </li>
            <li>Seules les données de votre organisation sont exportées</li>
          </ul>
        </Card>
      </div>
    </Page>
  );
};
