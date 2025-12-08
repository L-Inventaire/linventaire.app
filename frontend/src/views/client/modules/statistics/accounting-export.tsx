import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import Select from "@atoms/input/input-select";
import { Input } from "@atoms/input/input-text";
import { ModalContent } from "@atoms/modal/modal";
import { Info } from "@atoms/text";
import { useCurrentClient } from "@features/clients/state/use-clients";
import { StatisticsApiClient } from "@features/statistics/api-client/api-client";
import { AccountingExportLine } from "@features/statistics/types";
import { useState } from "react";
import * as XLSX from "xlsx";

export const AccountingExportModal = ({ onClose }: { onClose: () => void }) => {
  const { client } = useCurrentClient();
  const [exportType, setExportType] = useState("xlsx");
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState<
    | "all"
    | "invoices"
    | "credit_notes"
    | "supplier_invoices"
    | "supplier_credit_notes"
  >("all");
  const [state, setState] = useState<"all" | "sent" | "closed">("all");

  // Default to first day of current year to today
  const currentYear = new Date().getFullYear();
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const exportData = async () => {
    if (!client?.id) return;

    setLoading(true);

    try {
      const result = await StatisticsApiClient.getAccountingExport(client.id, {
        from: fromDate,
        to: toDate,
        type: documentType,
        state: state,
      });

      if (!result || (result as any).error) {
        throw new Error("Failed to fetch data");
      }

      const lines = result as AccountingExportLine[];

      if (lines.length === 0) {
        alert("Aucune donnée à exporter pour cette période");
        setLoading(false);
        return;
      }

      // Transform data for export with French headers
      const data = lines.map((line) => ({
        "Référence facture": line.invoice_reference,
        "Date émission": line.invoice_emit_date,
        "Type document": getDocumentTypeLabel(line.invoice_type),
        État: getStateLabel(line.invoice_state),
        "Client/Fournisseur": line.contact_name,
        "N° ligne": line.line_index,
        "Référence article": line.line_article_reference,
        Désignation: line.line_article_name,
        Description: line.line_description,
        Quantité: line.line_quantity,
        Unité: line.line_unit,
        "Prix unitaire HT": line.line_unit_price,
        "Total ligne HT": line.line_total_ht,
        "Taux TVA (%)": line.line_tva_rate,
        "Montant TVA": line.line_tva_amount,
        "Total ligne TTC": line.line_total_ttc,
        "Compte comptable": line.accounting_number,
        "Libellé compte": line.accounting_name,
        Catégories: line.tags,
        "Total facture HT": line.invoice_total_ht,
        "Total facture TTC": line.invoice_total_ttc,
      }));

      const fileName = `export-comptable-${fromDate}-${toDate}`;

      if (exportType === "xlsx") {
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Set column widths for better readability
        worksheet["!cols"] = [
          { wch: 15 }, // Référence facture
          { wch: 12 }, // Date émission
          { wch: 18 }, // Type document
          { wch: 10 }, // État
          { wch: 25 }, // Client/Fournisseur
          { wch: 8 }, // N° ligne
          { wch: 15 }, // Référence article
          { wch: 30 }, // Désignation
          { wch: 30 }, // Description
          { wch: 10 }, // Quantité
          { wch: 8 }, // Unité
          { wch: 12 }, // Prix unitaire HT
          { wch: 12 }, // Total ligne HT
          { wch: 12 }, // Taux TVA
          { wch: 12 }, // Montant TVA
          { wch: 12 }, // Total ligne TTC
          { wch: 15 }, // Compte comptable
          { wch: 20 }, // Libellé compte
          { wch: 20 }, // Catégories
          { wch: 15 }, // Total facture HT
          { wch: 15 }, // Total facture TTC
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Export comptable");
        XLSX.writeFile(workbook, `${fileName}.xlsx`, { compression: true });
      } else if (exportType === "csv") {
        const header = Object.keys(data[0]).join(";");
        const csv = data.map((row) =>
          Object.values(row)
            .map((e) => {
              if (
                typeof e === "string" &&
                (e.includes(";") || e.includes('"') || e.includes("\n"))
              ) {
                return `"${e.replace(/"/g, '""')}"`;
              }
              return e;
            })
            .join(";")
        );
        const csvString = "\uFEFF" + header + "\n" + csv.join("\n"); // BOM for UTF-8
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName + ".csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      onClose();
    } catch (error) {
      console.error("Export error:", error);
      alert("Erreur lors de l'export");
    }

    setLoading(false);
  };

  return (
    <ModalContent title="Export comptable">
      <Info className="mb-4">
        Exportez vos factures en mode comptable avec chaque ligne de facture
        indépendante et le numéro de compte comptable associé à l'article. Si
        aucune catégorie/article n'est associé, la case sera vide.
      </Info>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <InputLabel
          label="Date de début"
          input={
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={loading}
            />
          }
        />
        <InputLabel
          label="Date de fin"
          input={
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={loading}
            />
          }
        />
      </div>

      <InputLabel
        className="mb-4"
        label="Type de document"
        input={
          <Select
            value={documentType}
            onChange={(e) =>
              setDocumentType(e.target.value as typeof documentType)
            }
            disabled={loading}
          >
            <option value="all">Tous les documents</option>
            <option value="invoices">Factures clients</option>
            <option value="credit_notes">Avoirs clients</option>
            <option value="supplier_invoices">Factures fournisseurs</option>
            <option value="supplier_credit_notes">Avoirs fournisseurs</option>
          </Select>
        }
      />

      <InputLabel
        className="mb-4"
        label="État"
        input={
          <Select
            value={state}
            onChange={(e) => setState(e.target.value as typeof state)}
            disabled={loading}
          >
            <option value="all">Tous (sauf brouillons)</option>
            <option value="sent">Envoyées</option>
            <option value="closed">Clôturées/Payées</option>
          </Select>
        }
      />

      <InputLabel
        className="mb-4"
        label="Format d'export"
        input={
          <Select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            disabled={loading}
          >
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (séparateur ;)</option>
          </Select>
        }
      />

      <Button
        theme="primary"
        className="w-full mt-2"
        disabled={loading || !client?.id}
        loading={loading}
        onClick={exportData}
      >
        Exporter
      </Button>
    </ModalContent>
  );
};

const getDocumentTypeLabel = (type: string): string => {
  switch (type) {
    case "invoices":
      return "Facture client";
    case "credit_notes":
      return "Avoir client";
    case "supplier_invoices":
      return "Facture fournisseur";
    case "supplier_credit_notes":
      return "Avoir fournisseur";
    default:
      return type;
  }
};

const getStateLabel = (state: string): string => {
  switch (state) {
    case "draft":
      return "Brouillon";
    case "sent":
      return "Envoyée";
    case "closed":
      return "Clôturée";
    case "purchase_order":
      return "Bon de commande";
    case "completed":
      return "Terminé";
    case "recurring":
      return "Récurrent";
    default:
      return state;
  }
};
